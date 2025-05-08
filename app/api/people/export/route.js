// /app/api/people/export/route.js
import { esClient as elastic } from '@/utils/elasticsearch/client';
import { buildESQueryFromFilters } from '@/utils/elasticsearch/buildQuery';
import { createClient } from '@/utils/supabase/server';

function toCSV(data, columns) {
  if (!data.length) return '';
  const fields = columns?.length
    ? columns
    : [...new Set(data.flatMap((d) => Object.keys(d._source || {})))];

  const header = fields.join(',');
  const rows = data.map((d) =>
    fields
      .map((col) => {
        let val = d._source?.[col] ?? '';
        if (typeof val !== 'string') val = String(val);
        if (val.includes(',') || val.includes('"')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * SSE Export route:
 *   - Will fetch up to `limit` rows from ES.
 *   - Then updates usage in profiles: tokens_used or one_time_credits_used
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let indexName = searchParams.get('table_name') || 'usa';
  if (indexName === 'apo') indexName = 'abo';

  let limit = parseInt(searchParams.get('limit') || '0', 10) || 0;
  if (limit <= 0) limit = 10000; // fallback

  let filters = [];
  try {
    filters = JSON.parse(searchParams.get('filters') || '[]');
    if (!Array.isArray(filters)) filters = [];
  } catch {}

  const columnsParam = searchParams.get('columns');
  const columns = columnsParam ? columnsParam.split(',') : [];

  // SSE setup
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(obj) {
        const payload = JSON.stringify(obj);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }

      let tokensCharged = false;
      const supabase = await createClient();

      try {
        // 1) Auth
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (!user || authError) {
          sendEvent({ error: 'Not authenticated' });
          controller.close();
          return;
        }

        // 2) Check user’s tokens & one_time usage
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, tokens_used, tokens_total, one_time_credits, one_time_credits_used')
          .eq('user_id', user.id)
          .single();

        if (!profileData) {
          sendEvent({ error: 'No profile found. Cannot charge tokens.' });
          controller.close();
          return;
        }

        const subscriptionUsed = parseInt(profileData.tokens_used || '0', 10);
        const subscriptionTotal = parseInt(profileData.tokens_total || '0', 10);
        const subscriptionLeft = subscriptionTotal - subscriptionUsed;

        const oneTime = parseInt(profileData.one_time_credits || '0', 10);
        const oneTimeUsed = parseInt(profileData.one_time_credits_used || '0', 10);
        const oneTimeLeft = oneTime - oneTimeUsed;

        const totalLeft = subscriptionLeft + oneTimeLeft;

        if (limit > totalLeft) {
          sendEvent({
            error: `Not enough tokens. Need ${limit}, have ${totalLeft}`,
          });
          controller.close();
          return;
        }

        // 3) Build ES query
        const filterQuery = buildESQueryFromFilters(filters);
        const esSearchQuery = { constant_score: { filter: filterQuery } };

        // 4) Scroll search
        let res = await elastic.search({
          index: indexName,
          scroll: '2m',
          size: Math.min(limit, 10000),
          query: esSearchQuery,
        });

        let scrollId = res._scroll_id;
        let hits = res.hits?.hits || [];
        const allHits = [...hits];
        let fetched = hits.length;

        let progress = Math.round((fetched / limit) * 100);
        sendEvent({ progress: progress > 100 ? 100 : progress });

        while (hits.length && fetched < limit) {
          res = await elastic.scroll({ scroll_id: scrollId, scroll: '2m' });
          scrollId = res._scroll_id;
          hits = res.hits?.hits || [];
          const needed = limit - fetched;
          const chunk = hits.slice(0, needed);
          allHits.push(...chunk);
          fetched += chunk.length;

          progress = Math.round((fetched / limit) * 100);
          sendEvent({ progress: progress > 100 ? 100 : progress });

          if (chunk.length < hits.length) break;
        }

        // 5) Build CSV in-memory
        const csv = toCSV(allHits, columns);

        // 6) Upload to Supabase Storage
        const uniqueName = `user-${user.id}/${Date.now()}-export.csv`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('exports')
          .upload(uniqueName, csv, {
            upsert: false,
            contentType: 'text/csv',
          });

        if (uploadErr) {
          sendEvent({ error: `Storage upload failed: ${uploadErr.message}` });
          controller.close();
          return;
        }

        // 7) Charge tokens for the actual rows exported
        const rowsExported = allHits.length; // may be less than 'limit'
        if (rowsExported > totalLeft) {
          sendEvent({ error: `Not enough tokens to pay for ${rowsExported} rows.` });
          controller.close();
          return;
        }

        let newTokensUsed = subscriptionUsed;
        let newOneTimeUsed = oneTimeUsed;

        if (rowsExported <= subscriptionLeft) {
          newTokensUsed += rowsExported;
        } else {
          const remainder = rowsExported - subscriptionLeft;
          newTokensUsed += subscriptionLeft;
          newOneTimeUsed += remainder;
        }

        // Check if exactly all one-time credits were used
        if (newOneTimeUsed === oneTime) {
          // Reset both to 0
          const { error: tokenErr } = await supabase
            .from('profiles')
            .update({
              tokens_used: newTokensUsed,
              one_time_credits_used: 0,
              one_time_credits: 0,
            })
            .eq('id', profileData.id);

          if (tokenErr) {
            sendEvent({ error: 'Failed to charge tokens' });
            controller.close();
            return;
          }
          tokensCharged = true;
        } else {
          // Normal update if we haven't exactly used them all
          const { error: tokenErr } = await supabase
            .from('profiles')
            .update({
              tokens_used: newTokensUsed,
              one_time_credits_used: newOneTimeUsed,
            })
            .eq('id', profileData.id);

          if (tokenErr) {
            sendEvent({ error: 'Failed to charge tokens' });
            controller.close();
            return;
          }
          tokensCharged = true;
        }

        // 8) Insert record in "saved_exports"
        const { error: dbError } = await supabase.from('saved_exports').insert({
          user_id: user.id,
          export_type: 'search_table',
          table_name: indexName,
          filters: filters,
          columns: columns,
          row_count: rowsExported,
          name: `${indexName} export @ ${new Date().toLocaleString()}`,
          storage_path: uploadData?.path,
        });
        if (dbError) {
          sendEvent({ error: 'Saving export record failed' });
          controller.close();
          return;
        }

        // 9) Done
        sendEvent({ status: 'done', rowCount: rowsExported });
      } catch (err) {
        console.error('[Export SSE error]', err);
        if (tokensCharged) {
          // We already updated usage. Typically we won't roll that back here.
        }
        const msg = err?.message || 'Server error';
        try {
          const short = msg.length > 200 ? msg.slice(0, 200) + '...' : msg;
          sendEvent({ error: short });
        } catch {}
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
