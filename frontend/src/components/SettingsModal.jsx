import { useEffect, useState } from "react";
import { api } from "../api";

const MODELS = [
  { label: "Haiku 4.5", value: "claude-haiku-4-5-20251001" },
  { label: "Sonnet 4.6", value: "claude-sonnet-4-6" },
  { label: "Opus 4.8", value: "claude-opus-4-8" },
];

const TASK_FIELDS = [
  { label: "Resume Cleaning", key: "model_resume_clean" },
  { label: "Resume Parsing",  key: "model_resume_parse" },
  { label: "Job Scoring",     key: "model_score" },
];

const DEFAULT_FORM = {
  api_key: "",
  model_resume_clean: "claude-sonnet-4-6",
  model_resume_parse: "claude-sonnet-4-6",
  model_score: "claude-sonnet-4-6",
};

function masterValue(form) {
  const vals = TASK_FIELDS.map((f) => form[f.key]);
  return vals.every((v) => v === vals[0]) ? vals[0] : "custom";
}

export default function SettingsModal({ onClose, flash }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setForm).catch(() => {});
  }, []);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const setMaster = (e) => {
    const val = e.target.value;
    if (val === "custom") return;
    setForm({ ...form, model_resume_clean: val, model_resume_parse: val, model_score: val });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveSettings(form);
      flash("Settings saved");
      onClose();
    } catch (e) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const master = masterValue(form);

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <label>Anthropic API key</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type={showKey ? "text" : "password"}
            value={form.api_key}
            onChange={setField("api_key")}
            placeholder="sk-ant-..."
            style={{ flex: 1 }}
          />
          <button className="btn ghost" onClick={() => setShowKey((v) => !v)}>
            {showKey ? "Hide" : "Show"}
          </button>
        </div>

        <label style={{ marginTop: 20 }}>Claude model</label>
        <select value={master} onChange={setMaster}>
          {master === "custom" && <option value="custom">Custom</option>}
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {TASK_FIELDS.map(({ label, key }) => (
            <div key={key} className="field-row" style={{ alignItems: "center" }}>
              <label style={{ minWidth: 140, marginBottom: 0 }}>{label}</label>
              <select value={form[key]} onChange={setField(key)} style={{ flex: 1 }}>
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
