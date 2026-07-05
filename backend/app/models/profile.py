from app.schemas.profile import ProfileIn
from app.services.db import Base
from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column

class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    base_resume: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    email: Mapped[str | None] = mapped_column(Text)
    full_name: Mapped[str | None] = mapped_column(Text)
    links: Mapped[dict | None] = mapped_column(JSON, default=dict)
    location: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    skills: Mapped[list | None] = mapped_column(JSON)
    summary: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_string(self) -> str:
        '''
        Takes a profile and stringifys it
        '''
        link_lines = [f"  {k}: {v}" for k, v in (self.links or {}).items() if v]

        parts = [
            f"Name: {self.full_name or ''}",
            f"Email: {self.email or ''}",
            f"Location: {self.location or ''}",
            f"Links:\n" + ("\n".join(link_lines) if link_lines else "  (none)"),
            f"Skills: {', '.join(self.skills) if self.skills else ''}",
            f"Summary: {self.summary or ''}",
            "",
            "Resume:",
            self.base_resume or "(no base resume saved)",
        ]

        return "\n".join(parts)
    
    def update_all(self, update: ProfileIn) -> None:
        for field, value in update.model_dump().items():
            setattr(self, field, value)

        self.updated_at = datetime.now(timezone.utc)