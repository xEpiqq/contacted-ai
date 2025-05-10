// Levenshtein distance function for string comparison
export function levenshtein(a = "", b = "") {
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// Find closest type based on input string
export function closestType(input) {
  const cleaned = input.trim().toLowerCase();
  if (cleaned.startsWith("p")) return "people";
  if (cleaned.startsWith("l")) return "local biz";
  if (cleaned.startsWith("b")) return "local biz";
  return levenshtein(cleaned, "people") <= levenshtein(cleaned, "local biz")
    ? "people"
    : "local biz";
}

// CSS style blocks as strings
export const tooltipStyles = `
  .tooltip {
    position: relative;
  }
  .tooltip::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 8px;
    border-radius: 4px;
    background-color: #333;
    color: white;
    font-size: 10px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    z-index: 10;
    pointer-events: none;
    margin-bottom: 5px;
  }
  .tooltip:hover::before {
    opacity: 1;
    visibility: visible;
  }
`;

export const tableScrollbarStyles = `
  /* Table scrollbar styles */
  .table-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  .table-scrollbar::-webkit-scrollbar-track {
    background: rgba(20, 20, 20, 0.2);
    border-radius: 3px;
  }
  
  .table-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(50, 50, 50, 0.7);
    border-radius: 3px;
  }
  
  .table-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(70, 70, 70, 0.8);
  }
  
  .table-scrollbar::-webkit-scrollbar-corner {
    background: rgba(20, 20, 20, 0.2);
  }
  
  /* For Firefox */
  .table-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(50, 50, 50, 0.7) rgba(20, 20, 20, 0.2);
  }

  /* Wave animation for loading ellipsis */
  @keyframes waveAnimation {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-3px); }
    75% { transform: translateY(3px); }
  }
  
  .wave-dot {
    display: inline-block;
    animation: waveAnimation 1.5s infinite ease-in-out;
  }
  
  .wave-dot:nth-child(1) { animation-delay: 0s; }
  .wave-dot:nth-child(2) { animation-delay: 0.2s; }
  .wave-dot:nth-child(3) { animation-delay: 0.4s; }
`;

// Sample data for UI elements
export const jobTitleExamples = [
  "owner",
  "president",
  "teacher",
  "manager",
  "chief executive officer",
  "project manager",
  "registered nurse",
  "vice president",
  "office manager",
  "director",
  "administrative assistant",
  "realtor",
  "general manager",
  "partner",
  "principal",
  "sales",
  "consultant",
  "account manager",
  "attorney",
  "software engineer",
  "executive director",
  "operations manager",
  "account executive",
  "sales manager",
  "sales representative"
];

export const localBizExamples = [
  "local coffee shop",
  "family-owned bakery",
  "neighborhood gym",
  "downtown florist",
  "independent bookstore",
  "pet grooming salon",
];

export const industryExamples = [
  "software",
  "healthcare",
  "finance",
  "manufacturing",
  "education",
  "retail",
  "construction",
  "hospitality",
  "renewable energy",
  "transportation",
  "agriculture",
];

export const badgeColors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "zinc",
]; 