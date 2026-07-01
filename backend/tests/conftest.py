import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from unittest.mock import AsyncMock

from app.main import app
from app.db import Base, get_session


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db):
    async def override_get_session():
        yield db

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def mock_claude(monkeypatch):
    monkeypatch.setattr(
        "app.claude.clean_resume_text",
        AsyncMock(return_value="cleaned text"),
    )
    monkeypatch.setattr(
        "app.claude.parse_resume_fields",
        AsyncMock(return_value={"full_name": "Jane"}),
    )
