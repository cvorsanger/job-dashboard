from app.schemas.orm_model import ORMModel
from datetime import datetime
from pydantic import BaseModel

class ApplicationIn(BaseModel):
    """
    Payload for submitting a job application.
    """
    cover_letter: str | None = None
    resume_version_id: int | None = None

class ApplicationOut(ORMModel):
    """
    Application data returned from the API.
    """
    applied_date: datetime
    cover_letter: str | None
    id: int
    job_id: int
    resume_version_id: int | None
    status: str
