async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function streamPost(path, onChunk, onDone) {
  const res = await fetch(path, { method: "POST" });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));
      if (data.chunk) onChunk(data.chunk);
      if (data.done) onDone(data);
    }
  }
}

export const api = {
  // profile
  getProfile: () => request("/api/profile"),
  saveProfile: (p) => request("/api/profile", { method: "PUT", body: JSON.stringify(p) }),
  parseResume: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/parse-resume", { method: "POST", body: form });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  // jobs
  listJobs: () => request("/api/jobs"),
  getJob: (id) => request(`/api/jobs/${id}`),
  createJob: (data) => request("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
  updateJob: (id, data) => request(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  scoreJob: (id) => request(`/api/jobs/${id}/score`, { method: "POST" }),
};
