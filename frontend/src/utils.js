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
