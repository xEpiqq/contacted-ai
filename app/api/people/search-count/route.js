// app/api/people/search-count/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esClient } from '@/utils/elasticsearch/client';
import { buildESQueryFromFilters } from '@/utils/elasticsearch/buildQuery';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let indexName = searchParams.get('table_name') || 'usa4_new';
  // If you have special rename logic:
  if (indexName === 'apo') indexName = 'abo';

  let filters = [];
  try {
    const f = searchParams.get('filters');
    filters = f ? JSON.parse(f) : [];
    if (!Array.isArray(filters)) filters = [];
  } catch {
    filters = [];
  }

  // Auth via Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Build the ES query
    const esQuery = buildESQueryFromFilters(filters);

    // Count
    const { count } = await esClient.count({
      index: indexName,
      query: esQuery,
    });

    return NextResponse.json({ matchingCount: count });
  } catch (err) {
    console.error('Error fetching matching count from ES:', err);
    return NextResponse.json({ error: 'Failed to fetch matching count' }, { status: 500 });
  }
}
