const scoreClass = (s) => s >= 70 ? "score-green" : s >= 45 ? "score-amber" : "score-red";

export default function JobCard({ job, stageColor, onClick }) {
  return (
    <div className="card" style={{ "--stage": stageColor }} onClick={onClick}>
      <div className="card-top">
        {job.priority === "high" && <span className="priority-dot priority-high" />}
        {job.priority === "low" && <span className="priority-dot priority-low" />}
        <span className="company">{job.company}</span>
        {job.fit_score != null && (
          <span className={`score ${scoreClass(job.fit_score)}`}>{job.fit_score}</span>
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
