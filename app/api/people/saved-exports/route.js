import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // get user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('saved_exports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing saved_exports:', error);
    return NextResponse.json({ error: 'Failed to list exports' }, { status: 500 });
  }

  return NextResponse.json({ exports: data });
}

// Optionally handle POST if you want to create from UI (or from SSE completion)
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { table_name, filters, columns, row_count, name, export_type } = body;

  const { error } = await supabase.from('saved_exports').insert({
    user_id: user.id,
    table_name,
    filters: filters || [],
    columns: columns || [],
    row_count: row_count || 0,
    name: name || 'Untitled export',
    export_type: export_type || 'search_table'
  });

  if (error) {
    console.error('Error creating saved export:', error);
    return NextResponse.json({ error: 'Failed to create saved export' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
