import pytest
from unittest.mock import AsyncMock

from app.models.job import Job


MOCK_SCORE = {
    "overall": 75,
    "skills": 80,
    "skills_note": "Strong Python match.",
    "experience": 65,
    "experience_note": "Slightly junior.",
    "location": 90,
    "location_note": "Remote, fits well.",
    "role_scope": 70,
    "role_scope_note": "Good scope fit.",
}


@pytest.mark.asyncio
async def test_score_endpoint_writes_fit_score(client, db, monkeypatch):
    job = Job(company="Acme", title="Engineer", jd_text="We need Python skills.")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    monkeypatch.setattr("app.services.claude.score_job", AsyncMock(return_value=MOCK_SCORE))

    resp = await client.post(f"/api/jobs/{job.id}/score")
    assert resp.status_code == 200
    data = resp.json()
    assert data["fit_score"] == 75
    assert data["fit_notes"]["skills"]["score"] == 80
    assert data["fit_notes"]["skills"]["note"] == "Strong Python match."
    assert data["fit_notes"]["experience"]["score"] == 65
    assert data["fit_notes"]["location"]["score"] == 90
    assert data["fit_notes"]["role_scope"]["score"] == 70


@pytest.mark.asyncio
async def test_score_endpoint_advances_status_from_sourced(client, db, monkeypatch):
    job = Job(company="Acme", title="Engineer", jd_text="Python role.", status="sourced")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    monkeypatch.setattr("app.services.claude.score_job", AsyncMock(return_value=MOCK_SCORE))

    resp = await client.post(f"/api/jobs/{job.id}/score")
    assert resp.status_code == 200
    assert resp.json()["status"] == "reviewed"


@pytest.mark.asyncio
async def test_score_endpoint_404_on_missing_job(client, db):
    resp = await client.post("/api/jobs/9999/score")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_score_endpoint_400_on_missing_jd(client, db):
    job = Job(company="Acme", title="Engineer")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    resp = await client.post(f"/api/jobs/{job.id}/score")
    assert resp.status_code == 400
