const scoreClass = (s) => s >= 70 ? "score-green" : s >= 45 ? "score-amber" : "score-red";

const buildTooltip = (notes) => {
  if (!notes) return undefined;
  const labels = { skills: "Skills", experience: "Experience", location: "Location", role_scope: "Role scope" };
  return Object.entries(labels)
    .map(([k, label]) => {
      const cat = notes[k];
      return cat ? `${label}: ${cat.score} — ${cat.note}` : null;
    })
    .filter(Boolean)
    .join("\n");
};

export default function JobCard({ job, stageColor, onClick, onDragStart, onDragEnd, isDragging }) {
  return (
    <div
      className="card"
      style={{ "--stage": stageColor, opacity: isDragging ? 0.4 : 1 }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="card-top">
        {job.priority === "high" && <span className="priority-dot priority-high" />}
        {job.priority === "low" && <span className="priority-dot priority-low" />}
        <span className="company">{job.company}</span>
        {job.fit_score != null && (
          <span
            className={`score ${scoreClass(job.fit_score)}`}
            title={buildTooltip(job.fit_notes)}
          >
            {job.fit_score}
          </span>
        )}
      </div>
      <div className="role">{job.title}</div>
      {(job.location || job.salary) && (
        <div className="meta">
          {job.location && <span className="tag">{job.location}</span>}
          {job.salary && <span className="tag">{job.salary}</span>}
        </div>
      )}
    </div>
  );
}
