import { NextResponse } from 'next/server';
import { createClient } from '../../../../../utils/supabase/server';

// GET single saved export
export async function GET(request, { params }) {
  const supabase = await createClient();
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
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    console.error('Error fetching saved export:', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ export: data });
}

// Update (rename) a saved export
export async function PUT(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  const { error } = await supabase
    .from('saved_exports')
    .update({ name })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating export name:', error);
    return NextResponse.json({ error: 'Failed to rename export' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Delete a saved export
export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { error } = await supabase
    .from('saved_exports')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting saved export:', error);
    return NextResponse.json({ error: 'Failed to delete export' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
