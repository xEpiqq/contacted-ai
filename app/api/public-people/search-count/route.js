// /app/api/public-people/search-count/route.js
import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";
import { buildESQueryFromFilters } from "@/utils/elasticsearch/buildQuery";

/** Same as private search-count but no auth */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  let indexName = searchParams.get("table_name") || "usa4_new_v2";
  if (indexName === "apo") indexName = "abo";

  let filters = [];
  try {
    const f = searchParams.get("filters");
    filters = f ? JSON.parse(f) : [];
    if (!Array.isArray(filters)) filters = [];
  } catch {}

  try {
    const esQuery = buildESQueryFromFilters(filters);
    const { count } = await esClient.count({
      index: indexName,
      query: esQuery,
    });
    return NextResponse.json({ matchingCount: count });
  } catch (err) {
    console.error("[PUBLIC COUNT] ES error:", err);
    return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
  }
}
