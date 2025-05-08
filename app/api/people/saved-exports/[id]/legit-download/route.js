import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * This route:
 *  1) Authenticates user
 *  2) Looks up the saved_export record by :id
 *  3) Fetches the CSV from Supabase Storage using storage_path
 *  4) Returns the CSV as an attachment
 *
 *  URL: /api/people/saved-exports/[id]/legit-download
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

    // 1) Load the saved export
    const { data: saved, error: fetchError } = await supabase
      .from('saved_exports')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    if (fetchError || !saved) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }
    if (!saved.storage_path) {
      return NextResponse.json(
        { error: 'This export does not have a storage_path' },
        { status: 400 }
      );
    }

    // 2) Grab the CSV from Supabase Storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('exports')
      .download(saved.storage_path);

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    // 3) Return as an attachment
    const csvBuffer = await fileData.arrayBuffer();
    return new Response(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${saved.name.replace(/\s+/g, '_')}.csv"`,
      },
    });
  } catch (err) {
    console.error('[LEGIT-DOWNLOAD] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
