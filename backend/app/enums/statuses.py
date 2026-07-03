from enum import Enum

class Statuses(Enum):
    SOURCED   = "sourced"
    REVIEWED  = "reviewed"
    READY     = "ready"
    APPLIED   = "applied"
    INTERVIEW = "interview"
    OFFER     = "offer"
    CLOSED    = "closed"
