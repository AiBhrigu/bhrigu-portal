"""Compatibility entry point for the current BTC product surface.

The Field Read gate now validates the static proof page plus the single free live
dialogue. The canonical assertions live in verify-btc-live-dialogue-surface.py.
"""
import runpy

runpy.run_path("scripts/verify-btc-live-dialogue-surface.py", run_name="__main__")
