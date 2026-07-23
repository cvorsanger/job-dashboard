import pytest

from app.models.profile import Profile
from sqlalchemy import select

PROFILE_BODY = {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "location": "Austin, TX",
    "phone": "555-1234",
    "links": {"linkedin": "https://linkedin.com/in/jane"},
    "skills": ["Python", "SQL"],
    "summary": "Backend engineer.",
    "base_resume": "Jane Doe\nBackend engineer...",
}

@pytest.mark.asyncio
async def test_get_profile_success(client):
    # Arrange
    await client.put("/api/profile", json=PROFILE_BODY)

    # Act
    resp = await client.get("/api/profile")

    # Assert
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Jane Doe"

@pytest.mark.asyncio
async def test_get_profile_returns_null_when_empty(client):
    # Act
    resp = await client.get("/api/profile")

    # Assert
    assert resp.status_code == 200
    assert resp.json() is None

@pytest.mark.asyncio
async def test_parse_resume_success(client, settings, mock_claude):
    # Arrange
    files = {"file": ("resume.txt", b"Jane Doe\nPython developer", "text/plain")}

    # Act
    resp = await client.post("/api/profile/parse-resume", files=files)

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "cleaned text"
    assert data["fields"] == {"full_name": "Jane"}

@pytest.mark.asyncio
async def test_parse_resume_400_on_unsupported_type(client, mock_claude):
    # Arrange
    files = {"file": ("resume.csv", b"some,data", "text/csv")}

    # Act
    resp = await client.post("/api/profile/parse-resume", files=files)

    # Assert
    assert resp.status_code == 400

@pytest.mark.asyncio
async def test_parse_resume_422_on_empty_file(client, mock_claude):
    # Arrange
    files = {"file": ("resume.txt", b"   \n  ", "text/plain")}

    # Act
    resp = await client.post("/api/profile/parse-resume", files=files)

    # Assert
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_parse_resume_413_on_oversized_file(client, mock_claude):
    # Arrange
    too_big = b"x" * (10 * 1024 * 1024 + 1)
    files = {"file": ("resume.txt", too_big, "text/plain")}

    # Act
    resp = await client.post("/api/profile/parse-resume", files=files)

    # Assert
    assert resp.status_code == 413

@pytest.mark.asyncio
async def test_save_profile_creates_profile(client):
    # Act
    resp = await client.put("/api/profile", json=PROFILE_BODY)

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] is not None
    assert data["full_name"] == "Jane Doe"
    assert data["skills"] == ["Python", "SQL"]
    assert data["links"]["linkedin"] == "https://linkedin.com/in/jane"

@pytest.mark.asyncio
async def test_save_profile_success(client, db):
    # Arrange
    first = await client.put("/api/profile", json=PROFILE_BODY)
    updated_body = PROFILE_BODY | {"full_name": "Jane Smith"}

    # Act
    second = await client.put("/api/profile", json=updated_body)

    # Assert
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]
    assert second.json()["full_name"] == "Jane Smith"
    result = await db.execute(select(Profile))
    assert len(result.scalars().all()) == 1
