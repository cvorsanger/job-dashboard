import { scoreClass, SCORE_ENTRIES } from "../utils";

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
          <span className="score-wrapper">
            <span className={`score ${scoreClass(job.fit_score)}`}>{job.fit_score}</span>
            {job.fit_notes && (
              <div className="score-tooltip">
                {SCORE_ENTRIES.map(([k, label]) => {
                  const cat = job.fit_notes[k];
                  if (!cat) return null;
                  return (
                    <div key={k} className="score-row">
                      <span className={`score small ${scoreClass(cat.score)}`}>{cat.score}</span>
                      <span className="score-label">{label}</span>
                      <span className="score-note">{cat.note}</span>
                    </div>
                  );
                })}
              </div>
            )}
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
