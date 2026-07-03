from app.enums import Statuses
from app.schemas.orm_model import ORMModel
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class JobIn(BaseModel):
    """
    Payload for creating a new job listing.
    """
    company: str
    deadline: date | None = None
    jd_text: str | None = None
    link: str | None = None
    location: str | None = None
    notes: str | None = None
    priority: str = "medium"
    salary: str | None = None
    source: str | None = "manual"
    title: str

class JobOut(ORMModel):
    """
    Full job data returned from the API.
    """
    model_config = ORMModel.model_config | ConfigDict(use_enum_values=True)

    company: str
    created_at: datetime
    date_applied: datetime | None
    deadline: date | None
    draft_cover_letter: str | None
    fit_notes: dict | None
    fit_score: int | None
    id: int
    interview_at: datetime | None
    jd_text: str | None
    link: str | None
    location: str | None
    notes: str | None
    priority: str
    salary: str | None
    source: str | None
    status: Statuses
    title: str

class JobUpdate(BaseModel):
    """
    Partial update payload for an existing job; all fields are optional.
    """
    model_config = ConfigDict(use_enum_values=True)

    company: str | None = None
    deadline: date | None = None
    interview_at: datetime | None = None
    jd_text: str | None = None
    link: str | None = None
    location: str | None = None
    notes: str | None = None
    priority: str | None = None
    salary: str | None = None
    status: Statuses | None = None
    title: str | None = None
