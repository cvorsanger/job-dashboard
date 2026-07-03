import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.claude import score_job


@pytest.mark.asyncio
async def test_score_job_returns_structured_result(monkeypatch):
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

    result = await score_job("Senior Python Engineer at Acme...", "Name: Jane\nSkills: Python")

    assert result["overall"] == 75
    assert result["skills"] == 80
    assert result["skills_note"] == "Strong Python match."
    assert result["experience"] == 65
    assert result["location"] == 90
    assert result["role_scope"] == 70
