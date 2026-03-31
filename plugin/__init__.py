"""
Plugin package — re-exports register_plugin for the YFW plugin loader.
"""
import sys
from pathlib import Path

_here = Path(__file__).parent.parent
if str(_here) not in sys.path:
    sys.path.insert(0, str(_here))

from plugin.api import register_plugin  # noqa: F401

__all__ = ["register_plugin"]
