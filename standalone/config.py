"""
Standalone configuration via environment variables.
"""
from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    yfw_api_url: str = "http://localhost:8000"
    yfw_api_key: str = ""
    development_mode: bool = False
    mock_yfw_api: bool = False
    secret_key: str = "change-me-in-production"
    surveys_database_url: str = "sqlite:///./surveys.db"
    api_port: int = 8001
    cors_origins: list[str] = ["*"]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    # Make the DB URL available for shared/database.py
    os.environ["SURVEYS_DATABASE_URL"] = settings.surveys_database_url
    return settings
