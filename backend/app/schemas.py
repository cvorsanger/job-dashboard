from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Profile -----------------------------------------------------------------

class ProfileIn(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    links: dict = {}
    summary: str | None = None
    base_resume: str | None = None
    skills: list[str] | None = None


class ProfileOut(ORMModel, ProfileIn):
    id: int


# --- Jobs --------------------------------------------------------------------

class JobIn(BaseModel):
    company: str
    title: str
    link: str | None = None
    source: str | None = "manual"
    location: str | None = None
    salary: str | None = None
    jd_text: str | None = None
    deadline: date | None = None
    priority: str = "medium"
    notes: str | None = None


class JobUpdate(BaseModel):
    company: str | None = None
    title: str | None = None
    link: str | None = None
    location: str | None = None
    salary: str | None = None
    jd_text: str | None = None
    status: str | None = None
    deadline: date | None = None
    interview_at: datetime | None = None
    priority: str | None = None
    notes: str | None = None


class JobOut(ORMModel):
    id: int
    company: str
    title: str
    link: str | None
    source: str | None
    location: str | None
    salary: str | None
    jd_text: str | None
    status: str
    fit_score: int | None
    fit_notes: dict | None
    deadline: date | None
    interview_at: datetime | None
    draft_cover_letter: str | None
    priority: str
    notes: str | None
    date_applied: datetime | None
    created_at: datetime


# --- Resume versions ---------------------------------------------------------

class ResumeVersionOut(ORMModel):
    id: int
    job_id: int
    content: str
    diff_summary: str | None
    approved: bool
    created_at: datetime


class ResumeApprove(BaseModel):
    approved: bool = True
    content: str | None = None


# --- Applications ------------------------------------------------------------

class ApplicationIn(BaseModel):
    resume_version_id: int | None = None
    cover_letter: str | None = None


class ApplicationOut(ORMModel):
    id: int
    job_id: int
    resume_version_id: int | None
    cover_letter: str | None
    applied_date: datetime
    status: str
