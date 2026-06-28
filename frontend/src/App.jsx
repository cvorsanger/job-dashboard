import { useState } from "react";
import ProfileModal from "./components/ProfileModal";

const STAGES = [
  { key: "sourced",   label: "Sourced",   color: "var(--s-sourced)" },
  { key: "reviewed",  label: "Reviewed",  color: "var(--s-reviewed)" },
  { key: "ready",     label: "Ready",     color: "var(--s-ready)" },
  { key: "applied",   label: "Applied",   color: "var(--s-applied)" },
  { key: "interview", label: "Interview", color: "var(--s-interview)" },
  { key: "offer",     label: "Offer",     color: "var(--s-offer)" },
  { key: "closed",    label: "Closed",    color: "var(--s-closed)" },
];

export default function App() {
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <>
      <div className="topbar">
        <h1>Find Me a Job<span className="dot">.</span></h1>
        <span className="tagline">your job search, one board</span>
        <span className="spacer" />
        <button className="btn ghost" onClick={() => setShowProfile(true)}>Profile</button>
        <button className="btn primary">+ Add job</button>
      </div>

      <div className="board">
        {STAGES.map((stage) => (
          <div key={stage.key} className="column">
            <div className="column-head">
              <span className="pip" style={{ background: stage.color }} />
              <span className="name">{stage.label}</span>
              <span className="count">0</span>
            </div>
            <div className="empty">—</div>
          </div>
        ))}
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} flash={flash} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
