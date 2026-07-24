import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, streamPost } from "./api";

function mockFetch({ ok = true, status = 200, json = () => Promise.resolve({ id: 1 }), body = null } = {}) {
  return vi.fn().mockResolvedValue({ ok, status, json, body });
}

describe("request helper (via api methods)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves to parsed JSON on 200", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: () => Promise.resolve({ id: 42 }) }));
    const result = await api.getProfile();
    expect(result).toEqual({ id: 42 });
  });

  it("resolves to null on 204", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 204 }));
    const result = await api.deleteJob(1);
    expect(result).toBeNull();
  });

  it("rejects with detail message from error response body", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ ok: false, status: 404, json: () => Promise.resolve({ detail: "Job not found" }) })
    );
    await expect(api.getJob(99)).rejects.toThrow("Job not found");
  });

  it("rejects with generic message when error body is not parseable", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ ok: false, status: 500, json: () => Promise.reject(new Error("not json")) })
    );
    await expect(api.getProfile()).rejects.toThrow("Request failed: 500");
  });
});

describe("streamPost", () => {
  afterEach(() => vi.unstubAllGlobals());

  function makeReader(messages) {
    const encoder = new TextEncoder();
    const chunks = messages.map((msg) => encoder.encode(`data: ${JSON.stringify(msg)}\n`));
    let i = 0;
    return {
      async read() {
        if (i < chunks.length) return { done: false, value: chunks[i++] };
        return { done: true, value: undefined };
      },
    };
  }

  it("calls onChunk for each chunk message and onDone at end", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () =>
            makeReader([{ chunk: "hello" }, { chunk: "world" }, { done: true, result: "final" }]),
        },
      })
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    await streamPost("/api/test", onChunk, onDone);

    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenNthCalledWith(1, "hello");
    expect(onChunk).toHaveBeenNthCalledWith(2, "world");
    expect(onDone).toHaveBeenCalledWith({ done: true, result: "final" });
  });

  it("rejects with error detail on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ ok: false, status: 400, json: () => Promise.resolve({ detail: "No JD text" }) })
    );
    await expect(streamPost("/api/test", vi.fn(), vi.fn())).rejects.toThrow("No JD text");
  });

  it("handles SSE data split across multiple read() calls", async () => {
    const encoder = new TextEncoder();
    const fullLine = 'data: {"chunk":"hello"}\n';
    const part1 = encoder.encode(fullLine.slice(0, 10));
    const part2 = encoder.encode(fullLine.slice(10) + 'data: {"done":true}\n');
    const parts = [part1, part2];
    let i = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            async read() {
              if (i < parts.length) return { done: false, value: parts[i++] };
              return { done: true, value: undefined };
            },
          }),
        },
      })
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    await streamPost("/api/test", onChunk, onDone);

    expect(onChunk).toHaveBeenCalledWith("hello");
    expect(onDone).toHaveBeenCalledWith({ done: true });
  });
});

describe("api methods", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("getProfile calls GET /api/profile", async () => {
    await api.getProfile();
    expect(fetch).toHaveBeenCalledWith("/api/profile", expect.any(Object));
    expect(fetch.mock.calls[0][1].method).toBeUndefined();
  });

  it("saveProfile calls PUT /api/profile with JSON body", async () => {
    const profile = { full_name: "Jane" };
    await api.saveProfile(profile);
    expect(fetch).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(profile) })
    );
  });

  it("listJobs calls GET /api/jobs", async () => {
    await api.listJobs();
    expect(fetch.mock.calls[0][0]).toBe("/api/jobs");
  });

  it("getJob calls GET /api/jobs/:id", async () => {
    await api.getJob(42);
    expect(fetch.mock.calls[0][0]).toBe("/api/jobs/42");
  });

  it("createJob calls POST /api/jobs with JSON body", async () => {
    const data = { company: "Acme", title: "Engineer" };
    await api.createJob(data);
    expect(fetch).toHaveBeenCalledWith(
      "/api/jobs",
      expect.objectContaining({ method: "POST", body: JSON.stringify(data) })
    );
  });

  it("updateJob calls PATCH /api/jobs/:id with JSON body", async () => {
    const data = { company: "NewCo" };
    await api.updateJob(1, data);
    expect(fetch).toHaveBeenCalledWith(
      "/api/jobs/1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(data) })
    );
  });

  it("scoreJob calls POST /api/jobs/:id/score", async () => {
    await api.scoreJob(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/jobs/1/score",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deleteJob calls DELETE /api/jobs/:id", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 204 }));
    await api.deleteJob(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/jobs/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("getSettings calls GET /api/settings", async () => {
    await api.getSettings();
    expect(fetch.mock.calls[0][0]).toBe("/api/settings");
  });

  it("saveSettings calls PUT /api/settings with JSON body", async () => {
    const data = { api_key: "test" };
    await api.saveSettings(data);
    expect(fetch).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(data) })
    );
  });

  it("parseResume calls POST /api/profile/parse-resume with FormData and no Content-Type header", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: () => Promise.resolve({ text: "", fields: {} }) }));
    const file = new File(["content"], "resume.pdf", { type: "application/pdf" });
    await api.parseResume(file);
    const [path, opts] = fetch.mock.calls[0];
    expect(path).toBe("/api/profile/parse-resume");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.headers).toBeUndefined();
  });
});
