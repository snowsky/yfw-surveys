"""
Standalone authentication — validates API keys against the YFW instance.

Accepts:
  - X-API-Key: ak_...
  - Authorization: Bearer ak_...
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from standalone.config import Settings, get_settings

logger = logging.getLogger(__name__)

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_bearer = HTTPBearer(auto_error=False)

# Cache valid keys for 5 minutes
_key_cache: dict[str, float] = {}
_CACHE_TTL = 300


@dataclass
class StandaloneUser:
    email: str
    api_key: str
    id: Optional[int] = None
    tenant_id: Optional[str] = None


async def get_current_user(
    request: Request,
    api_key_header: Optional[str] = Depends(_api_key_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> StandaloneUser:
    key = api_key_header or (bearer.credentials if bearer else None)

    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required (X-API-Key header or Authorization: Bearer <key>).",
        )

    if _key_cache.get(key, 0) > time.time():
        return StandaloneUser(email="", api_key=key)

    # Bypass check if mock mode is on, or dev mode + dev key
    if settings.mock_yfw_api or (settings.development_mode and key == "ak_dev"):
        return StandaloneUser(email="dev@local", api_key=key)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{settings.yfw_api_url.rstrip('/')}/health",
                headers={"X-API-Key": key},
            )
        except httpx.RequestError as exc:
            error_msg = (
                f"Cannot reach YFW at {settings.yfw_api_url}. "
                f"Check if the main YFW container is running or if YFW_API_URL in .env "
                f"should point to a remote instance (e.g., https://demo.yourfinanceworks.com)."
            )
            logger.error(f"{error_msg} Original error: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=error_msg,
            ) from exc

    if resp.status_code == 401:
        _key_cache.pop(key, None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")
    if resp.status_code == 402:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="External API access not enabled on your YFW license.",
        )

    _key_cache[key] = time.time() + _CACHE_TTL
    return StandaloneUser(email="", api_key=key)
