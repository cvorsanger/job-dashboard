from app.enums import Statuses
from app.models.job import Job
from app.schemas import JobUpdate

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

def test_save_score_success():
    # Arrange
    job = Job(company="Acme", title="Engineer", status="sourced")

    # Act
    job.save_score(MOCK_SCORE)

    # Assert
    assert job.fit_score == 75
    assert job.fit_notes["skills"] == {"score": 80, "note": "Strong Python match."}
    assert job.fit_notes["experience"] == {"score": 65, "note": "Slightly junior."}
    assert job.fit_notes["location"] == {"score": 90, "note": "Remote, fits well."}
    assert job.fit_notes["role_scope"] == {"score": 70, "note": "Good scope fit."}
    assert job.status == "reviewed"

def test_update_all_success():
    # Arrange
    job = Job(company="Acme", title="Engineer", notes="keep me", status="sourced")

    # Act
    job.update_all(JobUpdate(title="Senior Engineer", status=Statuses.INTERVIEW))

    # Assert
    assert job.title == "Senior Engineer"
    assert job.company == "Acme"
    assert job.notes == "keep me"
    assert job.updated_at is not None
    assert job.status == "interview"

def test_update_status_success():
    # Arrange
    job = Job(company="Acme", title="Engineer", status="sourced")

    # Act
    job.update_status(Statuses.APPLIED)

    # Assert
    assert job.status == "applied"