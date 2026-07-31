from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# The accepted annual Astro answer contains 14 complete station/ingress bullets.
# Preserve it in the compact tab-local session while retaining a bounded validator.
replace_once(
    "lib/btc-live-dialogue-session.ts",
    '''    if (item.bullets !== undefined && !stringList(item.bullets, 12, 1200)) return false;''',
    '''    if (item.bullets !== undefined && !stringList(item.bullets, 24, 1200)) return false;''',
)

# Human-facing labels may intentionally keep canonical product names such as
# “Astromodule”; reject raw underscore enums rather than lowercased product names.
path = "scripts/verify-btc-public-live-visual-information-acceptance.py"
replace_once(
    path,
    '''RAW_DOMAINS = {
    "astromodule",
    "astro_btc_bridge",
    "bitcoin_protocol",
    "btc_market",
    "snapshot_memory",
    "methodology",
    "navigation",
    "unsupported",
}
''',
    '''PUBLIC_DOMAIN_LABELS = {
    "Bitcoin Protocol",
    "BTC Market",
    "Snapshot Memory",
    "Astromodule",
    "Astro × BTC",
    "Метод и доказательность",
    "Method and evidence",
    "Навигация Bitcoin Corridor",
    "Bitcoin Corridor navigation",
    "Граница поддержки",
    "Support boundary",
}
''',
)
replace_once(
    path,
    '''        first.casefold() not in RAW_DOMAINS and "_" not in first,''',
    '''        first in PUBLIC_DOMAIN_LABELS and "_" not in first,''',
)

print("PASS_PUBLIC_LIVE_SESSION_AND_PROOF_ACCEPTANCE_REPAIR")
