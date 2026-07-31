from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


path = "components/btc/BtcCosmographerDialogue.tsx"

replace_once(
    path,
    '''function legacySectionId(id: string): string {
  if (id === "market_evidence") return "evidence";
  if (id === "market_limit") return "limit";
  if (id === "market_watch") return "change";
  return id;
}
''',
    '''function legacySectionId(id: string): string {
  if (id === "market_evidence") return "evidence";
  if (id === "market_limit") return "limit";
  if (id === "market_watch") return "change";
  return id;
}

type AstroWindowProjection = {
  rank: string;
  range: string;
  start: string;
  peak: string;
  title: string;
  basis: string;
};

function parseAstroWindowBullet(
  locale: BtcPublicLocale,
  bullet: string,
): AstroWindowProjection | null {
  const parts = bullet.split(" · ");
  if (parts.length < 3) return null;
  const rank = parts[0].replace(locale === "ru" ? "Ранг " : "Rank ", "").trim();
  const range = parts[1].trim();
  const remainder = parts.slice(2).join(" · ");
  const colon = remainder.indexOf(": ");
  if (!rank || !range || colon < 0) return null;
  const peak = remainder
    .slice(0, colon)
    .replace(locale === "ru" ? "пик " : "peak ", "")
    .trim();
  const body = remainder.slice(colon + 2);
  const marker = locale === "ru" ? ". Основания: " : ". Basis: ";
  const markerIndex = body.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = range.split("–")[0]?.trim() ?? "";
  return {
    rank,
    range,
    start,
    peak,
    title: body.slice(0, markerIndex).trim(),
    basis: body.slice(markerIndex + marker.length).replace(/\\.$/, "").trim(),
  };
}

function publicDomainLabel(locale: BtcPublicLocale, domain: string): string {
  const labels: Record<string, [string, string]> = {
    bitcoin_protocol: ["Bitcoin Protocol", "Bitcoin Protocol"],
    btc_market: ["BTC Market", "BTC Market"],
    snapshot_memory: ["Snapshot Memory", "Snapshot Memory"],
    astromodule: ["Astromodule", "Astromodule"],
    astro_btc_bridge: ["Astro × BTC", "Astro × BTC"],
    methodology: ["Метод и доказательность", "Method and evidence"],
    navigation: ["Навигация Bitcoin Corridor", "Bitcoin Corridor navigation"],
    unsupported: ["Граница поддержки", "Support boundary"],
  };
  const value = labels[domain] ?? [domain, domain];
  return locale === "ru" ? value[0] : value[1];
}

function AstroWindowSection({
  locale,
  section,
  sectionKey,
}: {
  locale: BtcPublicLocale;
  section: NonNullable<BtcDialogueTurn["sections"]>[number];
  sectionKey: string;
}) {
  const parsed = (section.bullets ?? []).map((bullet) =>
    parseAstroWindowBullet(locale, bullet)
  );
  if (parsed.some((item) => !item)) {
    return <section
      key={sectionKey}
      data-answer-section={legacySectionId(section.id)}
      data-semantic-answer-section={section.id}
    >
      <p><strong>{section.label}.</strong></p>
      <ul>{section.bullets?.map((line, itemIndex) =>
        <li key={`${sectionKey}-${itemIndex}`}>{line}</li>
      )}</ul>
    </section>;
  }
  return <section
    key={sectionKey}
    data-answer-section={legacySectionId(section.id)}
    data-semantic-answer-section={section.id}
  >
    <p><strong>{section.label}.</strong></p>
    <div className="astroWindowGrid">
      {(parsed as AstroWindowProjection[]).map((item) =>
        <article
          className="astroWindowCard"
          data-window-start={item.start}
          data-window-rank={item.rank}
          key={`${sectionKey}-${item.range}-${item.peak}`}
        >
          <div className="astroWindowRank" aria-label={`${locale === "ru" ? "Ранг" : "Rank"} ${item.rank}`}>
            <span>{locale === "ru" ? "Ранг" : "Rank"}</span>
            <strong>{item.rank}</strong>
          </div>
          <div className="astroWindowBody">
            <div className="astroWindowRange">{item.range}</div>
            <div className="astroWindowPeak">{locale === "ru" ? "пик" : "peak"} {item.peak}</div>
            <h3 className="astroWindowTitle">{item.title}</h3>
            <p className="astroWindowBasis">{item.basis}</p>
          </div>
        </article>
      )}
    </div>
  </section>;
}
''',
)

old_map = '''                  {sections.map((section) => {
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
                  })}'''
new_map = '''                  {sections.map((section) => {
                    const sectionKey = `${turn.turn_id}-${section.id}`;
                    if (section.id === "main_windows" && section.bullets?.length) {
                      return <AstroWindowSection
                        locale={turn.locale}
                        section={section}
                        sectionKey={sectionKey}
                        key={sectionKey}
                      />;
                    }
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
                  })}'''
replace_once(path, old_map, new_map)

replace_once(
    path,
    '''                  <span>{domain}</span>''',
    '''                  <span>{publicDomainLabel(turn.locale, domain)}</span>''',
)

path = "lib/btc-live-dialogue-style.ts"
replace_once(
    path,
    '''.answerNarrative [data-semantic-answer-section="main_windows"]>ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0;list-style:none}
.answerNarrative [data-semantic-answer-section="main_windows"]>ul>li{margin:0;padding:14px;border:1px solid rgba(106,168,255,.22);border-radius:14px;background:rgba(10,22,38,.72)}
''',
    '''.astroWindowGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.astroWindowCard{display:grid;grid-template-columns:auto minmax(0,1fr);gap:13px;margin:0;padding:15px;border:1px solid rgba(106,168,255,.22);border-radius:14px;background:rgba(10,22,38,.72)}
.astroWindowRank{display:grid;align-content:start;justify-items:center;min-width:52px;padding:9px 7px;border:1px solid rgba(106,168,255,.34);border-radius:12px;background:rgba(106,168,255,.055);color:var(--t)}
.astroWindowRank span{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}.astroWindowRank strong{font-size:22px;line-height:1.1}
.astroWindowBody{min-width:0}.astroWindowRange{color:var(--t);font-size:12px;line-height:1.4}.astroWindowPeak{margin-top:3px;color:var(--gold);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.astroWindowTitle{margin:10px 0 7px;color:var(--t);font-size:17px;line-height:1.25}.astroWindowBasis{margin:0!important;color:var(--t2)!important;font-size:13px;line-height:1.5!important}
''',
)
replace_once(
    path,
    '''.answerNarrative [data-semantic-answer-section="main_windows"]>ul{grid-template-columns:1fr}.liveComposerControls{grid-template-columns:1fr}''',
    '''.astroWindowGrid{grid-template-columns:1fr}.astroWindowCard{grid-template-columns:48px minmax(0,1fr);padding:13px}.liveComposerControls{grid-template-columns:1fr}''',
)

print("PASS_PUBLIC_LIVE_VISUAL_INFORMATION_TARGETED_REPAIR")
