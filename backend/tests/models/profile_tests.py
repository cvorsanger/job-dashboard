from app.models.profile import Profile
from app.schemas import ProfileIn

def make_profile() -> Profile:
    return Profile(
        full_name="Jane Doe",
        email="jane@example.com",
        location="Austin, TX",
        phone="555-1234",
        links={"linkedin": "https://linkedin.com/in/jane", "github": ""},
        skills=["Python", "SQL"],
        summary="Backend engineer.",
        base_resume="Jane Doe\nBackend engineer with 5 years of Python.",
    )

def test_to_string_success():
    # Arrange
    profile = make_profile()

    # Act
    result = profile.to_string()

    # Assert
    assert "Name: Jane Doe" in result
    assert "Email: jane@example.com" in result
    assert "Location: Austin, TX" in result
    assert "  linkedin: https://linkedin.com/in/jane" in result
    assert "Skills: Python, SQL" in result
    assert "Summary: Backend engineer." in result
    assert "Jane Doe\nBackend engineer with 5 years of Python." in result

def test_to_string_skips_blank_links():
    # Arrange
    profile = make_profile()

    # Act
    result = profile.to_string()

    # Assert
    assert "github" not in result

def test_to_string_handles_empty_profile():
    # Arrange
    profile = Profile()

    # Act
    result = profile.to_string()

    # Assert
    assert "Name: " in result
    assert "Email: " in result
    assert "  (none)" in result
    assert "Skills: " in result
    assert "(no base resume saved)" in result

def test_to_string_shows_none_when_all_links_blank():
    # Arrange
    profile = make_profile()
    profile.links = {"linkedin": "", "github": None}

    # Act
    result = profile.to_string()

    # Assert
    assert "  (none)" in result

def test_update_all_success():
    # Arrange
    profile = make_profile()
    update = ProfileIn(
        full_name="Jane Smith",
        email="jane.smith@example.com",
        location="Denver, CO",
        phone="555-9999",
        links={"portfolio": "https://janesmith.dev"},
        skills=["Go", "Kubernetes"],
        summary="Platform engineer.",
        base_resume="Jane Smith\nPlatform engineer.",
    )

    # Act
    profile.update_all(update)

    # Assert
    assert profile.full_name == "Jane Smith"
    assert profile.email == "jane.smith@example.com"
    assert profile.location == "Denver, CO"
    assert profile.phone == "555-9999"
    assert profile.links == {"portfolio": "https://janesmith.dev"}
    assert profile.skills == ["Go", "Kubernetes"]
    assert profile.summary == "Platform engineer."
    assert profile.base_resume == "Jane Smith\nPlatform engineer."
    assert profile.updated_at is not None

def test_update_all_overwrites_omitted_fields_with_defaults():
    # Arrange
    profile = make_profile()

    # Act
    profile.update_all(ProfileIn(full_name="Jane Smith"))

    # Assert
    assert profile.full_name == "Jane Smith"
    assert profile.email is None
    assert profile.skills is None
    assert profile.links == {}
