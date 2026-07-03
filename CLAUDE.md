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

# Both servers together (from repo root)
python start.py
```

`ANTHROPIC_API_KEY` must be set as a **system environment variable** (not in any file). `jobs.db` is created automatically on first `uvicorn` run — no migration step needed.

No test files yet. `backend/tests/conftest.py` has `db`, `client`, and `mock_claude` async fixtures ready to use. Run with `pytest` from `backend/` (asyncio mode is configured in `pytest.ini`).

## Architecture

### Pipeline model
Jobs move through 7 statuses: `sourced → reviewed → ready → applied → interview → offer → closed`. Status advances are centralized in `backend/app/transitions.py` via `maybe_advance(job, target)` — call this from routers instead of setting `job.status` directly (except for `applied`, which is unconditional). This prevents invalid backward transitions.

### Claude integration (`backend/app/services/claude.py`)
Two functions currently implemented, both using `model_sonnet_46` from `config.py`:

- **Field extraction** (`parse_resume_fields`): `AsyncAnthropic` + `tool_use` with a strict JSON schema. `tool_choice` forces the tool to fire, guaranteeing a parseable dict. Iterate `response.content` for the `tool_use` block; return `block.input`.
- **Text cleanup** (`clean_resume_text`): Plain `messages.create` call, result is `response.content[0].text`.

`backend/app/utils.py` — `profile_to_text(profile)` serializes a `Profile` ORM object to a plain-text block used in Claude prompts. Update this if new profile fields need to reach Claude.

### Resume parse flow
`POST /api/profile/parse-resume` runs `clean_resume_text` and `parse_resume_fields` in parallel via `asyncio.gather`, then returns `{"text": ..., "fields": {...}}`. The frontend merges `fields` into form state with a "fill empty only" strategy — existing non-blank values are not overwritten.

### Database
SQLite via `aiosqlite`. SQLAlchemy `JSON` type for all structured fields (replaces `JSONB`/`ARRAY`). Tables auto-created at startup via `Base.metadata.create_all`. No migration tooling — for schema changes, drop and recreate `jobs.db` (it's local data, not production).

### Jobs API (`backend/app/routers/jobs.py`)
Registered at `/api/jobs`. Endpoints: `POST /api/jobs` (create), `GET /api/jobs` (list, newest first), `GET /api/jobs/{id}`, `PATCH /api/jobs/{id}` (partial update via `JobUpdate` schema — all fields optional).

### Profile API (`backend/app/routers/profile.py`)
Registered at `/api/profile`. Endpoints: `GET /api/profile` (returns profile or null), `PUT /api/profile` (upsert full profile), `POST /api/profile/parse-resume` (accepts PDF/DOCX/TXT upload, returns `{"text": ..., "fields": {...}}`). Only one profile row ever exists.

### Frontend state
`App.jsx` owns the jobs list and `selectedJob`. Cards call `setSelectedJob(job)` to open `JobDrawer`. After any mutation (create or update), the returned job object replaces its entry in the list — no full refetch needed. After streaming AI actions, components call `api.getJob(id)` for a clean refresh instead of an empty PATCH.

### Frontend components
- `JobCard.jsx` — displays company, title, location/salary tags, fit score badge (color-coded), priority dot. Reads `--stage` CSS variable for the left border color.
- `JobDrawer.jsx` — right-side slide-in panel for editing all job fields. Calls `onUpdated(job)` with the PATCH response.
- `AddJobModal.jsx` — modal form for creating a new job. Calls `onCreated(job)` with the POST response.
- `ProfileModal.jsx` — modal for editing the user profile, including resume upload/parse.

### Salary normalization (`frontend/src/utils.js`)
`normalizeSalary(raw)` parses freeform salary input and returns a canonical string. Examples: `120000` → `$120k`, `120k-150k` → `$120k – $150k`, `60/hr` → `$60/hr`. Called on salary field blur and before every API save in both `AddJobModal` and `JobDrawer`. Returns `null` for empty input; passes non-numeric strings through unchanged.
