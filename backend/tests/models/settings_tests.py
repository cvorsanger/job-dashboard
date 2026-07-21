import pytest
from app.models.settings import Settings
from app.schemas.settings import SettingsUpdate


@pytest.mark.asyncio
async def test_get_or_create_returns_defaults_when_no_row_exists(db):
    # Act
    settings = await Settings.get_or_create(db)

    # Assert
    assert settings.id == 1
    assert settings.api_key == ""
    assert settings.model_resume_clean == "claude-sonnet-4-6"
    assert settings.model_resume_parse == "claude-sonnet-4-6"
    assert settings.model_score == "claude-sonnet-4-6"


@pytest.mark.asyncio
async def test_get_or_create_returns_existing_row_on_second_call(db):
    # Arrange
    await Settings.get_or_create(db)

    # Act
    result = await Settings.get_or_create(db)

    # Assert
    assert result.id == 1


@pytest.mark.asyncio
async def test_update_all_updates_only_supplied_fields(db):
    # Arrange
    settings = await Settings.get_or_create(db)

    # Act
    settings.update_all(SettingsUpdate(api_key="sk-test"))

    # Assert
    assert settings.api_key == "sk-test"
    assert settings.model_resume_clean == "claude-sonnet-4-6"
