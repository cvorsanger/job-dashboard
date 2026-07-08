import pytest

from app.services.claude import clean_resume_text, parse_resume_fields, score_job
from unittest.mock import AsyncMock, MagicMock

MOCK_FIELDS = {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-1234",
    "location": "Austin, TX",
    "linkedin": "https://linkedin.com/in/jane",
    "github": "",
    "summary": "Backend engineer.",
    "skills": ["Python", "SQL"],
}

@pytest.mark.asyncio
async def test_clean_resume_text_success(monkeypatch):
    # Arrange
    mock_block = MagicMock()
    mock_block.text = "Jane Doe\nBackend engineer with 5 years of Python."
    mock_response = MagicMock()
    mock_response.content = [mock_block]
    monkeypatch.setattr(
        "app.services.claude.client.messages.create",
        AsyncMock(return_value=mock_response),
    )

    # Act
    result = await clean_resume_text("Jane  Doe\n\n1\nBackend eng ineer...")

    # Assert
    assert result == "Jane Doe\nBackend engineer with 5 years of Python."

@pytest.mark.asyncio
async def test_parse_resume_fields_success(monkeypatch):
    # Arrange
    mock_block = MagicMock()
    mock_block.type = "tool_use"
    mock_block.name = "extract_resume_fields"
    mock_block.input = MOCK_FIELDS
    mock_response = MagicMock()
    mock_response.content = [mock_block]
    monkeypatch.setattr(
        "app.services.claude.client.messages.create",
        AsyncMock(return_value=mock_response),
    )

    # Act
    result = await parse_resume_fields("Jane Doe\nBackend engineer...")

    # Assert
    assert result == MOCK_FIELDS

@pytest.mark.asyncio
async def test_parse_resume_fields_empty_dict_when_no_tool_block(monkeypatch):
    # Arrange
    mock_block = MagicMock()
    mock_block.type = "text"
    mock_block.name = ""
    mock_response = MagicMock()
    mock_response.content = [mock_block]
    monkeypatch.setattr(
        "app.services.claude.client.messages.create",
        AsyncMock(return_value=mock_response),
    )

    # Act
    result = await parse_resume_fields("some resume text")

    # Assert
    assert result == {}

@pytest.mark.asyncio
async def test_score_job_success(monkeypatch):
    # Arrange
    mock_block = MagicMock()
    mock_block.type = "tool_use"
    mock_block.name = "score_job"
    mock_block.input = {
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
    mock_response = MagicMock()
    mock_response.content = [mock_block]
    monkeypatch.setattr(
        "app.services.claude.client.messages.create",
        AsyncMock(return_value=mock_response),
    )

    # Act
    result = await score_job("Senior Python Engineer at Acme...", "Name: Jane\nSkills: Python")

    # Assert
    assert result["overall"] == 75
    assert result["skills"] == 80
    assert result["skills_note"] == "Strong Python match."
    assert result["experience"] == 65
    assert result["location"] == 90
    assert result["role_scope"] == 70

@pytest.mark.asyncio
async def test_score_job_empty_dict_when_no_tool_block(monkeypatch):
    # Arrange
    mock_block = MagicMock()
    mock_block.type = "text"
    mock_block.name = ""
    mock_response = MagicMock()
    mock_response.content = [mock_block]
    monkeypatch.setattr(
        "app.services.claude.client.messages.create",
        AsyncMock(return_value=mock_response),
    )

    # Act
    result = await score_job("Job description", "Candidate profile")

    # Assert
    assert result == {}
