import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { esClient } from "@/utils/elasticsearch/client";

/**
 * GET /api/people/distinct-values?table_name=someIndex&column=myField&limit=50
 * Returns an array of up to `limit` most frequent distinct values for that column.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table_name") || "";
    const column = searchParams.get("column") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // 1) Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!tableName || !column) {
      return NextResponse.json(
        { error: "Missing table_name or column" },
        { status: 400 }
      );
    }

    // 2) Basic terms aggregation to get top N distinct values
    const esRes = await esClient.search({
      index: tableName,
      size: 0,
      aggs: {
        distinct_vals: {
          terms: {
            field: `${column}.keyword`, // assuming `.keyword` subfield
            size: limit,
            shard_size: Math.max(limit, 100),
          },
        },
      },
    });

    const buckets = esRes.aggregations?.distinct_vals?.buckets || [];
    const distinctValues = buckets.map((b) => b.key);

    return NextResponse.json({ distinctValues });
  } catch (err) {
    console.error("[Distinct-Values] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
