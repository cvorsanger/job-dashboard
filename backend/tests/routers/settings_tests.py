import pytest


@pytest.mark.asyncio
async def test_get_settings_returns_defaults_when_nothing_saved(client):
    # Act
    response = await client.get("/api/settings")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["api_key"] == ""
    assert data["model_resume_clean"] == "claude-sonnet-4-6"
    assert data["model_resume_parse"] == "claude-sonnet-4-6"
    assert data["model_score"] == "claude-sonnet-4-6"


@pytest.mark.asyncio
async def test_put_settings_persists_and_returns_updated_values(client):
    # Arrange
    payload = {
        "api_key": "sk-ant-test",
        "model_resume_clean": "claude-haiku-4-5-20251001",
        "model_resume_parse": "claude-sonnet-4-6",
        "model_score": "claude-opus-4-8",
    }

    # Act
    response = await client.put("/api/settings", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["api_key"] == "sk-ant-test"
    assert data["model_resume_clean"] == "claude-haiku-4-5-20251001"
    assert data["model_score"] == "claude-opus-4-8"


@pytest.mark.asyncio
async def test_put_settings_partial_update_leaves_other_fields_unchanged(client):
    # Arrange
    await client.put("/api/settings", json={"api_key": "sk-ant-test"})

    # Act
    response = await client.put("/api/settings", json={"model_score": "claude-opus-4-8"})

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["api_key"] == "sk-ant-test"
    assert data["model_score"] == "claude-opus-4-8"
