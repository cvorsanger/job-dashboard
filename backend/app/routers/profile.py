import asyncio
import io

from app.models import Profile
from app.schemas import ProfileIn, ProfileOut
from app.services import claude
from app.services.db import get_session
from app.utils.http_utils import HttpUtils
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/profile", tags=["profile"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

def _extract_pdf(content: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(content))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx(content: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs)

@router.get("", response_model=ProfileOut | None)
async def get_profile(db: AsyncSession = Depends(get_session)):
    '''
    Gets the saved user profile in the database
    '''
    try:
        result = await db.execute(select(Profile).limit(1))

        if result is None:
            raise HttpUtils.create_not_found_result("Profile not found")
        
        return result.scalar_one_or_none()
    except Exception as error:
        raise HttpUtils.create_exception_result(error)

@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    '''
    Extract text from a dropped resume file and clean it up with Claude.
    '''
    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:
        raise HttpUtils.create_to_large_result("File too large (max 10 MB)")

    name = (file.filename or "").lower()

    try:
        if name.endswith(".pdf"):
            raw = _extract_pdf(content)
        elif name.endswith(".docx"):
            raw = _extract_docx(content)
        elif name.endswith(".txt"):
            raw = content.decode("utf-8", errors="replace")
        else:
            raise HttpUtils.create_exception_result("Unsupported file type. Drop a PDF, DOCX, or TXT file.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(422, f"Could not read file: {e}")

    if not raw.strip():
        raise HTTPException(422, "No text could be extracted from this file.")

    cleaned, fields = await asyncio.gather(
        claude.clean_resume_text(raw),
        claude.parse_resume_fields(raw),
    )

    return {"text": cleaned, "fields": fields}

@router.put("", response_model=ProfileOut)
async def save_profile(body: ProfileIn, db: AsyncSession = Depends(get_session)):
    '''
    Upserts a user profile to the database
    '''
    try:
        result = await db.execute(select(Profile).limit(1))
        profile = result.scalar_one_or_none()

        if profile is None:
            profile = Profile(**body.model_dump())
            db.add(profile)
        else:
            profile.update_all(body)

        await db.commit()
        await db.refresh(profile)

        return profile
    except Exception as error:
        raise HttpUtils.create_exception_result(error)
