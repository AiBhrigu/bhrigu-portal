#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "lib/btc-cosmographer-evidence-navigation-runtime.ts"
value = path.read_text(encoding="utf-8")
old = "const RELATION_OPERATOR = /impact|influence|affect|correlat|coincid|relation|compare|versus|\\bvs\\b|повлиял|влияни|связ|совпал|корреляц|сравн|между|подтверж/i;"
new = "const RELATION_OPERATOR = /impact|influence|affect|correlat|coincid|relat(?:e|ed|es|ing|ion)?|compare|versus|\\bvs\\b|повлиял|влияни|связ|совпал|корреляц|сравн|между|подтверж/i;"
if value.count(old) != 1:
    raise SystemExit("relation operator source did not match exactly")
path.write_text(value.replace(old, new, 1), encoding="utf-8")
print({"status": "PASS_RELATION_OPERATOR_REPAIR"})
