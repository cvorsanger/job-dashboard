import { useEffect, useState } from "react";
import { api } from "./api";
import AddJobModal from "./components/AddJobModal";
import JobCard from "./components/JobCard";
import JobDrawer from "./components/JobDrawer";
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
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.listJobs().then(setJobs).catch(() => {});
  }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleJobCreated = (job) => {
    setJobs((prev) => [job, ...prev]);
  };

  const handleJobUpdated = (updated) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    setSelectedJob(updated);
  };

  const stageJobs = (key) => jobs.filter((j) => j.status === key);

  return (
    <>
      <div className="topbar">
        <h1>Find Me a Job<span className="dot">.</span></h1>
        <span className="tagline">your job search, one board</span>
        <span className="spacer" />
        <button className="btn ghost" onClick={() => setShowProfile(true)}>Profile</button>
        <button className="btn primary" onClick={() => setShowAddJob(true)}>+ Add job</button>
      </div>

      <div className="board">
        {STAGES.map((stage) => {
          const cards = stageJobs(stage.key);
          return (
            <div key={stage.key} className="column">
              <div className="column-head">
                <span className="pip" style={{ background: stage.color }} />
                <span className="name">{stage.label}</span>
                <span className="count">{cards.length}</span>
              </div>
              {cards.length === 0
                ? <div className="empty">—</div>
                : cards.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      stageColor={stage.color}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))
              }
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <JobDrawer
          job={selectedJob}
          onUpdated={handleJobUpdated}
          onClose={() => setSelectedJob(null)}
          flash={flash}
        />
      )}

      {showAddJob && (
        <AddJobModal
          onCreated={handleJobCreated}
          onClose={() => setShowAddJob(false)}
          flash={flash}
        />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} flash={flash} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
