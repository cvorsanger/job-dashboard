import { useState } from "react";
import { api } from "../api";
import { normalizeSalary } from "../utils";

const EMPTY = { company: "", title: "", link: "", location: "", salary: "", priority: "medium" };

export default function AddJobModal({ onCreated, onClose, flash }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        company: form.company,
        title: form.title,
        link: form.link || null,
        location: form.location || null,
        salary: normalizeSalary(form.salary),
        priority: form.priority,
      };
      const job = await api.createJob(payload);
      onCreated(job);
      flash("Job added");
      onClose();
    } catch (err) {
      flash(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <h2>Add job</h2>
        <form onSubmit={handleSubmit}>
          <label>Company *</label>
          <input value={form.company} onChange={set("company")} required autoFocus />

          <label>Role / title *</label>
          <input value={form.title} onChange={set("title")} required />

          <div className="field-row">
            <div>
              <label>Link</label>
              <input value={form.link} onChange={set("link")} type="url" placeholder="https://…" />
            </div>
            <div>
              <label>Location</label>
              <input value={form.location} onChange={set("location")} placeholder="Remote, NYC…" />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label>Salary</label>
              <input
                value={form.salary}
                onChange={set("salary")}
                onBlur={() => setForm((f) => ({ ...f, salary: normalizeSalary(f.salary) ?? "" }))}
                placeholder="$120k–$150k"
              />
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

          <div className="foot">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : "Add job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
