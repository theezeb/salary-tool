"""
conftest.py — shared fixtures for all tests.

Uses an in-memory SQLite database so tests are:
- Fast      (no disk I/O)
- Isolated  (fresh DB per test session)
- Safe      (never touches salary_tool.db)
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once for the test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Fresh DB transaction per test — rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """TestClient wired to the test DB session."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Reusable employee payload ─────────────────────────────────────────────────

@pytest.fixture()
def employee_payload():
    return {
        "full_name": "Jane Doe",
        "email": "jane.doe@company.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "United States",
        "salary": 95000.00,
        "currency": "USD",
        "employment_type": "Full-Time",
        "date_joined": "2022-01-15",
    }


@pytest.fixture()
def created_employee(client, employee_payload):
    """Creates one employee and returns the response JSON."""
    resp = client.post("/employees", json=employee_payload)
    assert resp.status_code == 201
    return resp.json()