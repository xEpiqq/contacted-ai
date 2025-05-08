import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esClient } from '@/utils/elasticsearch/client';

/**
 * GET => Returns columns from Elasticsearch for `table_name` + user’s saved columns/filters.
 * POST => Upserts user’s chosen columns + filters in `user_table_settings`.
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let indexName = searchParams.get('table_name') || 'usa';
  if (indexName === 'apo') indexName = 'abo'; // rename for ES if needed

  try {
    // 1) Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2) Fetch columns from Elasticsearch mapping
    const mappingRes = await esClient.indices.getMapping({ index: indexName });
    const props = mappingRes[indexName]?.mappings?.properties || {};
    const columns = Object.keys(props);

    // 3) Fetch user’s saved column+filter settings
    const { data: savedSettings } = await supabase
      .from('user_table_settings')
      .select('columns, filters')
      .eq('user_id', user.id)
      .eq('table_name', indexName)
      .single();

    const userColumns = savedSettings?.columns || [];
    const userFilters = savedSettings?.filters || [];

    return NextResponse.json({
      columns,
      userColumns,
      userFilters,
    });
  } catch (err) {
    console.error('GET /columns error:', err);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1) Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2) Parse body
    const body = await request.json();
    let { table_name, columns, filters } = body || {};
    if (!table_name) {
      return NextResponse.json({ error: 'table_name required' }, { status: 400 });
    }
    if (!Array.isArray(columns)) columns = [];
    if (!Array.isArray(filters)) filters = [];

    // rename if needed
    if (table_name === 'apo') {
      table_name = 'abo';
    }

    // 3) Upsert user’s settings
    const { error: upsertErr } = await supabase
      .from('user_table_settings')
      .upsert({
        user_id: user.id,
        table_name,
        columns,
        filters,
      });

    if (upsertErr) {
      console.error('Upsert error:', upsertErr);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /columns error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
