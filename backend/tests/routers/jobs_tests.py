import pytest

from app.models.job import Job
from datetime import datetime
from unittest.mock import AsyncMock

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
async def test_create_job_success(client):
    # Act
    resp = await client.post("/api/jobs", json={"company": "Acme", "title": "Engineer"})

    # Assert
    assert resp.status_code == 201
    data = resp.json()
    assert data["company"] == "Acme"
    assert data["title"] == "Engineer"
    assert data["status"] == "sourced"
    assert data["priority"] == "medium"
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_create_job_persists_optional_fields(client):
    # Arrange
    body = {
        "company": "Acme",
        "title": "Engineer",
        "location": "Remote",
        "salary": "$120k",
        "jd_text": "Python role.",
        "link": "https://example.com/job",
        "source": "linkedin",
        "priority": "high",
    }

    # Act
    resp = await client.post("/api/jobs", json=body)

    # Assert
    assert resp.status_code == 201
    data = resp.json()
    assert data["location"] == "Remote"
    assert data["salary"] == "$120k"
    assert data["jd_text"] == "Python role."
    assert data["source"] == "linkedin"
    assert data["priority"] == "high"

@pytest.mark.asyncio
async def test_create_job_422_on_missing_required_fields(client):
    # Act
    resp = await client.post("/api/jobs", json={"company": "Acme"})

    # Assert
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_delete_job_success(client, db):
    # Arrange
    job = Job(company="Acme", title="Engineer")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Act
    resp = await client.delete(f"/api/jobs/{job.id}")

    # Assert
    assert resp.status_code == 204
    resp = await client.get(f"/api/jobs/{job.id}")
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_delete_job_404_on_missing(client):
    # Act
    resp = await client.delete("/api/jobs/9999")

    # Assert
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_get_job_success(client, db):
    # Arrange
    job = Job(company="Acme", title="Engineer")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Act
    resp = await client.get(f"/api/jobs/{job.id}")

    # Assert
    assert resp.status_code == 200
    assert resp.json()["id"] == job.id
    assert resp.json()["company"] == "Acme"

@pytest.mark.asyncio
async def test_get_job_404_on_missing(client):
    # Act
    resp = await client.get("/api/jobs/9999")

    # Assert
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_list_jobs_empty(client):
    # Act
    resp = await client.get("/api/jobs")

    # Assert
    assert resp.status_code == 200
    assert resp.json() == []

@pytest.mark.asyncio
async def test_list_jobs_success(client, db):
    # Arrange
    older = Job(company="Old Co", title="Old Role", created_at=datetime(2026, 1, 1))
    newer = Job(company="New Co", title="New Role", created_at=datetime(2026, 6, 1))
    db.add_all([older, newer])
    await db.commit()

    # Act
    resp = await client.get("/api/jobs")

    # Assert
    assert resp.status_code == 200
    companies = [j["company"] for j in resp.json()]
    assert companies == ["New Co", "Old Co"]

@pytest.mark.asyncio
async def test_score_endpoint_success(client, db, monkeypatch):
    # Arrange
    job = Job(company="Acme", title="Engineer", jd_text="We need Python skills.")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    monkeypatch.setattr("app.services.claude.score_job", AsyncMock(return_value=MOCK_SCORE))

    # Act
    resp = await client.post(f"/api/jobs/{job.id}/score")

    # Assert
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
    # Arrange
    job = Job(company="Acme", title="Engineer", jd_text="Python role.", status="sourced")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    monkeypatch.setattr("app.services.claude.score_job", AsyncMock(return_value=MOCK_SCORE))

    # Act
    resp = await client.post(f"/api/jobs/{job.id}/score")

    # Assert
    assert resp.status_code == 200
    assert resp.json()["status"] == "reviewed"

@pytest.mark.asyncio
async def test_score_endpoint_404_on_missing_job(client, db):
    # Act
    resp = await client.post("/api/jobs/9999/score")

    # Assert
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_score_endpoint_400_on_missing_jd(client, db):
    # Arrange
    job = Job(company="Acme", title="Engineer")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Act
    resp = await client.post(f"/api/jobs/{job.id}/score")

    # Assert
    assert resp.status_code == 400

@pytest.mark.asyncio
async def test_update_job_success(client, db):
    # Arrange
    job = Job(company="Acme", title="Engineer", notes="original")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Act
    resp = await client.patch(f"/api/jobs/{job.id}", json={"title": "Senior Engineer"})

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Senior Engineer"
    assert data["company"] == "Acme"
    assert data["notes"] == "original"

@pytest.mark.asyncio
async def test_update_job_422_on_invalid_status(client, db):
    # Arrange
    job = Job(company="Acme", title="Engineer")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Act
    resp = await client.patch(f"/api/jobs/{job.id}", json={"status": "not-a-status"})

    # Assert
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_patch_job_404_on_missing(client):
    # Act
    resp = await client.patch("/api/jobs/9999", json={"title": "New Title"})

    # Assert
    assert resp.status_code == 404
