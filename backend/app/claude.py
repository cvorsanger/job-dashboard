from anthropic import AsyncAnthropic
from app.config import settings

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

_EXTRACT_TOOL = {
    "name": "extract_resume_fields",
    "description": "Extract structured fields from resume text.",
    "input_schema": {
        "type": "object",
        "properties": {
            "full_name": {"type": "string", "description": "Candidate's full name, or empty string if not found."},
            "email": {"type": "string", "description": "Email address, or empty string if not found."},
            "phone": {"type": "string", "description": "Phone number, or empty string if not found."},
            "location": {"type": "string", "description": "City/State or full location, or empty string if not found."},
            "linkedin": {"type": "string", "description": "Full LinkedIn profile URL, or empty string if not found."},
            "github": {"type": "string", "description": "Full GitHub profile URL, or empty string if not found."},
            "summary": {"type": "string", "description": "Professional summary or objective paragraph, or empty string if not present."},
            "skills": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of individual skills extracted from the skills section.",
            },
        },
        "required": ["full_name", "email", "phone", "location", "linkedin", "github", "summary", "skills"],
    },
}


async def clean_resume_text(raw_text: str) -> str:
    """Clean up text extracted from a PDF/DOCX resume.

    PDF extraction often produces broken lines, embedded page numbers, and
    garbled whitespace. Claude reformats it to readable plain text without
    adding or removing any content.
    """
    response = await client.messages.create(
        model=settings.model_score,
        max_tokens=4000,
        system=(
            "You are a resume text cleaner. You receive raw text extracted from a PDF or DOCX "
            "file that may have formatting artifacts: broken lines, extra whitespace, page numbers "
            "embedded mid-sentence, headers split across lines. Reformat it as clean, readable "
            "plain text. Preserve ALL content exactly — do not add, remove, or change any "
            "experience, skills, dates, or other information. Return only the cleaned resume text, "
            "no commentary."
        ),
        messages=[{"role": "user", "content": f"Clean this extracted resume text:\n\n{raw_text}"}],
    )

    return response.content[0].text

async def parse_resume_fields(cleaned_text: str) -> dict:
    """
    Extract structured profile fields from cleaned resume text using tool_use.
    """
    response = await client.messages.create(
        model=settings.model_score,
        max_tokens=1024,
        system=(
            "You are a resume parser. Extract the requested fields from the resume text. "
            "Only extract information that is explicitly present — never invent or infer values. "
            "Return empty strings or empty arrays for any field that cannot be found."
        ),
        tools=[_EXTRACT_TOOL],
        tool_choice={"type": "tool", "name": "extract_resume_fields"},
        messages=[{"role": "user", "content": f"Extract fields from this resume:\n\n{cleaned_text}"}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "extract_resume_fields":
            return block.input

    return {}
