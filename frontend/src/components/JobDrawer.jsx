import { useState } from "react";
import { api } from "../api";
import { normalizeSalary } from "../utils";

const STATUSES = ["sourced", "reviewed", "ready", "applied", "interview", "offer", "closed"];

export default function JobDrawer({ job, onUpdated, onClose, flash }) {
  const [form, setForm] = useState({
    company: job.company,
    title: job.title,
    link: job.link ?? "",
    location: job.location ?? "",
    salary: job.salary ?? "",
    priority: job.priority,
    status: job.status,
    deadline: job.deadline ?? "",
    notes: job.notes ?? "",
    jd_text: job.jd_text ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateJob(job.id, {
        company: form.company || undefined,
        title: form.title || undefined,
        link: form.link || null,
        location: form.location || null,
        salary: normalizeSalary(form.salary),
        priority: form.priority,
        status: form.status,
        deadline: form.deadline || null,
        notes: form.notes || null,
        jd_text: form.jd_text || null,
      });
      onUpdated(updated);
      flash("Saved");
    } catch (err) {
      flash(err.message);
      setSaving(false);
    }
  };

  const handleScore = async () => {
    setScoring(true);
    try {
      const updated = await api.scoreJob(job.id);
      onUpdated(updated);
      flash("Scored");
    } catch (err) {
      flash(err.message);
    } finally {
      setScoring(false);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer">
        <header>
          <div style={{ flex: 1 }}>
            <h2>{form.company}</h2>
            <div className="sub">{form.title}</div>
          </div>
          <button className="btn ghost small" onClick={onClose} style={{ fontSize: 16, lineHeight: 1 }}>✕</button>
        </header>

        <div className="body">
          <div className="field-row">
            <div>
              <label>Company</label>
              <input value={form.company} onChange={set("company")} />
            </div>
            <div>
              <label>Role / title</label>
              <input value={form.title} onChange={set("title")} />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label>Status</label>
              <select value={form.status} onChange={set("status")}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select value={form.priority} onChange={set("priority")}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div>
              <label>Location</label>
              <input value={form.location} onChange={set("location")} placeholder="Remote, NYC…" />
            </div>
            <div>
              <label>Salary</label>
              <input
                value={form.salary}
                onChange={set("salary")}
                onBlur={() => setForm((f) => ({ ...f, salary: normalizeSalary(f.salary) ?? "" }))}
                placeholder="$120k–$150k"
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label>Link</label>
              <input value={form.link} onChange={set("link")} type="url" placeholder="https://…" />
            </div>
            <div>
              <label>Deadline</label>
              <input value={form.deadline} onChange={set("deadline")} type="date" />
            </div>
          </div>

          <div>
            <label>Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Anything worth remembering…" />
          </div>

          <div>
            <label>Job description</label>
            <textarea value={form.jd_text} onChange={set("jd_text")} rows={7} placeholder="Paste the job description here…" />
          </div>

          {job.fit_score != null && (
            <details>
              <summary>Fit score: {job.fit_score}</summary>
              <div className="score-breakdown">
                {["skills", "experience", "location", "role_scope"].map((key) => {
                  const cat = job.fit_notes?.[key];
                  if (!cat) return null;
                  const cls = cat.score >= 70 ? "score-green" : cat.score >= 45 ? "score-amber" : "score-red";
                  return (
                    <div key={key} className="score-row">
                      <span className={`score ${cls}`}>{cat.score}</span>
                      <span className="score-label">{key.replace("_", " ")}</span>
                      <span className="score-note">{cat.note}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          <div className="actions">
            <button className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              className="btn ghost"
              onClick={handleScore}
              disabled={scoring || !form.jd_text.trim()}
              title={!form.jd_text.trim() ? "Paste a job description first" : undefined}
            >
              {scoring ? "Scoring…" : "Score"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
