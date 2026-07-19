export default function FilterBar({ search, setSearch, sortBy, setSortBy, minScore, setMinScore, hiddenStages, setHiddenStages, stages }) {
  const isFiltered = search !== "" || sortBy !== "date_desc" || minScore !== 0 || hiddenStages.size > 0;

  const clearAll = () => {
    setSearch("");
    setSortBy("date_desc");
    setMinScore(0);
    setHiddenStages(new Set());
  };

  const toggleStage = (key) => {
    setHiddenStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="filter-bar">
      <input
        className="filter-search"
        type="text"
        placeholder="Search company or title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="date_desc">Newest first</option>
        <option value="date_asc">Oldest first</option>
        <option value="score_desc">Score high→low</option>
        <option value="score_asc">Score low→high</option>
        <option value="company_asc">Company A→Z</option>
        <option value="title_asc">Title A→Z</option>
      </select>
      <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
        <option value={0}>Any score</option>
        <option value={70}>70+</option>
        <option value={85}>85+</option>
      </select>
      <div className="stage-toggles">
        {stages.map((stage) => {
          const hidden = hiddenStages.has(stage.key);
          return (
            <button
              key={stage.key}
              className={`stage-chip${hidden ? " muted" : ""}`}
              onClick={() => toggleStage(stage.key)}
            >
              {!hidden && <span className="pip" style={{ background: stage.color }} />}
              {stage.label}
            </button>
          );
        })}
      </div>
      {isFiltered && (
        <button className="btn ghost small" onClick={clearAll}>
          Clear filters
        </button>
      )}
    </div>
  );
}
