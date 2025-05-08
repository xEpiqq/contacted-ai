// app/api/people/saved-exports/[id]/download/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esClient } from '@/utils/elasticsearch/client';

/**
 * For "search_table": we have saved { table_name, filters, row_count }
 *   => re-run the ES search with the same filters, up to row_count
 *
 * For "enrichment": we have saved { table_name, filters.linkedin_urls, ... }
 *   => re-run matching by linkedin_urls
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 1) Fetch the saved export
    const { data: saved, error: fetchError } = await supabase
      .from('saved_exports')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    if (fetchError || !saved) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    const { export_type, table_name, filters, columns, row_count, name } = saved;
    let indexName = table_name === 'apo' ? 'abo' : table_name; // rename

    let rowData = [];
    if (export_type === 'search_table') {
      // Re-run the same "filters" as an ES query
      // If needed, handle large row_count with scroll. Below is the simple approach
      const esQuery = filters && filters.length ? { bool: { should: [] } } : { match_all: {} };
      // If you stored the entire query, you'd rebuild. Otherwise re-check your UI logic:
      //   Use a helper to build the query from the filters, as we do in /search
      // For brevity, let's import the same helper if you prefer:
      //   import { buildESQueryFromFilters } from '@/utils/elasticsearch/buildQuery';

      // If you can store the original filters array, you can do:
      //   const esQuery = buildESQueryFromFilters(filters || []);
      // For brevity:
      let builtQuery;
      try {
        const { buildESQueryFromFilters } = await import('@/utils/elasticsearch/buildQuery');
        builtQuery = buildESQueryFromFilters(filters || []);
      } catch (e) {
        builtQuery = { match_all: {} };
      }

      const esRes = await esClient.search({
        index: indexName,
        size: Math.min(row_count, 10000),
        query: builtQuery,
      });
      rowData = esRes.hits?.hits?.map((h) => h._source) || [];
    } else if (export_type === 'enrichment') {
      const linkedinArr = filters?.linkedin_urls || [];
      // Re-run the same "term" matching logic
      const shouldClauses = linkedinArr.map((oneUrl) => ({
        term: { linkedin_url: oneUrl },
      }));
      const esQuery = {
        bool: {
          should: shouldClauses,
          minimum_should_match: 1,
        },
      };
      const esRes = await esClient.search({
        index: indexName,
        size: Math.min(row_count, 10000),
        query: esQuery,
      });
      rowData = esRes.hits?.hits?.map((h) => h._source) || [];
    } else {
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
    }

    if (!rowData.length) {
      return NextResponse.json({ error: 'No data found.' }, { status: 400 });
    }

    // 2) Figure out final columns
    let finalCols = columns && columns.length ? columns : [];
    if (!finalCols.length) {
      finalCols = Object.keys(rowData[0]);
    }

    // 3) Build CSV
    let csv = finalCols.join(',') + '\n';
    rowData.forEach((row) => {
      const line = finalCols
        .map((col) => {
          let val = row[col] ?? '';
          val = String(val);
          if (val.includes(',') || val.includes('"')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',');
      csv += line + '\n';
    });

    // 4) Return CSV
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${name.replace(/\s+/g, '_')}.csv"`,
      },
    });
  } catch (err) {
    console.error('[DOWNLOAD] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
