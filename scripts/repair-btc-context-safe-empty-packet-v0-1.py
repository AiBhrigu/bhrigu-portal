#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "components/btc/BtcCosmographerDialogue.tsx"
value = path.read_text(encoding="utf-8")

old_context = '''  const contextFields = contextTurn ? {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    cd: contextTurn.route_domain ?? "unsupported",
    cs: contextTurn.route_subject ?? contextTurn.question_class ?? "unknown",
    ci: (contextTurn.route_intents ?? contextTurn.question_facets).join(","),
    ca: contextTurn.answer_state === "BOUNDED" ? "LIMITED" : contextTurn.answer_state,
    cm: contextTurn.market_question_class ?? contextTurn.question_class ?? "",
    ct0: contextTurn.time_start ?? contextTurn.observation_date ?? "",
    ct1: contextTurn.time_end ?? contextTurn.observation_date ?? "",
    cb: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;
'''
new_context = '''  const contextFields = contextTurn ? {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    cd: contextTurn.route_domain ?? "unsupported",
    cs: contextTurn.route_subject ?? contextTurn.question_class ?? "unknown",
    ci: (contextTurn.route_intents ?? contextTurn.question_facets).join(","),
    ca: contextTurn.answer_state === "BOUNDED" ? "LIMITED" : contextTurn.answer_state,
    cm: contextTurn.market_question_class ?? contextTurn.question_class ?? "",
    ct0: contextTurn.time_start ?? contextTurn.observation_date ?? "",
    ct1: contextTurn.time_end ?? contextTurn.observation_date ?? "",
    cb: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : {
    cc: "",
    cd: "",
    cs: "",
    ci: "",
    ca: "",
    cm: "",
    ct0: "",
    ct1: "",
    cb: "",
  };
'''
old_render = '''        {contextFields && Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
'''
new_render = '''        {Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
'''

if value.count(old_context) != 1:
    raise SystemExit(f"context field source mismatch: {value.count(old_context)}")
if value.count(old_render) != 1:
    raise SystemExit(f"context field render mismatch: {value.count(old_render)}")

value = value.replace(old_context, new_context, 1).replace(old_render, new_render, 1)
path.write_text(value, encoding="utf-8")
print({"status": "PASS_CONTEXT_SAFE_EMPTY_PACKET_REPAIR"})
