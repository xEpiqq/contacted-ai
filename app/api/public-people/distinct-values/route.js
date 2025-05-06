// /app/api/public-people/distinct-values/route.js
import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";

/**
 * GET /api/public-people/distinct-values?table_name=...&column=...&limit=50
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table_name") || "";
    const column    = searchParams.get("column")     || "";
    const limit     = parseInt(searchParams.get("limit") || "100", 10);

    if (!tableName || !column) {
      return NextResponse.json(
        { error: "Missing table_name or column" },
        { status: 400 }
      );
    }

    const esRes = await esClient.search({
      index: tableName,
      size : 0,
      aggs : {
        distinct_vals: {
          terms: {
            field: `${column}.keyword`,
            size : limit,
            shard_size: Math.max(limit, 100),
          },
        },
      },
    });

    const buckets = esRes.aggregations?.distinct_vals?.buckets || [];
    const distinctValues = buckets.map((b) => b.key);

    return NextResponse.json({ distinctValues });
  } catch (err) {
    console.error("[PUBLIC DISTINCT] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
