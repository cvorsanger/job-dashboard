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

# Tests (from backend/)
pytest
```

`ANTHROPIC_API_KEY` is no longer required as an environment variable — the key is stored in the database via `GET/PUT /api/settings` and configured through the Settings modal in the UI. `jobs.db` is created automatically on first `uvicorn` run — no migration step needed.

## Testing

Tests live in `backend/tests/`, organized to mirror `app/`: `tests/models/`, `tests/routers/`, `tests/services/`, `tests/utils/`. Conventions:

- File names: `*_tests.py` only (configured via `python_files` in `pytest.ini`) — e.g. `tests/models/job_tests.py`. Dots in filenames (`x.tests.py`) break Python module imports — don't use them.
- Test **functions** must still start with `test_` — pytest's function discovery is separate from the file pattern and is not customized.
- Every test uses explicit `# Arrange`, `# Act`, `# Assert` section comments (omit `# Arrange` when there's no setup).
- `conftest.py` provides `db` (in-memory SQLite session), `client` (httpx `AsyncClient` with the session dependency overridden), `mock_claude` (patches `clean_resume_text`/`parse_resume_fields`), and `settings` (seeds a `Settings` row with `api_key="test-key"` and default models). Tests that hit Claude-backed endpoints (`POST /api/jobs/{id}/score`, `POST /api/profile/parse-resume`) must include the `settings` fixture so the router finds a non-empty api_key.
- All Claude calls are mocked — patch `app.services.claude.<fn>` with `AsyncMock`, or mock `app.services.claude.client.messages.create` and build `MagicMock` response blocks (`block.type = "tool_use"`, `block.input = {...}`).

## Architecture

### Pipeline model
Jobs move through 7 statuses defined in the `Statuses` enum (`backend/app/enums/statuses.py`): `sourced → reviewed → ready → applied → interview → offer → closed`. Status changes go through `Job.update_status(target)`; `Job.save_score(scores)` advances to `reviewed` as part of scoring. There is no transition guard — `PATCH /api/jobs/{id}` accepts any valid `Statuses` value.

### Models own their mutations (`backend/app/models/`)
ORM classes carry their update logic — call these instead of setting attributes in routers:
- `Job.save_score(scores)` — writes `fit_score`/`fit_notes` from a Claude score dict, advances status to `reviewed`.
- `Job.update_all(update)` — applies a `JobUpdate` with `exclude_unset=True` (partial update: omitted fields untouched).
- `Profile.update_all(update)` — applies a full `ProfileIn` dump (**full overwrite**: omitted fields reset to defaults — intentional, since `PUT /api/profile` is a full upsert).
- `Profile.to_string()` — serializes the profile to the plain-text block used in Claude prompts. Update this if new profile fields need to reach Claude.
- `ResumeVersion` and `Application` models exist but have no routers yet.

### Error handling (`backend/app/utils/http_utils.py`)
`HttpUtils` provides static factories that **return** (not raise) `HTTPException`s: `create_exception_result` (400 — accepts an `Exception | str` and surfaces `str(error)` as the detail), `create_not_found_result` (404), `create_to_large_result` (413), `create_unprocessable_result` (422). Router pattern: validate and raise 404/400 **before** the `try` block, then wrap the actual work with `except Exception as error: raise httpUtils.create_exception_result(error)`. Don't raise intentional HTTPExceptions inside the `try` — the catch-all converts them to 400s.

### Claude integration (`backend/app/services/claude.py`)
Three functions, each accepting `api_key: str` and `model: str` explicitly and creating an `AsyncAnthropic` client inline. The `api_key` and `model` values come from the `Settings` row fetched by the calling router — not from `config.py`. Routers guard on empty `api_key` before the `try` block with a 400: `"Anthropic API key not configured. Add it in Settings."`:

- **Field extraction** (`parse_resume_fields(cleaned_text, api_key, model)`): `AsyncAnthropic` + `tool_use` with a strict JSON schema. `tool_choice` forces the tool to fire, guaranteeing a parseable dict. Iterate `response.content` for the `tool_use` block; return `block.input` (empty dict if none).
- **Text cleanup** (`clean_resume_text(raw_text, api_key, model)`): Plain `messages.create` call, result is `response.content[0].text`.
- **Job scoring** (`score_job(jd_text, profile_text, api_key, model)`): `tool_use` returning `overall` plus per-dimension scores/notes (`skills`, `experience`, `location`, `role_scope`).

### Resume parse flow
`POST /api/profile/parse-resume` runs `clean_resume_text` and `parse_resume_fields` in parallel via `asyncio.gather`, then returns `{"text": ..., "fields": {...}}`. The frontend merges `fields` into form state with a "fill empty only" strategy — existing non-blank values are not overwritten.

### Database
SQLite via `aiosqlite`. SQLAlchemy `JSON` type for all structured fields (replaces `JSONB`/`ARRAY`). Tables auto-created at startup via `Base.metadata.create_all`. No migration tooling — for schema changes, drop and recreate `jobs.db` (it's local data, not production).

### Jobs API (`backend/app/routers/jobs.py`)
Registered at `/api/jobs`. Endpoints: `POST /api/jobs` (create), `GET /api/jobs` (list, newest first), `GET /api/jobs/{id}`, `PATCH /api/jobs/{id}` (partial update via `JobUpdate` schema — all fields optional), `DELETE /api/jobs/{id}` (204), `POST /api/jobs/{id}/score` (scores fit via Claude against the saved profile; 400 if the job has no `jd_text`).

### Settings API (`backend/app/routers/settings.py`)
Registered at `/api/settings`. Single-row table (`Settings` model, always id=1) stores `api_key`, `model_resume_clean`, `model_resume_parse`, `model_score`. Endpoints: `GET /api/settings` (returns row or defaults), `PUT /api/settings` (partial upsert via `SettingsUpdate` with `exclude_unset=True`). `Settings.get_or_create(db)` inserts defaults on first call.

### Profile API (`backend/app/routers/profile.py`)
Registered at `/api/profile`. Endpoints: `GET /api/profile` (returns profile or null), `PUT /api/profile` (upsert full profile), `POST /api/profile/parse-resume` (accepts PDF/DOCX/TXT upload ≤10 MB, returns `{"text": ..., "fields": {...}}`). Only one profile row ever exists.

### Frontend state
`App.jsx` owns the jobs list and `selectedJob`. Cards call `setSelectedJob(job)` to open `JobDrawer`. After any mutation (create or update), the returned job object replaces its entry in the list — no full refetch needed. After streaming AI actions, components call `api.getJob(id)` for a clean refresh instead of an empty PATCH.

### Frontend components
- `JobCard.jsx` — displays company, title, location/salary tags, fit score badge (color-coded), priority dot. Reads `--stage` CSS variable for the left border color.
- `JobDrawer.jsx` — right-side slide-in panel for editing all job fields. Calls `onUpdated(job)` with the PATCH response.
- `AddJobModal.jsx` — modal form for creating a new job. Calls `onCreated(job)` with the POST response.
- `ProfileModal.jsx` — modal for editing the user profile, including resume upload/parse.
- `SettingsModal.jsx` — modal for configuring the Anthropic API key and per-task Claude model (Resume Cleaning, Resume Parsing, Job Scoring). Includes a master dropdown that sets all three at once; individual dropdowns show "Custom" in the master when they differ.

### Salary normalization (`frontend/src/utils.js`)
`normalizeSalary(raw)` parses freeform salary input and returns a canonical string. Examples: `120000` → `$120k`, `120k-150k` → `$120k – $150k`, `60/hr` → `$60/hr`. Called on salary field blur and before every API save in both `AddJobModal` and `JobDrawer`. Returns `null` for empty input; passes non-numeric strings through unchanged.
