from pathlib import Path

path = Path("pages/crypto-astro/btc/live.tsx")
text = path.read_text(encoding="utf-8")
old = '''  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    routingQuestion,
    activePacket,
    retainedAstroMemory,
  );
  const route = relationResolution.route;'''
new = '''  const explicitReturn = Boolean(returnPacket && isReturnRequest(routingQuestion));
  const returnRoute = explicitReturn && returnPacket
    ? {
        ...initialRoute,
        domain: returnPacket.prior_domain,
        subject: returnPacket.prior_subject,
        intents: returnPacket.prior_intents,
        context_relation: "RETURN_TO_PREVIOUS_TOPIC" as const,
        time_range: returnPacket.prior_time_start && returnPacket.prior_time_end
          ? {
              start: returnPacket.prior_time_start,
              end: returnPacket.prior_time_end,
              label: returnPacket.prior_time_start === returnPacket.prior_time_end
                ? returnPacket.prior_time_start
                : `${returnPacket.prior_time_start} — ${returnPacket.prior_time_end}`,
              source: "CONTEXT" as const,
            }
          : null,
        market_question_class: returnPacket.prior_market_question_class,
        capability_id: `${returnPacket.prior_domain}.${returnPacket.prior_subject}`,
        confidence: "HIGH" as const,
        explicit_entities: Array.from(new Set([
          ...initialRoute.explicit_entities,
          returnPacket.prior_subject,
        ])),
      }
    : null;
  const relationResolution = returnRoute
    ? {
        route: returnRoute,
        relation_resolution: "SINGLE_DOMAIN" as const,
        btc_side_state_type: null,
      }
    : applyBtcRelationIntentPrecedence(
        initialRoute,
        routingQuestion,
        activePacket,
        retainedAstroMemory,
      );
  const route = relationResolution.route;'''
if text.count(old) != 1:
    raise SystemExit(f"expected one relation resolution block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
Path(__file__).unlink()
