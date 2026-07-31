from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# Public page: route through the accepted multi-body detector, retain Astro memory,
# and use the shared public projection while preserving market freshness/source binding.
path = "pages/crypto-astro/btc/live.tsx"
replace_once(path,
'''import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";''',
'''import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";
import {
  routeBtcCosmographerLocalRc,
  type BtcMultiBodyAstroMemory,
  type BtcMultiBodyAstroRcRoute,
} from "../../../lib/btc-cosmographer-multi-body-astro-rc";
import {
  buildPublicMultiBodyAnswer,
  isPublicMultiBodyRoute,
} from "../../../lib/btc-cosmographer-public-multi-body-projection";''')

replace_once(path,
'''function needsMarket(route: BtcCosmographerRoute): boolean {
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
}
''',
'''function needsMarket(route: BtcCosmographerRoute): boolean {
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
}

function parseRetainedAstroMemory(
  query: Record<string, string | string[] | undefined>,
): BtcMultiBodyAstroMemory | null {
  const domain = first(query.rad);
  const subject = first(query.ras);
  const start = first(query.rat0);
  const end = first(query.rat1);
  if (
    domain !== "astromodule" ||
    subject !== "planetary_aspects" ||
    !validObservationDate(start) ||
    !validObservationDate(end) ||
    end < start
  ) return null;
  return { domain, subject, start, end };
}

function marketOnlyRoute(route: BtcMultiBodyAstroRcRoute): BtcCosmographerRoute {
  const marketClass = route.market_question_class ?? "liquidity";
  return {
    ...route,
    domain: "btc_market",
    subject: marketClass,
    market_question_class: marketClass,
    capability_id: `btc_market.${marketClass}`,
    explicit_entities: [marketClass],
  };
}
''')

replace_once(path,
'''  const parsed = parseBtcCosmographerContext(query);
  const packet = parsed.malformed
    ? null
    : parsed.packet ?? parseLegacyContext(query);
  const route = routeBtcCosmographerQuestion(resolvedLocale.locale, initialQuestion, packet, initialDate || undefined);
''',
'''  const parsed = parseBtcCosmographerContext(query);
  const packet = parsed.malformed
    ? null
    : parsed.packet ?? parseLegacyContext(query);
  const retainedAstroMemory = parseRetainedAstroMemory(query);
  const route = routeBtcCosmographerLocalRc(
    resolvedLocale.locale,
    initialQuestion,
    packet,
    initialDate || undefined,
    retainedAstroMemory,
  );
''')

replace_once(path,
'''  const answer = buildBtcCosmographerAnswer(resolvedLocale.locale, route, { snapshot, envelope });
''',
'''  const answer = isPublicMultiBodyRoute(route)
    ? buildPublicMultiBodyAnswer(
        resolvedLocale.locale,
        route,
        snapshot && envelope
          ? buildBtcCosmographerAnswer(
              resolvedLocale.locale,
              marketOnlyRoute(route),
              { snapshot, envelope },
            )
          : null,
      ) as unknown as BtcCosmographerAnswerProjection
    : buildBtcCosmographerAnswer(resolvedLocale.locale, route, { snapshot, envelope });
''')

# Public component: persist the latest multi-body Astro route independently from the
# latest topic, present special sections as cards/disclosures, and humanize the mode.
path = "components/btc/BtcCosmographerDialogue.tsx"
replace_once(path,
'''    ASTRO_STATE: ["Astromodule · состояние", "Astromodule · state"],
    ASTRO_BTC_BRIDGE: ["Astro × BTC · сопоставление", "Astro × BTC · comparison"],''',
'''    ASTRO_STATE: ["Astromodule · состояние", "Astromodule · state"],
    ASTRO_YEAR_OVERVIEW: ["Astromodule · годовой обзор", "Astromodule · annual overview"],
    ASTRO_BTC_BRIDGE: ["Astro × BTC · сопоставление", "Astro × BTC · comparison"],''')

replace_once(path,
'''  const contextTurn = latestContextTurn(turns);
  const hasConversation = turns.length > 0;
''',
'''  const contextTurn = latestContextTurn(turns);
  const retainedAstroTurn = [...turns].reverse().find((turn) =>
    turn.route_subject === "planetary_aspects" &&
    (turn.route_domain === "astromodule" || turn.route_domain === "astro_btc_bridge") &&
    Boolean(turn.time_start && turn.time_end),
  );
  const retainedAstroFields = retainedAstroTurn ? {
    rad: "astromodule",
    ras: "planetary_aspects",
    rat0: retainedAstroTurn.time_start ?? "",
    rat1: retainedAstroTurn.time_end ?? "",
  } : null;
  const hasConversation = turns.length > 0;
''')

replace_once(path,
'''        <input type="hidden" name="lang" value={locale}/>
        {contextFields && Object.entries(contextFields).map(([name, value]) =>''',
'''        <input type="hidden" name="lang" value={locale}/>
        {retainedAstroFields && Object.entries(retainedAstroFields).map(([name, value]) =>
          <input key={name} type="hidden" name={name} value={value}/>
        )}
        {contextFields && Object.entries(contextFields).map(([name, value]) =>''')

old = '''                {sections.length > 0 && <div className="answerNarrative">
                  {sections.map((section) => <section
                    key={`${turn.turn_id}-${section.id}`}
                    data-answer-section={legacySectionId(section.id)}
                    data-semantic-answer-section={section.id}
                  >
                    <p><strong>{section.label}.</strong></p>
                    {section.paragraph && <p>{section.paragraph}</p>}
                    {section.bullets && section.bullets.length > 0 && <ul>
                      {section.bullets.map((line, itemIndex) => <li key={`${turn.turn_id}-${section.id}-${itemIndex}`}>{line}</li>)}
                    </ul>}
                  </section>)}
                </div>}'''
new = '''                {sections.length > 0 && <div className="answerNarrative">
                  {sections.map((section) => {
                    const sectionKey = `${turn.turn_id}-${section.id}`;
                    if (section.id === "fast_triggers" && section.bullets?.length) {
                      return <section key={sectionKey} data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
                        <details className="answerDisclosure" data-complete-transitions="collapsed">
                          <summary>{section.label} · {section.bullets.length}</summary>
                          <ul>{section.bullets.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}</ul>
                        </details>
                      </section>;
                    }
                    return <section key={sectionKey} data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
                      <p><strong>{section.label}.</strong></p>
                      {section.paragraph && <p>{section.paragraph}</p>}
                      {section.bullets && section.bullets.length > 0 && <ul>
                        {section.bullets.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}
                      </ul>}
                    </section>;
                  })}
                </div>}'''
replace_once(path, old, new)

# Public-native styles: functional Phi hierarchy, chronological cards, collapsed proof
# inventory, and answer-first mobile behavior without replacing the existing shell.
path = "lib/btc-live-dialogue-style.ts"
replace_once(path,
''' .answerNarrative li{line-height:1.55;overflow-wrap:anywhere}
'''.lstrip(),
''' .answerNarrative li{line-height:1.55;overflow-wrap:anywhere}
.answerNarrative [data-semantic-answer-section="main_windows"]>ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0;list-style:none}
.answerNarrative [data-semantic-answer-section="main_windows"]>ul>li{margin:0;padding:14px;border:1px solid rgba(106,168,255,.22);border-radius:14px;background:rgba(10,22,38,.72)}
.answerNarrative [data-semantic-answer-section="market_layer"]{order:-1;padding:15px;border:1px solid rgba(210,164,95,.28);border-radius:14px;background:rgba(210,164,95,.045)}
.answerDisclosure{border:1px solid rgba(106,168,255,.2);border-radius:14px;background:rgba(5,12,21,.62)}
.answerDisclosure summary{cursor:pointer;padding:13px 15px;color:var(--t);font-weight:600}.answerDisclosure[open] summary{border-bottom:1px solid var(--bl)}.answerDisclosure ul{padding:13px 30px 16px}
'''.lstrip())

replace_once(path,
''' .liveDialogueShell:has(.liveThread) .liveThread{gap:22px}.dialogueExchange{gap:14px}.liveDialogueShell:has(.liveThread) .userTurn .turnBody{padding:15px 16px}.userTurn .turnBody{width:94%}.turnBody{padding:19px 17px}.answerHeader h2{font-size:clamp(27px,8.5vw,36px)}.answerLead{font-size:18px}.liveComposerControls{grid-template-columns:1fr}.liveBoundary{text-align:left}
'''.lstrip(),
''' .liveDialogueShell:has(.liveThread) .liveThread{gap:22px}.dialogueExchange{gap:14px}.liveDialogueShell:has(.liveThread) .userTurn .turnBody{padding:15px 16px}.userTurn .turnBody{width:94%}.turnBody{padding:19px 17px}.answerHeader h2{font-size:clamp(27px,8.5vw,36px)}.answerLead{font-size:18px}.answerNarrative [data-semantic-answer-section="main_windows"]>ul{grid-template-columns:1fr}.liveComposerControls{grid-template-columns:1fr}.liveBoundary{text-align:left}
'''.lstrip())

print("PASS_PUBLIC_LIVE_MULTI_BODY_PROJECTION_PATCH")
