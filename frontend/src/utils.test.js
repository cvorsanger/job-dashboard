import { describe, it, expect } from "vitest";
import { normalizeSalary, scoreClass, filterAndSortJobs } from "./utils";

describe("normalizeSalary", () => {
  it("returns null for null input", () => {
    expect(normalizeSalary(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeSalary("")).toBeNull();
  });

  it("formats plain integer as $Xk", () => {
    expect(normalizeSalary("120000")).toBe("$120k");
  });

  it("formats k-suffix input unchanged", () => {
    expect(normalizeSalary("120k")).toBe("$120k");
  });

  it("formats a dash-separated range", () => {
    expect(normalizeSalary("120k-150k")).toBe("$120k – $150k");
  });

  it("formats hourly rate", () => {
    expect(normalizeSalary("60/hr")).toBe("$60/hr");
  });

  it("strips $ and commas before parsing", () => {
    expect(normalizeSalary("$120,000")).toBe("$120k");
  });

  it("passes through non-numeric strings unchanged", () => {
    expect(normalizeSalary("competitive")).toBe("competitive");
  });

  it("formats non-round thousands with locale commas", () => {
    expect(normalizeSalary("125500")).toBe("$125,500");
  });
});

describe("scoreClass", () => {
  it("returns score-green for 70 and above", () => {
    expect(scoreClass(70)).toBe("score-green");
    expect(scoreClass(100)).toBe("score-green");
  });

  it("returns score-amber for 45 through 69", () => {
    expect(scoreClass(45)).toBe("score-amber");
    expect(scoreClass(69)).toBe("score-amber");
  });

  it("returns score-red for below 45", () => {
    expect(scoreClass(44)).toBe("score-red");
    expect(scoreClass(0)).toBe("score-red");
  });
});

describe("filterAndSortJobs", () => {
  const jobs = [
    { id: 1, company: "Acme", title: "Engineer", fit_score: 80, created_at: "2026-01-01T00:00:00Z" },
    { id: 2, company: "Beta", title: "Designer", fit_score: 40, created_at: "2026-01-02T00:00:00Z" },
    { id: 3, company: "Gamma", title: "Manager", fit_score: null, created_at: "2026-01-03T00:00:00Z" },
  ];

  const defaults = { search: "", sortBy: "date_desc", minScore: 0 };

  it("returns all jobs when search is blank", () => {
    expect(filterAndSortJobs(jobs, defaults)).toHaveLength(3);
  });

  it("filters by company name case-insensitively", () => {
    const result = filterAndSortJobs(jobs, { ...defaults, search: "acme" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("filters by title case-insensitively", () => {
    const result = filterAndSortJobs(jobs, { ...defaults, search: "DESIGNER" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("minScore 0 returns all jobs including null-score jobs", () => {
    expect(filterAndSortJobs(jobs, { ...defaults, minScore: 0 })).toHaveLength(3);
  });

  it("minScore filters out lower scores and null scores", () => {
    const result = filterAndSortJobs(jobs, { ...defaults, minScore: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("sorts by date_desc (newest first) by default", () => {
    const ids = filterAndSortJobs(jobs, defaults).map((j) => j.id);
    expect(ids).toEqual([3, 2, 1]);
  });

  it("sorts by date_asc (oldest first)", () => {
    const ids = filterAndSortJobs(jobs, { ...defaults, sortBy: "date_asc" }).map((j) => j.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  it("sorts by score_desc with null scores last", () => {
    const ids = filterAndSortJobs(jobs, { ...defaults, sortBy: "score_desc" }).map((j) => j.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  it("sorts by score_asc with null scores last", () => {
    const ids = filterAndSortJobs(jobs, { ...defaults, sortBy: "score_asc" }).map((j) => j.id);
    expect(ids).toEqual([2, 1, 3]);
  });

  it("sorts by company_asc alphabetically", () => {
    const ids = filterAndSortJobs(jobs, { ...defaults, sortBy: "company_asc" }).map((j) => j.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  it("sorts by title_asc alphabetically", () => {
    const ids = filterAndSortJobs(jobs, { ...defaults, sortBy: "title_asc" }).map((j) => j.id);
    expect(ids).toEqual([2, 1, 3]); // Designer, Engineer, Manager
  });
});
