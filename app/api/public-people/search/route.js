// /app/api/public-people/search/route.js
import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";
import { buildESQueryFromFilters } from "@/utils/elasticsearch/buildQuery";

/**
 * PUBLIC – no Supabase auth check.
 * Identical to /api/people/search but open to everyone.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Which ES index?
  let indexName = searchParams.get("table_name") || "usa4_new_v2";
  if (indexName === "apo") indexName = "abo";

  const limit  = parseInt(searchParams.get("limit")  || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0",  10);

  let filters = [];
  try {
    const f = searchParams.get("filters");
    filters = f ? JSON.parse(f) : [];
    if (!Array.isArray(filters)) filters = [];
  } catch {
    filters = [];
  }

  try {
    const filterQuery = buildESQueryFromFilters(filters);
    const esQuery     = { constant_score: { filter: filterQuery } };

    const esRes = await esClient.search({
      index: indexName,
      from : offset,
      size : limit,
      query: esQuery,
      request_cache: true,
      preference   : "public-demo",
    });

    const results = esRes.hits?.hits?.map((h) => h._source) || [];
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[PUBLIC SEARCH] ES error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
