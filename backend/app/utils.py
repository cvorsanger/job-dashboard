from app.models.profile import Profile

def profile_to_text(p: Profile | None) -> str:
    ''''''
    if p is None:
        return "(no profile on file)"
    
    links = p.links or {}

    link_lines = [f"  {k}: {v}" for k, v in links.items() if v]

    parts = [
        f"Name: {p.full_name or ''}",
        f"Email: {p.email or ''}",
        f"Location: {p.location or ''}",
        f"Links:\n" + ("\n".join(link_lines) if link_lines else "  (none)"),
        f"Skills: {', '.join(p.skills) if p.skills else ''}",
        f"Summary: {p.summary or ''}",
        "",
        "Resume:",
        p.base_resume or "(no base resume saved)",
    ]
    return "\n".join(parts)
