from app.schemas.orm_model import ORMModel
from pydantic import BaseModel

class ProfileIn(BaseModel):
    """
    Payload for creating or updating a user profile.
    """
    base_resume: str | None = None
    email: str | None = None
    full_name: str | None = None
    links: dict = {}
    location: str | None = None
    phone: str | None = None
    skills: list[str] | None = None
    summary: str | None = None

class ProfileOut(ORMModel, ProfileIn):
    """
    Profile data returned from the API, including the database id.
    """
    id: int
