import { NextResponse } from 'next/server';
import { esClient } from '@/lib/elasticsearch';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let indexName = searchParams.get('table_name') || 'usa';
  if (indexName === 'apo') indexName = 'abo';

  // If you'd rather skip hitting ES altogether (since you have a hard-coded total),
  // you could just return { totalCount: SOME_NUMBER } here.
  // But if you still want to query ES, here's how:
  try {
    const countRes = await esClient.count({
      index: indexName,
      query: { match_all: {} },
      request_cache: true,
      preference: 'table_count',
    });
    return NextResponse.json({ totalCount: countRes.count });
  } catch (err) {
    console.error('Error fetching table_count from Elasticsearch:', err);
    return NextResponse.json({ error: 'Failed to fetch table_count' }, { status: 500 });
  }
}
