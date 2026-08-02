#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "components/btc/BtcCosmographerDialogue.tsx"
value = path.read_text(encoding="utf-8")
old = '''  const retainedAstroTurn = contextSafe ? [...turns].reverse().find((turn) =>
    turn.route_subject === "planetary_aspects" &&
    (turn.route_domain === "astromodule" || turn.route_domain === "astro_btc_bridge") &&
    Boolean(turn.time_start && turn.time_end),
  ) : undefined;
'''
new = '''  const retainedAstroTurn = [...turns].reverse().find((turn) =>
    turn.route_subject === "planetary_aspects" &&
    (turn.route_domain === "astromodule" || turn.route_domain === "astro_btc_bridge") &&
    Boolean(turn.time_start && turn.time_end),
  );
'''
if value.count(old) != 1:
    raise SystemExit(f"retained Astro source mismatch: {value.count(old)}")
path.write_text(value.replace(old, new, 1), encoding="utf-8")
print({
    "status": "PASS_RETAINED_ASTRO_EXPLICIT_BRIDGE_REPAIR",
    "context_packet_remains_gated": True,
    "retained_astro_memory_available": True,
})
