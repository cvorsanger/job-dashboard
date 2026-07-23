from app.models.settings import Settings
from app.schemas.settings import SettingsOut, SettingsUpdate
from app.services.db import get_session
from app.utils.http_utils import HttpUtils
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
async def get_settings(db: AsyncSession = Depends(get_session)):
    try:
        return await Settings.get_or_create(db)
    except Exception as error:
        raise HttpUtils.create_exception_result(error)


@router.put("", response_model=SettingsOut)
async def save_settings(body: SettingsUpdate, db: AsyncSession = Depends(get_session)):
    try:
        cfg = await Settings.get_or_create(db)
        cfg.update_all(body)
        await db.commit()
        await db.refresh(cfg)
        return cfg
    except Exception as error:
        raise HttpUtils.create_exception_result(error)
