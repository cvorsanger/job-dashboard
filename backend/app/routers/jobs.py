from app.models import Job, Profile
from app.services.db import get_session
from app.services import claude
from app.schemas import JobIn, JobOut, JobUpdate
from app.enums.statuses import Statuses
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.http_utils import httpUtils

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("", response_model=JobOut, status_code=201)
async def create_job(body: JobIn, db: AsyncSession = Depends(get_session)):
    '''
    Upserts a job to the database
    '''
    try:
        job = Job(**body.model_dump())

        db.add(job)

        await db.commit()
        await db.refresh(job)

        return job
    except Exception as error:
        raise httpUtils.create_exception_result(error)

@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: int, db: AsyncSession = Depends(get_session)):
    '''
    Deletes a job by ID
    '''
    job = await db.get(Job, job_id)

    if not job:
        raise httpUtils.create_not_found_result("Job not found")

    try:
        await db.delete(job)
        await db.commit()

    except Exception as error:
        raise httpUtils.create_exception_result(error)

@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: int, db: AsyncSession = Depends(get_session)):
    '''
    Retrieves a single jobs
    '''
    job = await db.get(Job, job_id)

    if not job:
        raise httpUtils.create_not_found_result("Job not found")

    return job

@router.get("", response_model=list[JobOut])
async def list_jobs(db: AsyncSession = Depends(get_session)):
    '''
    Retrieves all jobs in the database
    '''
    try:
        result = await db.execute(
            select(Job).order_by(
                Job.created_at.desc()
            )
        )

        return result.scalars().all()
    except Exception as error:
        raise httpUtils.create_exception_result(error)

@router.post("/{job_id}/score", response_model=JobOut)
async def score_job(job_id: int, db: AsyncSession = Depends(get_session)):
    '''
    Scores a job's fit using Claude and advances status from sourced to reviewed
    '''
    #Fetch a the Job accosiated to the input id
    job = await db.get(Job, job_id)
    if not job:
        raise httpUtils.create_not_found_result("Job not found")
    if not job.jd_text or not job.jd_text.strip():
        raise httpUtils.create_exception_result("Job missing description to score with")

    try:
        result = await db.execute(select(Profile).limit(1))
        profile = result.scalar_one_or_none()

        score = await claude.score_job(
            job.jd_text,
            profile.to_string() if profile else "(no profile on file)"
        )

        job.save_score(score)

        await db.commit()
        await db.refresh(job)

        return job
    except Exception as error:
        raise httpUtils.create_exception_result(error)

@router.patch("/{job_id}", response_model=JobOut)
async def update_job(job_id: int, body: JobUpdate, db: AsyncSession = Depends(get_session)):
    '''
    Updates an existing job
    '''
    job = await db.get(Job, job_id)

    if not job:
        raise httpUtils.create_not_found_result("Job not found")

    if body.status is not None:
        order = [s.value for s in Statuses]
        # < (not <=) allows same-status PATCH, which is a no-op update
        if order.index(body.status) < order.index(job.status):
            raise httpUtils.create_unprocessable_result("Cannot move job backward in pipeline")

    try:
        job.update_all(body)

        await db.commit()
        await db.refresh(job)

        return job
    except Exception as error:
        raise httpUtils.create_exception_result(error)
