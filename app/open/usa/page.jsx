// /app/open/usa/page.jsx
"use client";

import PublicSearchTablePage from "@/components/PublicSearchTablePage";

export default function UsaOpenPage() {
  return (
    <PublicSearchTablePage
      /* the same ES index used in the private page */
      tableName="usa4_new_v2"
      pageTitle="USA Job DB – Public Demo"
      /* pick whichever four‑ish columns you want to show by default */
      defaultColumns={[
        "Full name",
        "Job title",
        "Emails",
        "Phone numbers",
      ]}
      /* hard‑coded total for quick display (matches protected page) */
      totalCount={31_177_584}
    />
  );
}
