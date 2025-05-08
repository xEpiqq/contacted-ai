// /app/api/people/enrichment/route.js
import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

const FIELD_MAP = {
  eap1_new_v2: "person_linkedin_url",
  otc1_new_v2: "linkedin_url",
  pdl4_new_v2: "linkedin_url",
  usa4_new_v2: "LinkedIn Url",
  deez_3_v3: "linkedin_url", // for local biz DB
};

const PHONE_FIELDS = ["phone_number", "person_phone", "phone", "phone numbers", "Mobile"];
const EMAIL_FIELDS = ["email", "person_email", "Emails", "person_email_analyzed"];

/** Standardize a LinkedIn URL */
function standardizeLinkedInUrl(url) {
  if (!url) return "";
  let s = url.trim().split("?")[0];
  const lower = s.toLowerCase();
  const idx = lower.indexOf("/in/");
  if (idx === -1) return "";
  s = s.substring(idx).replace(/\/+$/, "");
  return `https://www.linkedin.com${s}`;
}

// Simple scoring for doc's phone+email coverage
function docScore(docSource) {
  let score = 0;
  for (const p of PHONE_FIELDS) {
    const val = docSource[p];
    if (val && String(val).trim()) score++;
  }
  for (const e of EMAIL_FIELDS) {
    const val = docSource[e];
    if (val && String(val).trim()) score++;
  }
  return score;
}

export async function POST(request) {
  try {
    const {
      table_name,
      linkedin_urls = [],
      confirm = false,
      csv_rows = [],
      csv_headers = [],
      linkedinHeader = "",
    } = await request.json();

    // 1) Standardize user-supplied LinkedIn URLs
    const rawUrls = linkedin_urls.map((u) => u.trim()).filter(Boolean);
    const fullUrls = rawUrls.map(standardizeLinkedInUrl).filter(Boolean);
    if (!fullUrls.length) return NextResponse.json({ matchingCount: 0 });

    const supabase = await createClient();

    // ================= PREVIEW (confirm === false) =================
    if (!confirm) {
      if (table_name !== "all") {
        // Single index => just return total hits
        const field = FIELD_MAP[table_name] || "linkedin_url";
        const previewRes = await esClient.search({
          index: table_name,
          size: 0,
          query: {
            terms: {
              [`${field}.keyword`]: fullUrls,
            },
          },
        });
        return NextResponse.json({ matchingCount: previewRes.hits.total.value });
      } else {
        // For "all tables", gather and deduplicate
        let allHits = [];
        for (const idxName of Object.keys(FIELD_MAP)) {
          const field = FIELD_MAP[idxName] || "linkedin_url";
          let res = await esClient.search({
            index: idxName,
            size: 10000,
            scroll: "2m",
            query: { terms: { [`${field}.keyword`]: fullUrls } },
          });

          let scrollId = res._scroll_id;
          let hits = res.hits?.hits || [];
          allHits.push(...hits);

          while (hits.length > 0) {
            const scrollRes = await esClient.scroll({
              scroll_id: scrollId,
              scroll: "2m",
            });
            scrollId = scrollRes._scroll_id;
            hits = scrollRes.hits?.hits || [];
            if (!hits.length) break;
            allHits.push(...hits);
          }
        }

        if (!allHits.length) {
          return NextResponse.json({ matchingCount: 0 });
        }

        // Deduplicate by best phone+email coverage
        const docGroups = new Map();
        for (const hit of allHits) {
          const idxName = hit._index;
          const field = FIELD_MAP[idxName] || "linkedin_url";
          const docUrl = standardizeLinkedInUrl(hit._source?.[field] || "");
          if (!docUrl) continue;
          if (!docGroups.has(docUrl)) {
            docGroups.set(docUrl, []);
          }
          docGroups.get(docUrl).push(hit);
        }

        let finalDocs = [];
        for (const [url, docs] of docGroups.entries()) {
          let bestDoc = docs[0];
          let bestVal = docScore(bestDoc._source);
          for (let i = 1; i < docs.length; i++) {
            const val = docScore(docs[i]._source);
            if (val > bestVal) {
              bestDoc = docs[i];
              bestVal = val;
            }
          }
          finalDocs.push(bestDoc);
        }

        return NextResponse.json({ matchingCount: finalDocs.length });
      }
    }

    // =========== CONFIRM (build CSV & charge tokens) =============
    // 2) Auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 3) Profile & token checks
    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("id, tokens_used, tokens_total, one_time_credits, one_time_credits_used")
      .eq("user_id", user.id)
      .single();

    if (profileErr || !profileData) {
      return NextResponse.json({ error: "No profile found." }, { status: 400 });
    }

    const subscriptionUsed = parseInt(profileData.tokens_used || "0", 10);
    const subscriptionTotal = parseInt(profileData.tokens_total || "0", 10);
    const subscriptionLeft = subscriptionTotal - subscriptionUsed;

    const oneTime = parseInt(profileData.one_time_credits || "0", 10);
    const oneTimeUsed = parseInt(profileData.one_time_credits_used || "0", 10);
    const oneTimeLeft = oneTime - oneTimeUsed;

    const totalLeft = subscriptionLeft + oneTimeLeft;

    // 4) Gather all hits
    const indices = table_name === "all" ? Object.keys(FIELD_MAP) : [table_name];
    let allHits = [];

    for (const idxName of indices) {
      const field = FIELD_MAP[idxName] || "linkedin_url";
      let res = await esClient.search({
        index: idxName,
        size: 10000,
        scroll: "2m",
        query: {
          terms: {
            [`${field}.keyword`]: fullUrls,
          },
        },
      });

      let scrollId = res._scroll_id;
      let hits = res.hits?.hits || [];
      allHits.push(...hits);

      while (hits.length > 0) {
        const scrollRes = await esClient.scroll({
          scroll_id: scrollId,
          scroll: "2m",
        });
        scrollId = scrollRes._scroll_id;
        hits = scrollRes.hits?.hits || [];
        if (!hits.length) break;
        allHits.push(...hits);
      }
    }

    if (!allHits.length) {
      return NextResponse.json({ error: "No matches returned." }, { status: 400 });
    }

    // 5) If "all", deduplicate
    let finalDocs = [];
    if (table_name === "all") {
      const docGroups = new Map();
      for (const hit of allHits) {
        const idxName = hit._index;
        const field = FIELD_MAP[idxName] || "linkedin_url";
        const docUrl = standardizeLinkedInUrl(hit._source?.[field] || "");
        if (!docUrl) continue;
        if (!docGroups.has(docUrl)) docGroups.set(docUrl, []);
        docGroups.get(docUrl).push(hit);
      }

      for (const [url, docs] of docGroups.entries()) {
        let bestDoc = docs[0];
        let bestVal = docScore(bestDoc._source);
        for (let i = 1; i < docs.length; i++) {
          const val = docScore(docs[i]._source);
          if (val > bestVal) {
            bestDoc = docs[i];
            bestVal = val;
          }
        }
        finalDocs.push(bestDoc);
      }
    } else {
      finalDocs = allHits;
    }

    const totalMatches = finalDocs.length;

    if (totalMatches > totalLeft) {
      return NextResponse.json(
        { error: `Not enough tokens. Need ${totalMatches}, have ${totalLeft}` },
        { status: 400 }
      );
    }

    // 6) Build CSV
    const docMap = new Map();
    for (const doc of finalDocs) {
      const idxName = doc._index;
      const field = FIELD_MAP[idxName] || "linkedin_url";
      const docUrl = standardizeLinkedInUrl(doc._source?.[field] || "");
      if (docUrl) docMap.set(docUrl, doc);
    }

    // Merged columns => user CSV headers + doc fields
    const allCols = Array.from(
      new Set([...csv_headers, ...finalDocs.flatMap((d) => Object.keys(d._source))])
    );
    let csvContent = allCols.join(",") + "\n";

    for (let userRow of csv_rows) {
      const rowUrl = standardizeLinkedInUrl(userRow[linkedinHeader] || "");
      if (!rowUrl) continue;
      const matchDoc = docMap.get(rowUrl);
      if (!matchDoc) continue;

      const rowFields = allCols.map((col) => {
        if (Object.prototype.hasOwnProperty.call(userRow, col)) {
          return maybeEscape(userRow[col]);
        }
        return maybeEscape(matchDoc._source?.[col] ?? "");
      });
      csvContent += rowFields.join(",") + "\n";
    }

    function maybeEscape(val) {
      val = val == null ? "" : String(val);
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }

    // 7) Upload CSV
    const uniqueName = `user-${user.id}/${Date.now()}-enrichment-${uuidv4()}.csv`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("exports")
      .upload(uniqueName, csvContent, {
        upsert: false,
        contentType: "text/csv",
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    // 8) Deduct tokens from subscription first, then from one-time credits
    let newTokensUsed = subscriptionUsed;
    let newOneTimeUsed = oneTimeUsed;

    if (totalMatches <= subscriptionLeft) {
      newTokensUsed += totalMatches;
    } else {
      const remainder = totalMatches - subscriptionLeft;
      newTokensUsed += subscriptionLeft;
      newOneTimeUsed += remainder;
    }

    // NEW CODE: If we've used exactly all the one-time credits, reset both to 0
    if (newOneTimeUsed === oneTime) {
      newOneTimeUsed = 0;
      // This resets the total one_time_credits to 0 as well
      // because we have used exactly all of it.
      const { error: tokenUpdateErr } = await supabase
        .from("profiles")
        .update({
          tokens_used: newTokensUsed,
          one_time_credits_used: newOneTimeUsed,
          one_time_credits: 0,
        })
        .eq("id", profileData.id);

      if (tokenUpdateErr) {
        return NextResponse.json({ error: "Failed to charge tokens" }, { status: 500 });
      }

      // 9) Insert a record in saved_exports
      const { error: insertErr } = await supabase.from("saved_exports").insert({
        user_id: user.id,
        export_type: "enrichment",
        table_name,
        filters: {
          linkedin_urls: fullUrls,
          crossEnrich: table_name === "all",
          removeDuplicates: table_name === "all",
        },
        columns: allCols,
        row_count: finalDocs.length,
        name: `Enrichment_${table_name}_${new Date().toLocaleString()}`,
        storage_path: uploadData.path,
      });

      if (insertErr) {
        return NextResponse.json({ error: "Saving export record failed" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else {
      // Normal case: we haven't used them all or used less than all
      const { error: tokenUpdateErr } = await supabase
        .from("profiles")
        .update({
          tokens_used: newTokensUsed,
          one_time_credits_used: newOneTimeUsed,
        })
        .eq("id", profileData.id);

      if (tokenUpdateErr) {
        return NextResponse.json({ error: "Failed to charge tokens" }, { status: 500 });
      }

      // 9) Insert a record in saved_exports
      const { error: insertErr } = await supabase.from("saved_exports").insert({
        user_id: user.id,
        export_type: "enrichment",
        table_name,
        filters: {
          linkedin_urls: fullUrls,
          crossEnrich: table_name === "all",
          removeDuplicates: table_name === "all",
        },
        columns: allCols,
        row_count: finalDocs.length,
        name: `Enrichment_${table_name}_${new Date().toLocaleString()}`,
        storage_path: uploadData.path,
      });

      if (insertErr) {
        return NextResponse.json({ error: "Saving export record failed" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
