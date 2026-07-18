import { useEffect, useState } from "react";
import { api } from "../api";
import { normalizeSalary, scoreClass, SCORE_LABELS } from "../utils";

const STATUSES = ["sourced", "reviewed", "ready", "applied", "interview", "offer", "closed"];

const toForm = (job) => ({
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

const initialDraft = (job) => ({ jobId: job.id, form: toForm(job), baseline: toForm(job) });

export default function JobDrawer({ job, onUpdated, onDeleted, onClose, flash }) {
  const [draft, setDraft] = useState(() => initialDraft(job));
  const { form, baseline } = draft;
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [deleting, setDeleting] = useState("idle"); // idle | confirming | deleting

  // Server state changed (score, kanban drag): adopt new values into fields the
  // user hasn't edited; hard-reset when a different job is selected.
  useEffect(() => {
    setDraft((d) => {
      if (d.jobId !== job.id) return initialDraft(job);
      const next = toForm(job);
      const mergedForm = Object.fromEntries(
        Object.keys(next).map((k) => [k, d.form[k] === d.baseline[k] ? next[k] : d.form[k]])
      );
      return { jobId: job.id, form: mergedForm, baseline: next };
    });
  }, [job]);

  const set = (k) => (e) =>
    setDraft((d) => ({ ...d, form: { ...d.form, [k]: e.target.value } }));

  const toPatchValue = {
    company: (v) => v || undefined,
    title: (v) => v || undefined,
    link: (v) => v || null,
    location: (v) => v || null,
    salary: (v) => normalizeSalary(v),
    priority: (v) => v,
    status: (v) => v,
    deadline: (v) => v || null,
    notes: (v) => v || null,
    jd_text: (v) => v || null,
  };

  const dirtyKeys = Object.keys(form).filter((k) => form[k] !== baseline[k]);
  const isDirty = dirtyKeys.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateJob(
        job.id,
        Object.fromEntries(dirtyKeys.map((k) => [k, toPatchValue[k](form[k])]))
      );
      onUpdated(updated);
      flash("Saved");
    } catch (err) {
      flash(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting("deleting");
    try {
      await api.deleteJob(job.id);
      onDeleted(job.id);
    } catch (err) {
      flash(err.message);
      setDeleting("idle");
    }
  };

  const handleScore = async () => {
    setScoring(true);
    try {
      if (isDirty) {
        await api.updateJob(
          job.id,
          Object.fromEntries(dirtyKeys.map((k) => [k, toPatchValue[k](form[k])]))
        );
      }
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
                onBlur={() =>
                  setDraft((d) => ({
                    ...d,
                    form: { ...d.form, salary: normalizeSalary(d.form.salary) ?? "" },
                  }))
                }
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
                {Object.entries(SCORE_LABELS).map(([key, label]) => {
                  const cat = job.fit_notes?.[key];
                  if (!cat) return null;
                  return (
                    <div key={key} className="score-row">
                      <span className={`score ${scoreClass(cat.score)}`}>{cat.score}</span>
                      <span className="score-label">{label}</span>
                      <span className="score-note">{cat.note}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          <div className="actions">
            <button
              className="btn primary"
              onClick={handleSave}
              disabled={saving || !isDirty}
              title={!isDirty ? "No unsaved changes" : undefined}
            >
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
            {deleting !== "idle" ? (
              <>
                <button className="btn danger" onClick={handleConfirmDelete} disabled={deleting === "deleting"}>
                  {deleting === "deleting" ? "Deleting…" : "Confirm delete"}
                </button>
                <button className="btn ghost" onClick={() => setDeleting("idle")} disabled={deleting === "deleting"}>Cancel</button>
              </>
            ) : (
              <button className="btn ghost danger" onClick={() => setDeleting("confirming")}>Delete</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
