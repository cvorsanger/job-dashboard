from app.schemas.settings import SettingsUpdate
from app.services.db import Base
from sqlalchemy import Integer, Text, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    api_key: Mapped[str] = mapped_column(Text, default="")
    model_resume_clean: Mapped[str] = mapped_column(Text, default="claude-sonnet-4-6")
    model_resume_parse: Mapped[str] = mapped_column(Text, default="claude-sonnet-4-6")
    model_score: Mapped[str] = mapped_column(Text, default="claude-sonnet-4-6")

    @classmethod
    async def get_or_create(cls, db: AsyncSession) -> "Settings":
        result = await db.execute(select(cls).where(cls.id == 1))
        row = result.scalar_one_or_none()
        if row is None:
            row = cls(
                id=1,
                api_key="",
                model_resume_clean="claude-sonnet-4-6",
                model_resume_parse="claude-sonnet-4-6",
                model_score="claude-sonnet-4-6",
            )
            db.add(row)
            await db.commit()
            await db.refresh(row)
        return row

    def update_all(self, update: SettingsUpdate) -> None:
        for field, value in update.model_dump(exclude_unset=True).items():
            setattr(self, field, value)
