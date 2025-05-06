import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";

/* ---------- config ---------- */
const FIELD_MAP = {
  eap1_new_v2: "person_linkedin_url",
  otc1_new_v2: "linkedin_url",
  pdl4_new_v2: "linkedin_url",
  usa4_new_v2: "LinkedIn Url",
  deez_3_v3: "linkedin_url",
};
const INDICES = Object.keys(FIELD_MAP);

/* ---------- helpers ---------- */
function standardize(url = "") {
  const trimmed = url.trim().split("?")[0].toLowerCase();
  const idx = trimmed.indexOf("/in/");
  if (idx === -1) return "";
  return "https://www.linkedin.com" + trimmed.substring(idx).replace(/\/+$/, "");
}

function docScore(src = {}) {
  const phones = ["phone_number", "person_phone", "phone", "phone numbers", "Mobile"];
  const emails = ["email", "person_email", "Emails", "person_email_analyzed"];
  let score = 0;
  for (const p of phones) if (src[p]) score++;
  for (const e of emails) if (src[e]) score++;
  return score;
}

export async function POST(req) {
  try {
    const {
      confirm = false,
      linkedin_urls = [],
      csv_rows = [],
      csv_headers = [],
      linkedinHeader = "",
    } = await req.json();

    const urls = linkedin_urls.map(standardize).filter(Boolean);
    if (!urls.length)
      return NextResponse.json({ error: "No valid URLs supplied." }, { status: 400 });

    /* ---------- gather hits from ES ---------- */
    let allHits = [];
    for (const index of INDICES) {
      const field = FIELD_MAP[index];
      let res = await esClient.search({
        index,
        size: 10000,
        scroll: "2m",
        query: { terms: { [`${field}.keyword`]: urls } },
      });

      let scrollId = res._scroll_id;
      let hits = res.hits?.hits || [];
      allHits.push(...hits);

      while (hits.length > 0) {
        const more = await esClient.scroll({ scroll_id: scrollId, scroll: "2m" });
        scrollId = more._scroll_id;
        hits = more.hits?.hits || [];
        if (!hits.length) break;
        allHits.push(...hits);
      }
    }

    if (!confirm) {
      // -------- preview mode --------
      const uniq = new Set(
        allHits.map((h) => standardize(h._source[FIELD_MAP[h._index]]))
      );
      return NextResponse.json({ matchingCount: uniq.size });
    }

    /* ---------- deduplicate by best coverage ---------- */
    const byUrl = new Map();
    for (const h of allHits) {
      const url = standardize(h._source[FIELD_MAP[h._index]]);
      if (!url) continue;
      const best = byUrl.get(url);
      if (!best || docScore(h._source) > docScore(best._source)) byUrl.set(url, h);
    }
    const finalDocs = Array.from(byUrl.values());

    if (!finalDocs.length)
      return NextResponse.json({ error: "No matches." }, { status: 400 });

    /* ---------- build CSV ---------- */
    const allCols = Array.from(
      new Set([...csv_headers, ...finalDocs.flatMap((d) => Object.keys(d._source))])
    );
    const lines = [];
    lines.push(allCols.join(","));

    for (const row of csv_rows) {
      const url = standardize(row[linkedinHeader] || "");
      if (!url) continue;
      const hit = byUrl.get(url);
      if (!hit) continue;

      const fields = allCols.map((c) =>
        csv_headers.includes(c)
          ? maybe(row[c])
          : maybe(hit._source[c] ?? "")
      );
      lines.push(fields.join(","));
    }

    function maybe(v) {
      v = v == null ? "" : String(v);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }

    const csvContent = lines.join("\n");
    const headers = {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="enriched_${Date.now()}.csv"`,
    };
    return new Response(csvContent, { headers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
