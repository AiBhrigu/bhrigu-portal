from pathlib import Path

path = Path("scripts/verify-btc-natural-followup-conversations.py")
text = path.read_text(encoding="utf-8")
old = '''        if tag not in ("unsupported",):
            record("turn2_continuity", attr(second, "data-context-relation") in ("FOLLOW_UP", "CROSS_MODULE_BRIDGE"), attr(second, "data-context-relation"))
'''
new = '''        if tag not in ("unsupported", "return", "date_return"):
            record("turn2_continuity", attr(second, "data-context-relation") in ("FOLLOW_UP", "CROSS_MODULE_BRIDGE"), attr(second, "data-context-relation"))
        elif tag in ("return", "date_return"):
            record("turn2_topic_switch", attr(second, "data-context-relation") == "NEW_TOPIC", attr(second, "data-context-relation"))
'''
if text.count(old) != 1:
    raise SystemExit(f"expected one verifier relation block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
Path(__file__).unlink()
