"""
Standalone FastAPI entry point.

Run with:
    uvicorn standalone.main:app --reload --port 8001

Or via Docker Compose:
    docker-compose -f standalone/docker/compose.yml up
"""
import sys
from pathlib import Path

# Ensure repo root is on sys.path so shared/ and standalone/ are importable
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load settings early so SURVEYS_DATABASE_URL is set before shared/database.py initialises
from standalone.config import get_settings  # noqa: E402

settings = get_settings()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from shared.database import create_tables  # noqa: E402
from shared.routers import public_router, surveys_router  # noqa: E402

PLUGIN_PREFIX = "/api/v1/surveys"
PUBLIC_PREFIX = "/api/v1/surveys/public"

app = FastAPI(
    title="YFW Surveys — Standalone",
    description="Survey builder and response collection, deployable as a standalone service.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(surveys_router, prefix=PLUGIN_PREFIX, tags=["surveys"])
app.include_router(public_router, prefix=PUBLIC_PREFIX, tags=["surveys-public"])


@app.on_event("startup")
async def startup():
    create_tables()


@app.get("/health")
def health():
    return {"status": "ok", "service": "yfw-surveys"}
