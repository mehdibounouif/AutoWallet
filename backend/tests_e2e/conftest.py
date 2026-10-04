"""Setup for the STACK e2e suite — the OPPOSITE of the unit suite's fakes.

backend/tests/        = real code, FAKE infrastructure (fakeredis, respx seam,
                        in-memory SQLite) — runs anywhere, in CI, no docker.
backend/tests_e2e/    = FAKE nothing: it drives the REAL compose stack
                        (postgres + redis + backend + bank-simulator +
                        authorization) over real HTTP, then verifies the
                        database directly via `docker compose exec psql`.

This directory must stay OUT of backend/tests/ so the unit suite's
autouse fixtures (the fakes) never leak into here.

Prerequisite: `docker compose up -d --wait` BEFORE running this suite —
the tests assume a healthy stack and fail loudly if it isn't one.
"""
import json
import os
import subprocess

import httpx
import pytest

BACKEND = os.environ.get("E2E_BACKEND_URL", "http://127.0.0.1:8000")
SIMULATOR = os.environ.get("E2E_SIMULATOR_URL", "http://127.0.0.1:8001")
POSTGRES_USER = os.environ.get("E2E_PG_USER", "autowallet")
POSTGRES_DB = os.environ.get("E2E_PG_DB", "autowallet")
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/tests_e2e/ -> repo root


def psql(sql: str) -> list[list[str]]:
    """Run a SELECT inside the postgres container; return rows as columns.

    The postgres service has NO host port (internal service, by design) —
    the only door to the database from the test machine is `docker compose
    exec`. Runs from the repo root so compose auto-detects the running
    project (same as every manual compose command in this project).
    Tests know their column order and unpack the lists themselves."""
    proc = subprocess.run(
        [
            "docker", "compose",
            "exec", "-T", "postgres",
            "psql", "-U", POSTGRES_USER, "-d", POSTGRES_DB,
            "-A", "-t", "-F", "|", "-c", sql,
        ],
        capture_output=True, text=True, timeout=30, cwd=REPO_ROOT,
    )
    if proc.returncode != 0:
        raise AssertionError(f"psql failed: {proc.stderr.strip()}")
    return [line.split("|") for line in proc.stdout.strip().splitlines() if line.strip()]


@pytest.fixture(scope="session")
def api() -> httpx.Client:
    """A plain HTTP client pointed at the REAL backend. No stubs anywhere."""
    with httpx.Client(base_url=BACKEND, timeout=20) as client:
        yield client


@pytest.fixture(scope="session")
def unique_email():
    """Unique per RUN (not per test): one user registered once, reused by
    the whole session so tests chain: register -> DB checks -> login ->
    guarded routes -> payment -> DB checks."""
    import uuid

    return f"e2e-{uuid.uuid4().hex[:10]}@autowallet.dev"


@pytest.fixture(scope="session")
def unique_bank_account(unique_email: str) -> str:
    """Unique per RUN, like the email: the postgres data PERSISTS across
    runs, so a static bank_account_id collides with the register-side
    duplicate check ('already linked') on the suite's second execution —
    the same trap as static payment references."""
    return "MA6400010000" + unique_email.split("@")[0].split("-")[1].upper()[:6]


@pytest.fixture(scope="session")
def token(api: httpx.Client, unique_email: str, unique_bank_account: str) -> str:
    """Register + login once per session; returns the real JWT."""
    r = api.post("/api/auth/register", json={
        "full_name": "Stack E2E",
        "email": unique_email,
        "password": "SuperSecret1337!",
        "bank_account_id": unique_bank_account,
    })
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"

    r = api.post("/api/auth/login", json={
        "email": unique_email, "password": "SuperSecret1337!"})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]
