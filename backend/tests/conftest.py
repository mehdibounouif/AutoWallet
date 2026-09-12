"""Pytest setup for AutoWallet backend tests.

Provides every test with a throwaway in-memory database and a test
client that calls the API without a running server. No real data
is ever touched.
"""
import pytest
import fakeredis
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.models import User, UserRole
from app.services.provisioning import create_default_rules, create_default_wallets

# In-memory SQLite: exists only in RAM, gone when the test run ends.
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # one shared connection so all tables live in the same RAM db
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables once at the start of the session, drop them at the end."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """A database session for direct DB checks inside a test.

    Rolls back after every test so tests stay isolated from each other.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch):
    """Swap every Redis client the app uses for an in-memory fake, so tests
    (and CI) need no running Redis server. The REAL lock code still executes
    against the fake.

    Patched in EACH module that holds its own imported reference — because
    `from X import Y` copies the reference at import time, patching only
    the original in app.core.redis_client changes nothing for importers.
    New modules importing redis_client must be added here.
    """
    fake = fakeredis.FakeStrictRedis()
    monkeypatch.setattr("app.api.transactions.redis_client", fake)
    monkeypatch.setattr("app.services.payment_processor.redis_client", fake)
    yield fake


@pytest.fixture
def client(db_session):
    """A test client that calls the API using the throwaway database
    instead of the real one (FastAPI's official dependency-override pattern)."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """A ready-made registered user with wallets and default rules."""
    user = User(
        email="zakaria.test@autowallet.dev",
        full_name="Zakaria QA Tester",
        hashed_password=hash_password("SuperSecret1337!"),
        bank_account_id="MA64000100000042",
        role=UserRole.user,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    create_default_wallets(user, db_session)
    create_default_rules(user, db_session)
    db_session.commit()
    return user


@pytest.fixture
def auth_headers(test_user):
    """A valid JWT in a header, so tests can call protected endpoints."""
    token = create_access_token(user_id=test_user.id)
    return {"Authorization": f"Bearer {token}"}
