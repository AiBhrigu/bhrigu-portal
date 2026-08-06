from pathlib import Path

path = Path("lib/btc-cosmographer-route-graph.ts")
text = path.read_text(encoding="utf-8")
old = r'|протокол\s+(?:btc|bitcoin|биткоин)/i.test(question)) return "overview";'
new = r'|протокол[ауе]?\s+(?:btc|bitcoin|биткоин)/i.test(question)) return "overview";'
if text.count(old) != 1:
    raise SystemExit(f"expected one protocol overview anchor, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
Path(__file__).unlink()
