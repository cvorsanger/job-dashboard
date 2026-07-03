from app.models import Job, Profile
from app.services.db import get_session
from app.services import claude
from app.schemas import JobIn, JobOut, JobUpdate
from app.enums import Statuses
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("", response_model=JobOut, status_code=201)
async def create_job(body: JobIn, db: AsyncSession = Depends(get_session)):
    '''
    Upserts a job to the database
    '''
    job = Job(**body.model_dump())

    db.add(job)

    await db.commit()
    await db.refresh(job)

    return job

@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: int, db: AsyncSession = Depends(get_session)):
    '''
    Deletes a job by ID
    '''
    job = await db.get(Job, job_id)
    
    if not job:
        raise HTTPException(404, "Job not found")
    
    await db.delete(job)
    await db.commit()

@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: int, db: AsyncSession = Depends(get_session)):
    '''
    Retrieves a single jobs
    '''
    job = await db.get(Job, job_id)

    if not job:
        raise HTTPException(404, "Job not found")

    return job

@router.get("", response_model=list[JobOut])
async def list_jobs(db: AsyncSession = Depends(get_session)):
    '''
    Retrieves all jobs in the database
    '''
    result = await db.execute(
        select(Job).order_by(
            Job.created_at.desc()
        )
    )

    return result.scalars().all()

@router.post("/{job_id}/score", response_model=JobOut)
async def score_job(job_id: int, db: AsyncSession = Depends(get_session)):
    '''
    Scores a job's fit using Claude and advances status from sourced to reviewed
    '''
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if not job.jd_text or not job.jd_text.strip():
        raise HTTPException(400, "Job has no description to score")

    result = await db.execute(select(Profile).limit(1))
    profile = result.scalar_one_or_none()

    scores = await claude.score_job(job.jd_text, profile.to_string() if profile else "(no profile on file)")

    job.fit_score = scores["overall"]
    job.fit_notes = {
        "skills":     {"score": scores["skills"],     "note": scores["skills_note"]},
        "experience": {"score": scores["experience"], "note": scores["experience_note"]},
        "location":   {"score": scores["location"],   "note": scores["location_note"]},
        "role_scope": {"score": scores["role_scope"], "note": scores["role_scope_note"]},
    }
    job.update_status(Statuses.REVIEWED)

    job.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)

    return job

@router.patch("/{job_id}", response_model=JobOut)
async def update_job(job_id: int, body: JobUpdate, db: AsyncSession = Depends(get_session)):
    '''
    Updates an existing job
    '''
    job = await db.get(Job, job_id)

    if not job:
        raise HTTPException(404, "Job not found")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(job, k, v)

    job.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(job)

    return job
