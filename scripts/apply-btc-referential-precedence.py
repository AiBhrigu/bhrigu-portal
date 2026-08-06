from pathlib import Path

path = Path("lib/btc-cosmographer-route-graph.ts")
text = path.read_text(encoding="utf-8")

old = '''  const explicit = entities.length > 0 || domain === "methodology" || domain === "navigation" || genesisChart;

  let relation: BtcCosmographerContextRelation;
  if (contextBridge) relation = "CROSS_MODULE_BRIDGE";
  else if (isReturn(q)) relation = "RETURN_TO_PREVIOUS_TOPIC";
  else if (!packet) relation = explicit ? "NEW_TOPIC" : "GENUINELY_AMBIGUOUS";
  else if (explicit && (domain !== packet.prior_domain || subject !== packet.prior_subject)) relation = "NEW_TOPIC";
  else if (explicit || isReferential(q) || (isVolatilityQuestion(q) && Boolean(forcedSubject))) relation = "FOLLOW_UP";
  else relation = "GENUINELY_AMBIGUOUS";

  const inheritsContext =
  relation === "FOLLOW_UP" || relation === "RETURN_TO_PREVIOUS_TOPIC";
  const resolvedDomain =
  inheritsContext && !explicit && packet
    ? packet.prior_domain
    : domain;
  const resolvedSubject =
  inheritsContext && !explicit && packet
    ? packet.prior_subject
    : subject;'''

new = '''  const explicit = entities.length > 0 || domain === "methodology" || domain === "navigation" || genesisChart;
  const referential = isReferential(q);

  let relation: BtcCosmographerContextRelation;
  if (contextBridge) relation = "CROSS_MODULE_BRIDGE";
  else if (isReturn(q)) relation = "RETURN_TO_PREVIOUS_TOPIC";
  else if (!packet) relation = explicit ? "NEW_TOPIC" : "GENUINELY_AMBIGUOUS";
  else if (referential) relation = "FOLLOW_UP";
  else if (explicit && (domain !== packet.prior_domain || subject !== packet.prior_subject)) relation = "NEW_TOPIC";
  else if (explicit || (isVolatilityQuestion(q) && Boolean(forcedSubject))) relation = "FOLLOW_UP";
  else relation = "GENUINELY_AMBIGUOUS";

  const inheritsContext =
  relation === "FOLLOW_UP" || relation === "RETURN_TO_PREVIOUS_TOPIC";
  const resolvedDomain =
  inheritsContext && (!explicit || referential) && packet
    ? packet.prior_domain
    : domain;
  const resolvedSubject =
  inheritsContext && (!explicit || referential) && packet
    ? packet.prior_subject
    : subject;'''

if text.count(old) != 1:
    raise SystemExit(f"expected one relation block, found {text.count(old)}")
text = text.replace(old, new, 1)

old_market = '''      ? market ?? packet?.prior_market_question_class ?? "general_btc_field"
      : null;'''
new_market = '''      ? referential && packet
        ? packet.prior_market_question_class ?? "general_btc_field"
        : market ?? packet?.prior_market_question_class ?? "general_btc_field"
      : null;'''
if text.count(old_market) != 1:
    raise SystemExit(f"expected one resolved market block, found {text.count(old_market)}")
text = text.replace(old_market, new_market, 1)

path.write_text(text, encoding="utf-8")
Path(__file__).unlink()
