import { useEffect, useRef, useState } from "react";
import { api } from "../api";

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  links: { linkedin: "", github: "" },
  summary: "",
  base_resume: "",
  skills: "",
};

export default function ProfileModal({ onClose, flash }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parseNotice, setParseNotice] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getProfile().then((data) => {
      if (!data) return;
      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        links: { linkedin: data.links?.linkedin || "", github: data.links?.github || "" },
        summary: data.summary || "",
        base_resume: data.base_resume || "",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
      });
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setLink = (k) => (e) => setForm({ ...form, links: { ...form.links, [k]: e.target.value } });

  const handleFile = async (file) => {
    setParsing(true);
    setParseNotice(null);
    try {
      const { text, fields = {} } = await api.parseResume(file);
      setForm((f) => {
        const fill = (cur, val) => (cur && cur.trim() ? cur : (val || ""));
        return {
          full_name: fill(f.full_name, fields.full_name),
          email: fill(f.email, fields.email),
          phone: fill(f.phone, fields.phone),
          location: fill(f.location, fields.location),
          links: {
            linkedin: fill(f.links?.linkedin, fields.linkedin),
            github: fill(f.links?.github, fields.github),
          },
          summary: fill(f.summary, fields.summary),
          skills: fill(
            f.skills,
            Array.isArray(fields.skills) ? fields.skills.join(", ") : fields.skills
          ),
          base_resume: text,
        };
      });
      setParseNotice("Parsed — review and correct the fields below before saving.");
    } catch (e) {
      flash(e.message);
    } finally {
      setParsing(false);
      setDragOver(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveProfile({
        ...form,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      flash("Profile saved");
      onClose();
    } catch (e) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Your profile</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          Claude tailors your resume from this. Fill in your base resume before using AI features.
        </p>

        <div className="field-row">
          <div>
            <label>Full name</label>
            <input value={form.full_name} onChange={set("full_name")} />
          </div>
          <div>
            <label>Location</label>
            <input value={form.location} onChange={set("location")} />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={set("phone")} />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label>LinkedIn URL</label>
            <input value={form.links.linkedin} onChange={setLink("linkedin")} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label>GitHub URL</label>
            <input value={form.links.github} onChange={setLink("github")} placeholder="https://github.com/..." />
          </div>
        </div>

        <label>Skills (comma-separated)</label>
        <input value={form.skills} onChange={set("skills")} placeholder="Python, React, SQL, ..." />

        <label>Professional summary</label>
        <textarea rows={3} value={form.summary} onChange={set("summary")} />

        <label>Base resume</label>
        <div
          className={`drop-zone${dragOver ? " drag-over" : ""}${parsing ? " parsing" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !parsing && fileRef.current?.click()}
        >
          {parsing
            ? "Parsing with Claude…"
            : "Drop PDF, DOCX, or TXT — or click to browse"}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>

        {parseNotice && (
          <div className="parse-notice">{parseNotice}</div>
        )}

        <textarea
          rows={12}
          value={form.base_resume}
          onChange={set("base_resume")}
          placeholder="Or paste your resume here directly…"
        />

        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn ghost" onClick={() => setForm(EMPTY)} disabled={saving || parsing}>
            Clear
          </button>
          <button className="btn primary" onClick={save} disabled={saving || parsing}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
