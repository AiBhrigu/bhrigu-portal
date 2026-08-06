from pathlib import Path

path = Path("lib/btc-cosmographer-route-graph.ts")
text = path.read_text(encoding="utf-8")
old = '''  const subject =
    forcedSubject ??
    (contextBridge ? packet?.prior_subject ?? null : null) ??
    body ??
    protocol ??
    market ??
    (domain === "methodology" ? "source_and_method" :
      domain === "navigation" ? "capabilities" :
        domain === "bitcoin_protocol" ? "overview" :
          domain === "btc_market" ? "general_btc_field" :
            domain === "unsupported" ? "unknown" : "general");'''
new = '''  const subject =
    forcedSubject ??
    (contextBridge ? packet?.prior_subject ?? null : null) ??
    (domain === "methodology" ? "source_and_method" : null) ??
    (domain === "navigation" ? "capabilities" : null) ??
    body ??
    protocol ??
    market ??
    (domain === "bitcoin_protocol" ? "overview" :
      domain === "btc_market" ? "general_btc_field" :
        domain === "unsupported" ? "unknown" : "general");'''
if text.count(old) != 1:
    raise SystemExit(f"expected one subject block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
Path(__file__).unlink()
