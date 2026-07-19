import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import AddJobModal from "./components/AddJobModal";
import FilterBar from "./components/FilterBar";
import JobCard from "./components/JobCard";
import JobDrawer from "./components/JobDrawer";
import ProfileModal from "./components/ProfileModal";
import { filterAndSortJobs } from "./utils";

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
  const [draggedJobId, setDraggedJobId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [minScore, setMinScore] = useState(0);
  const [hiddenStages, setHiddenStages] = useState(new Set());

  const displayJobs = useMemo(
    () => filterAndSortJobs(jobs, { search, sortBy, minScore }),
    [jobs, search, sortBy, minScore]
  );

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

  const handleJobDeleted = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setSelectedJob(null);
  };

  const stageJobs = (key) => displayJobs.filter((j) => j.status === key);

  const handleDragStart = (job) => (e) => {
    setDraggedJobId(job.id);
    e.dataTransfer.setData("jobId", String(job.id));
    e.dataTransfer.setData("previousStatus", job.status);
  };

  const handleDrop = (targetStage) => async (e) => {
    e.currentTarget.classList.remove("drop-target");
    const jobId = parseInt(e.dataTransfer.getData("jobId"), 10);
    const previousStatus = e.dataTransfer.getData("previousStatus");
    setDraggedJobId(null);

    if (targetStage === previousStatus) return;

    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: targetStage } : j));

    try {
      const updated = await api.updateJob(jobId, { status: targetStage });
      setJobs((prev) => prev.map((j) => j.id === updated.id ? updated : j));
      if (selectedJob?.id === updated.id) setSelectedJob(updated);
    } catch (err) {
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: previousStatus } : j));
      flash(err.message || "Couldn't move — only forward moves are allowed");
    }
  };

  return (
    <>
      <div className="topbar">
        <h1>Find Me a Job<span className="dot">.</span></h1>
        <span className="tagline">your job search, one board</span>
        <span className="spacer" />
        <button className="btn ghost" onClick={() => setShowProfile(true)}>Profile</button>
        <button className="btn primary" onClick={() => setShowAddJob(true)}>+ Add job</button>
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        minScore={minScore}
        setMinScore={setMinScore}
        hiddenStages={hiddenStages}
        setHiddenStages={setHiddenStages}
        stages={STAGES}
      />

      <div className="board">
        {STAGES.filter((stage) => !hiddenStages.has(stage.key)).map((stage) => {
          const cards = stageJobs(stage.key);
          return (
            <div
              key={stage.key}
              className="column"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drop-target"); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.classList.remove("drop-target"); }}
              onDrop={handleDrop(stage.key)}
            >
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
                      onDragStart={handleDragStart(job)}
                      onDragEnd={() => setDraggedJobId(null)}
                      isDragging={draggedJobId === job.id}
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
          onDeleted={handleJobDeleted}
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
