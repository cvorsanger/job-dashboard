# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend (from repo root)
cd backend
.venv\Scripts\activate          # Windows; use source .venv/bin/activate on Mac/Linux
uvicorn app.main:app --reload   # http://localhost:8000 — interactive docs at /docs

# Frontend (from repo root)
cd frontend
npm run dev                     # http://localhost:5173 — proxies /api to backend
```

`ANTHROPIC_API_KEY` must be set as a **system environment variable** (not in any file). `jobs.db` is created automatically on first `uvicorn` run — no migration step needed.

## Architecture

### Pipeline model
Jobs move through 7 statuses: `sourced → reviewed → ready → applied → interview → offer → closed`. Status advances are centralized in `backend/app/transitions.py` via `maybe_advance(job, target)` — call this from routers instead of setting `job.status` directly (except for `applied`, which is unconditional). This prevents invalid backward transitions.

### Claude integration (`backend/app/claude.py`)
Two patterns used depending on the action:

- **Scoring** (`score_job`): `AsyncAnthropic` + `tool_use` with a strict JSON schema. The tool call guarantees a parseable dict — no regex JSON extraction. `response.content[0].input` is the result.
- **Tailoring + cover letter** (`stream_tailor_resume`, `stream_cover_letter`): `AsyncAnthropic` streaming, returned as async generators. Routers wrap these in `StreamingResponse(media_type="text/event-stream")` and accumulate the full text server-side before saving.

The no-fabrication rule lives in the system prompts for both tailoring and cover letter. Never weaken it.

### Streaming transport
Backend uses FastAPI `StreamingResponse` over POST (not `EventSource`, which is GET-only). Each SSE line: `data: {"chunk": "..."}\n\n`. Final line: `data: {"done": true}\n\n`. Frontend reads with `fetch` + `ReadableStream` via the `streamPost()` helper in `api.js`.

After the stream ends, the router saves to the DB (resume version or `draft_cover_letter`) and the final `done` event triggers a `api.getJob(id)` refresh in the frontend.

### Cover letter persistence
Generated cover letters are saved immediately to `jobs.draft_cover_letter` when the stream ends. The frontend initializes the cover letter textarea from `job.draft_cover_letter`, not from React state — so it survives drawer closes and page refreshes.

### Resume approval
Approving a `ResumeVersion` sets all other versions for the same job to `approved=False` (exclusive). The approve endpoint also accepts an optional `content` field so users can edit Claude's output before approving. Approval triggers `maybe_advance(job, "ready")`.

### Database
SQLite via `aiosqlite`. SQLAlchemy `JSON` type for all structured fields (replaces `JSONB`/`ARRAY`). Tables auto-created at startup via `Base.metadata.create_all`. No migration tooling — for schema changes, drop and recreate `jobs.db` (it's local data, not production).

### Frontend state
`App.jsx` holds the jobs list and which job is selected. Child components receive the job object and call `onChange(updatedJob)` to update it in the parent. After streaming AI actions, components call `api.getJob(id)` for a clean refresh — not an empty PATCH.
