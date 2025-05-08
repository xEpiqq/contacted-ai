// app/api/chrome-extension/legit-download/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// optional: export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // (If you want to require auth, uncomment this block)
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();
    // if (!user || authError) {
    //   return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    // }

    // Attempt to download the .zip from "exports/chrome-extension/"
    const path = "chrome-ext.zip";
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("chrome-ext")
      .download(path);

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Convert to ArrayBuffer
    const fileBuffer = await fileData.arrayBuffer();

    // Return as an attachment
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="koldinfo-chrome-ext.zip"',
      },
    });
  } catch (err) {
    console.error("[CHROME-EXT-DOWNLOAD ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
