"""
Compatibility shim — detects whether we are running as a YFW plugin or standalone.

Usage:
    from shared.compat import get_current_user, get_company_name, STANDALONE
"""

try:
    # ── Plugin mode ───────────────────────────────────────────────────────────
    from core.routers.auth import get_current_user  # noqa: F401
    from core.models.database import get_master_db as _get_master_db, get_tenant_context as _get_tenant_context
    from core.models.models import Tenant as _Tenant

    def get_company_name() -> str:
        """Return the current tenant's company name (call only from authenticated endpoints)."""
        tenant_id = _get_tenant_context()
        if not tenant_id:
            return ""
        gen = _get_master_db()
        db = next(gen)
        try:
            tenant = db.query(_Tenant).filter(_Tenant.id == tenant_id).first()
            return tenant.name if (tenant and tenant.name) else ""
        finally:
            db.close()

    STANDALONE = False

except ImportError:
    # ── Standalone mode ───────────────────────────────────────────────────────
    import os as _os
    from standalone.auth import get_current_user    # noqa: F401

    def get_company_name() -> str:
        return _os.environ.get("COMPANY_NAME", "")

    STANDALONE = True

__all__ = ["get_current_user", "get_company_name", "STANDALONE"]
