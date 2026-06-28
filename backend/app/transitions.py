from app.models import Job

ALL_STATUSES = {"sourced", "reviewed", "ready", "applied", "interview", "offer", "closed"}

PREDECESSORS: dict[str, set[str]] = {
    "reviewed":  {"sourced"},
    "ready":     {"sourced", "reviewed"},
    "applied":   {"sourced", "reviewed", "ready"},
    "interview": {"applied"},
    "offer":     {"interview"},
    "closed":    ALL_STATUSES,
}


def maybe_advance(job: Job, target: str) -> None:
    if job.status in PREDECESSORS.get(target, set()):
        job.status = target
