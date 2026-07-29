"""Compatibility entry point for the current BTC product surface.

The Field Read gate now validates the static proof page plus the single free live
dialogue. The canonical assertions live in verify-btc-live-dialogue-surface.py.
"""
import os
import runpy

os.environ.setdefault("BTC_LIVE_PREVIEW_BASE", "http://127.0.0.1:3000")

runpy.run_path("scripts/verify-btc-live-dialogue-surface.py", run_name="__main__")
