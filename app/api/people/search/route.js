// app/api/people/search/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esClient } from '@/utils/elasticsearch/client';
import { buildESQueryFromFilters } from '@/utils/elasticsearch/buildQuery';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let indexName = searchParams.get('table_name') || 'usa4_new';
  if (indexName === 'apo') indexName = 'abo'; // rename logic if needed

  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let filters = [];
  try {
    const f = searchParams.get('filters');
    filters = f ? JSON.parse(f) : [];
    if (!Array.isArray(filters)) filters = [];
  } catch {
    filters = [];
  }

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Build a "constant_score" wrapper for filters => faster than scoring queries.
    const filterQuery = buildESQueryFromFilters(filters);
    const esQuery = {
      constant_score: {
        filter: filterQuery,
      },
    };

    const esRes = await esClient.search({
      index: indexName,
      from: offset,
      size: limit,
      query: esQuery,
      request_cache: true, // shard-level caching
      preference: user.id, // route repeated queries from this user to the same shard
    });

    // Map hits to `_source`
    const results = esRes.hits?.hits?.map((h) => h._source) || [];
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Error fetching data from ES:', err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
