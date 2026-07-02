from app.models import Job
from app.services.db import get_session
from app.schemas import JobIn, JobOut, JobUpdate
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
