# Job Search Pipeline

A personal job-search command center that runs your hunt as a pipeline:

```
Sourced → Reviewed → Ready → Applied → Interview → Offer → Closed
```

Claude does the thinking at three stages: scoring how well a job fits you, tailoring your resume to each posting, and drafting cover letters. You stay in control — every AI output is editable and approved by you before it's used.

- **Backend:** FastAPI + SQLAlchemy + SQLite (no database account needed)
- **Frontend:** React (Vite) — a 7-column kanban board
- **AI:** Anthropic Claude via the official Python SDK

---

## Prerequisites

**Python 3.11+** and **Node 18+** must be installed.

**Set your Anthropic API key as a system environment variable** (do this once):

1. Start → search "Environment Variables" → "Edit the system environment variables"
2. Click "Environment Variables…" → under "System variables" → New
3. Name: `ANTHROPIC_API_KEY` — Value: your key from [console.anthropic.com](https://console.anthropic.com)
4. OK → restart any open terminals

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

`jobs.db` is created automatically on first run. Visit **http://localhost:8000/docs** for interactive API docs.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the backend — both must be running.

---

## First steps

1. Click **Profile** and paste your base resume and skills. Claude tailors from this — nothing works well until it's filled in.
2. Click **+ Add job**, paste a job description.
3. Open the card and walk it through the pipeline:
   - **Score fit** — Claude rates 0–100, lists what you meet and what you're missing
   - **Tailor resume** — Claude rewrites your resume for the role; you edit and approve
   - **Draft cover letter** — Claude writes three targeted paragraphs; you edit before applying
   - **Mark applied** — moves the card and records the application

---

## Pipeline stages

| Stage | Meaning |
|---|---|
| Sourced | Added to board, nothing done yet |
| Reviewed | Scored by Claude; you've seen the fit analysis |
| Ready | Approved resume exists; ready to apply |
| Applied | Application submitted |
| Interview | Interview scheduled |
| Offer | Offer received |
| Closed | Not pursuing (rejected / withdrew / expired) |

Drag cards between columns or use the stage selector inside the card.
