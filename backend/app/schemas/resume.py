from app.schemas.orm_model import ORMModel
from datetime import datetime
from pydantic import BaseModel

class ResumeApprove(BaseModel):
    """
    Payload for approving or rejecting a generated resume version.
    """
    approved: bool = True
    content: str | None = None

class ResumeVersionOut(ORMModel):
    """
    Resume version data returned from the API.
    """
    approved: bool
    content: str
    created_at: datetime
    diff_summary: str | None
    id: int
    job_id: int
