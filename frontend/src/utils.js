export const SCORE_LABELS = { skills: "Skills", experience: "Experience", location: "Location", role_scope: "Role scope" };
export const SCORE_ENTRIES = Object.entries(SCORE_LABELS);
export const scoreClass = (s) => s >= 70 ? "score-green" : s >= 45 ? "score-amber" : "score-red";

export function filterAndSortJobs(jobs, { search, sortBy, minScore }) {
  let result = jobs;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (j) =>
        (j.company || "").toLowerCase().includes(q) ||
        (j.title || "").toLowerCase().includes(q)
    );
  }

  if (minScore > 0) {
    result = result.filter((j) => j.fit_score != null && j.fit_score >= minScore);
  }

  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case "date_asc":
        return new Date(a.created_at) - new Date(b.created_at);
      case "score_desc": {
        if (a.fit_score == null && b.fit_score == null) return 0;
        if (a.fit_score == null) return 1;
        if (b.fit_score == null) return -1;
        return b.fit_score - a.fit_score;
      }
      case "score_asc": {
        if (a.fit_score == null && b.fit_score == null) return 0;
        if (a.fit_score == null) return 1;
        if (b.fit_score == null) return -1;
        return a.fit_score - b.fit_score;
      }
      case "company_asc":
        return (a.company || "").localeCompare(b.company || "");
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "date_desc":
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return result;
}

export function normalizeSalary(raw) {
  if (!raw || !raw.trim()) return null;

  const s = raw.trim();

  // Detect /hr or /yr suffix
  const suffixMatch = s.match(/\/(hr|hour|year|yr)$/i);
  const suffix = suffixMatch
    ? "/" + (suffixMatch[1].toLowerCase().startsWith("h") ? "hr" : "yr")
    : "";
  const body = suffixMatch ? s.slice(0, s.lastIndexOf("/")).trim() : s;

  // Strip $ and commas before parsing/splitting
  const cleaned = body.replace(/[$,]/g, "");

  // Split on a range separator (–, —, or bare dash between two values)
  const rangeMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  const parts = rangeMatch
    ? [rangeMatch[1].trim(), rangeMatch[2].trim()]
    : [cleaned.trim()];

  const parseNum = (str) => {
    const kMatch = str.match(/^(\d+(?:\.\d+)?)k$/i);
    if (kMatch) return parseFloat(kMatch[1]) * 1000;
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
  };

  const formatNum = (str) => {
    const val = parseNum(str);
    if (val === null) return str; // non-numeric — pass through unchanged
    if (val >= 1000 && val % 1000 === 0) return `$${val / 1000}k`;
    if (val >= 1000) return `$${Math.round(val).toLocaleString("en-US")}`;
    return `$${val}`;
  };

  return parts.map(formatNum).join(" – ") + suffix;
}
