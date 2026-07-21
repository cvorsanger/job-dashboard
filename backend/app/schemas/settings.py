from pydantic import BaseModel
from typing import Optional


class SettingsOut(BaseModel):
    api_key: str
    model_resume_clean: str
    model_resume_parse: str
    model_score: str

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    model_resume_clean: Optional[str] = None
    model_resume_parse: Optional[str] = None
    model_score: Optional[str] = None
