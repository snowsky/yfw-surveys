"""
YourFinanceWORKS surveys plugin package root.

When installed as a plugin (repo cloned into api/plugins/surveys/),
adding this directory to sys.path makes both `plugin` and `shared`
importable as top-level packages in plugin mode.
"""
import sys
from pathlib import Path

_here = Path(__file__).parent
if str(_here) not in sys.path:
    sys.path.insert(0, str(_here))

from plugin.api import register_plugin  # noqa: E402

__all__ = ["register_plugin"]
