from app.services.db import Base
from app.schemas import JobUpdate
from app.enums import Statuses
from datetime import date, datetime, timezone
from sqlalchemy import Date, DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    date_applied: Mapped[datetime | None] = mapped_column(DateTime)
    deadline: Mapped[date | None] = mapped_column(Date)
    draft_cover_letter: Mapped[str | None] = mapped_column(Text)
    fit_notes: Mapped[dict | None] = mapped_column(JSON)
    fit_score: Mapped[int | None] = mapped_column(Integer)
    interview_at: Mapped[datetime | None] = mapped_column(DateTime)
    jd_text: Mapped[str | None] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String, default="medium")
    salary: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="sourced", nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    resume_versions: Mapped[list["ResumeVersion"]] = relationship(
        back_populates="job",
        cascade="all, delete-orphan"
    )

    def save_score(self, scores: dict) -> None:

        '''
        Parses a Job score from Claude and updates the appropiate fields
        '''
        self.fit_score = scores["overall"]
        self.fit_notes = {
            "skills":     {"score": scores["skills"],     "note": scores["skills_note"]},
            "experience": {"score": scores["experience"], "note": scores["experience_note"]},
            "location":   {"score": scores["location"],   "note": scores["location_note"]},
            "role_scope": {"score": scores["role_scope"], "note": scores["role_scope_note"]},
       }

        self.update_status(Statuses.REVIEWED)

        self.update_updatetime()

    def update_all(self, update: JobUpdate) -> None:
        '''
        Updates all fields given by an update call
        '''
        for k, v in update.model_dump(exclude_unset=True).items():
            setattr(self, k, v)

        self.update_updatetime()

    def update_status(self, target: Statuses) -> None:
        '''
        Changes the status of a Job
        '''
        self.status = target.value

    def update_updatetime(self) -> None:
        '''
        Updates the updated_at field to thw time now
        '''
        self.updated_at = datetime.now(timezone.utc)
