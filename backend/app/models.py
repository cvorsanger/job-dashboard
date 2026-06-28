from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    links: Mapped[dict | None] = mapped_column(JSON, default=dict)
    summary: Mapped[str | None] = mapped_column(Text)
    base_resume: Mapped[str | None] = mapped_column(Text)
    skills: Mapped[list | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    link: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    salary: Mapped[str | None] = mapped_column(Text)
    jd_text: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(String, default="sourced", nullable=False)
    fit_score: Mapped[int | None] = mapped_column(Integer)
    fit_notes: Mapped[dict | None] = mapped_column(JSON)

    deadline: Mapped[date | None] = mapped_column(Date)
    interview_at: Mapped[datetime | None] = mapped_column(DateTime)
    draft_cover_letter: Mapped[str | None] = mapped_column(Text)

    priority: Mapped[str] = mapped_column(String, default="medium")
    notes: Mapped[str | None] = mapped_column(Text)
    date_applied: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    resume_versions: Mapped[list["ResumeVersion"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    diff_summary: Mapped[str | None] = mapped_column(Text)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    file_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    job: Mapped["Job"] = relationship(back_populates="resume_versions")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("resume_versions.id", ondelete="SET NULL")
    )
    cover_letter: Mapped[str | None] = mapped_column(Text)
    applied_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    status: Mapped[str] = mapped_column(String, default="submitted")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
