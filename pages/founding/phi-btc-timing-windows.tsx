import Head from "next/head";
import type { GetServerSideProps } from "next";
import { loadBtcHomeAcceptedState, type BtcHomeAcceptedState } from "../../lib/btc-home-accepted-state";
import { loadPublicEphemeridesToday } from "../../lib/public-ephemerides-live";

type Locale = "en" | "ru";
type CheckpointRow = {
  id: string;
  day: number;
  date: string;
};
type DemonstrationWindow = {
  dateRange: string;
  btcStructure: string;
  condition: string;
  invalidation: string;
  astroContext: string;
  lunarContext: string;
  sourceTime: string | null;
  proofBoundary: string;
};
type Props = {
  locale: Locale;
  baseline: BtcHomeAcceptedState;
  generatedAtUtc: string;
  checkpoints: CheckpointRow[];
  sampleWindow: DemonstrationWindow;
};

const DAYPOINTS = [0, 7, 14, 21, 28, 30] as const;
const IDS = ["BASELINE", "DAY_7", "DAY_14", "DAY_21", "DAY_28", "DAY_30_CLOSEOUT"] as const;

function isoDay(base: Date, offset: number) {
  const d = new Date(base.getTime() + offset * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function buildDemonstrationWindow(locale: Locale, base: Date, baseline: BtcHomeAcceptedState): DemonstrationWindow {
  const checkpointDays = new Set<number>(DAYPOINTS);
  const candidates: Array<{ day: number; orb: number; field: string; lunar: string; sourceTime: string | null }> = [];

  for (let day = 1; day < 30; day += 1) {
    if (checkpointDays.has(day)) continue;
    const d = new Date(base.getTime() + day * 86_400_000);
    const eph = loadPublicEphemeridesToday(locale, d) as any;
    if (!eph?.live || !Array.isArray(eph.aspects) || eph.aspects.length === 0) continue;
    const aspects = [...eph.aspects].sort((a: any, b: any) => Number(a.orb ?? 999) - Number(b.orb ?? 999));
    const lead = aspects[0];
    const orb = Number(lead?.orb ?? 999);
    if (!Number.isFinite(orb)) continue;
    candidates.push({
      day,
      orb,
      field: `${lead.aName} ${lead.aspectName} ${lead.bName} · orb ${orb.toFixed(2)}° · ${lead.phaseLabel}`,
      lunar: eph?.lunarPhase?.label
        ? `${eph.lunarPhase.label} · ${Number(eph.lunarPhase.elongation_deg).toFixed(1)}°`
        : locale === "ru" ? "Лунная фаза недоступна" : "Lunar phase unavailable",
      sourceTime: eph.observationTime ?? null,
    });
  }

  const selected = candidates.sort((a, b) => a.orb - b.orb || a.day - b.day)[0] ?? {
    day: 1,
    orb: 999,
    field: locale === "ru" ? "Canonical Astro context недоступен" : "Canonical Astro context unavailable",
    lunar: locale === "ru" ? "Лунная фаза недоступна" : "Lunar phase unavailable",
    sourceTime: null,
  };
  const startDay = Math.max(1, selected.day - 1);
  const endDay = Math.min(29, selected.day + 1);
  const structure = `${baseline.delta_direction} / ${baseline.synthesis_state} / ${baseline.conditions_state}`;

  return {
    dateRange: `${isoDay(base, startDay)} → ${isoDay(base, endDay)}`,
    btcStructure: locale === "ru"
      ? `Accepted BTC baseline: ${structure}. Это исходная структура, относительно которой проверяется окно.`
      : `Accepted BTC baseline: ${structure}. This is the starting structure against which the window is tested.`,
    condition: locale === "ru"
      ? `Окно сохраняет исследовательский приоритет только если независимые BTC market-evidence lanes подтверждают структурное изменение относительно locked baseline ${baseline.delta_direction}/${baseline.synthesis_state}.`
      : `The window keeps research priority only if independent BTC market-evidence lanes confirm a structural change versus the locked ${baseline.delta_direction}/${baseline.synthesis_state} baseline.`,
    invalidation: locale === "ru"
      ? "Если BTC-структура не подтверждает изменение, evidence расходится или freshness/proof boundary не проходит проверку, окно остаётся неподтверждённым или инвалидируется независимо от Astro context."
      : "If BTC structure does not confirm a change, evidence diverges, or the freshness/proof boundary fails, the window remains unconfirmed or is invalidated regardless of Astro context.",
    astroContext: selected.field,
    lunarContext: selected.lunar,
    sourceTime: selected.sourceTime,
    proofBoundary: locale === "ru"
      ? "DEMONSTRATION SAMPLE · NOT ACCEPTED FORECAST. Формат следует существующему Φ BTC Timing Windows baseline contract: реальные baseline runs фиксируют 2–4 prospective windows из независимой BTC evidence; Astro / Ephemerides остаются supporting temporal context и не создают причинный BTC signal."
      : "DEMONSTRATION SAMPLE · NOT ACCEPTED FORECAST. The format follows the existing Φ BTC Timing Windows baseline contract: real baseline runs lock 2–4 prospective windows from independent BTC evidence; Astro / Ephemerides remain supporting temporal context and do not create a causal BTC signal.",
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const locale: Locale = query.lang === "ru" ? "ru" : "en";
  const baseline = await loadBtcHomeAcceptedState();
  const now = new Date();
  const checkpoints = DAYPOINTS.map((day, index) => ({ id: IDS[index], day, date: isoDay(now, day) }));
  const sampleWindow = buildDemonstrationWindow(locale, now, baseline);
  return { props: { locale, baseline, generatedAtUtc: now.toISOString(), checkpoints, sampleWindow } };
};

export default function PhiBtcTimingWindowsFounding({ locale, baseline, generatedAtUtc, checkpoints, sampleWindow }: Props) {
  const ru = locale === "ru";
  const t = ru ? {
    eyebrow: "BHRIGU · FOUNDING RESEARCH OBJECT",
    title: "Φ BTC Timing Windows · Founding",
    lead: "30-дневный частный Bitcoin research object: фиксируем сегодняшнее состояние, отслеживаем prospective timing windows и сохраняем исходную запись через весь период.",
    question: "Какие окна времени, структурные условия и точки инвалидации наиболее важны для Bitcoin в следующие 30 дней?",
    privateLabel: "30 ДНЕЙ · BTC ONLY · 6 CHECKPOINTS",
    cosmographTitle: "The 30-Day Bitcoin Cosmograph",
    cosmographLead: "Один исследовательский объект связывает зафиксированное знание, текущее accepted BTC field, будущие окна, условия проверки, invalidation и итоговый closeout.",
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    pastLead: "Что было зафиксировано",
    nowLead: "Что принято сейчас",
    futureLead: "Что мы отслеживаем",
    lockedRecord: "Locked baseline",
    acceptedField: "Current accepted BTC field",
    prospective: "Prospective window",
    confirm: "What would confirm it",
    break: "What would break it",
    closeout: "What actually happened",
    memory: "Append-only memory",
    proof: "Source-bound proof",
    astroField: "Independent temporal field",
    astroStatus: "Canonical Ephemerides available · supporting only",
    astroBoundary: "No Bitcoin causality · No trading signal",
    checkpoint: "REASSESS",
    closeoutShort: "DAY 30 CLOSEOUT",
    categoryKicker: "AFTER THE OBJECT IS UNDERSTOOD",
    categoryTitle: "THIS IS A COSMOGRAPHER RESEARCH OBJECT",
    categoryLead: "Не чат с последовательностью ответов, а временная карта одного исследования: claims фиксируются, будущие окна наблюдаются, условия проверяются, изменения дописываются, а исходная запись не переписывается.",
    compositionTitle: "Analytical axes",
    compositionPrimary: "PRIMARY · Bitcoin market / technical evidence",
    compositionSupporting: "SUPPORTING · Astro / Ephemerides temporal field",
    compositionControl: "CONTROL · Locked claims / memory / invalidation / proof",
    compositionNote: "PRIMARY / SUPPORTING / CONTROL — роли в исследовании, не фиксированные процентные веса.",
    astroTitle: "Astro / Ephemerides field",
    astroText: "На offer-уровне видны присутствие, временная связь, исследовательская роль и источник. Exact transit / lunar evidence остаётся ниже, в deep research / Ephemerides view.",
    astroPossible: "Possible context · aspect phase · stations / ingresses · lunar context · eclipse context when relevant",
    sourceTitle: "Source & Proof",
    sourceText: "BTC state использует accepted market evidence corridor. Temporal field использует canonical public-safe Ephemerides. Выводы ограничены freshness, provenance, uncertainty и explicit invalidation.",
    difference: "Why this is different",
    notItems: ["Generic AI chat", "Trading signal", "Astrology prediction"],
    yesItems: ["Locked research identity", "Prospective windows", "Explicit invalidation", "Append-only continuity", "Independent temporal field", "Day 30 closeout"],
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake остаётся ручным. На этой Preview-странице нет цены, checkout, кошелька или платёжной активации.",
    preview: "VERCEL PREVIEW · OPERATOR REVIEW",
  } : {
    eyebrow: "BHRIGU · FOUNDING RESEARCH OBJECT",
    title: "Φ BTC Timing Windows · Founding",
    lead: "A 30-day private Bitcoin research object: lock today's state, track prospective timing windows, and preserve the original record through the full period.",
    question: "What are the most important Bitcoin timing windows, structural conditions, and invalidation points over the next 30 days?",
    privateLabel: "30 DAYS · BTC ONLY · 6 CHECKPOINTS",
    cosmographTitle: "The 30-Day Bitcoin Cosmograph",
    cosmographLead: "One research object connects the locked record, the current accepted BTC field, future windows, test conditions, invalidation, and the final closeout.",
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    pastLead: "What was fixed",
    nowLead: "What is accepted now",
    futureLead: "What we are watching",
    lockedRecord: "Locked baseline",
    acceptedField: "Current accepted BTC field",
    prospective: "Prospective window",
    confirm: "What would confirm it",
    break: "What would break it",
    closeout: "What actually happened",
    memory: "Append-only memory",
    proof: "Source-bound proof",
    astroField: "Independent temporal field",
    astroStatus: "Canonical Ephemerides available · supporting only",
    astroBoundary: "No Bitcoin causality · No trading signal",
    checkpoint: "REASSESS",
    closeoutShort: "DAY 30 CLOSEOUT",
    categoryKicker: "AFTER THE OBJECT IS UNDERSTOOD",
    categoryTitle: "THIS IS A COSMOGRAPHER RESEARCH OBJECT",
    categoryLead: "Not a chat stream, but a time-bound map of one investigation: claims are locked, future windows are watched, conditions are tested, changes are appended, and the original record is preserved.",
    compositionTitle: "Analytical axes",
    compositionPrimary: "PRIMARY · Bitcoin market / technical evidence",
    compositionSupporting: "SUPPORTING · Astro / Ephemerides temporal field",
    compositionControl: "CONTROL · Locked claims / memory / invalidation / proof",
    compositionNote: "PRIMARY / SUPPORTING / CONTROL are research roles, not fixed percentage weights.",
    astroTitle: "Astro / Ephemerides field",
    astroText: "At offer level, the product shows presence, temporal relation, research role, and source. Exact transit / lunar evidence remains below, in the deep research / Ephemerides view.",
    astroPossible: "Possible context · aspect phase · stations / ingresses · lunar context · eclipse context when relevant",
    sourceTitle: "Source & Proof",
    sourceText: "BTC state uses the accepted market evidence corridor. The temporal field uses canonical public-safe Ephemerides. Conclusions are bounded by freshness, provenance, uncertainty, and explicit invalidation.",
    difference: "Why this is different",
    notItems: ["Generic AI chat", "Trading signal", "Astrology prediction"],
    yesItems: ["Locked research identity", "Prospective windows", "Explicit invalidation", "Append-only continuity", "Independent temporal field", "Day 30 closeout"],
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake remains manual. This Preview contains no public price, checkout, wallet, or payment activation.",
    preview: "VERCEL PREVIEW · OPERATOR REVIEW",
  };

  const baselineTime = baseline.snapshot_time_utc ?? generatedAtUtc;
  return <>
    <Head>
      <title>{t.title}</title>
      <meta name="description" content={t.lead} />
      <meta name="robots" content="noindex,nofollow" />
    </Head>
    <main>
      <nav className="topbar">
        <span className="brand">BHRIGU</span>
        <span className="preview">{t.preview}</span>
        <span className="lang"><a href="?lang=en">EN</a><span>/</span><a href="?lang=ru">RU</a></span>
      </nav>

      <header className="hero">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
        <p className="question">{t.question}</p>
        <div className="identityRow">
          <strong>{t.privateLabel}</strong>
          <span>FORECAST_001 · CONDITIONAL</span>
          <span>SOURCE-LINKED</span>
        </div>
      </header>

      <section className="cosmograph" aria-label={t.cosmographTitle}>
        <div className="cosmographHead">
          <div>
            <span className="objectMark">SIGNATURE OBJECT · 01</span>
            <h2>{t.cosmographTitle}</h2>
          </div>
          <p>{t.cosmographLead}</p>
        </div>

        <div className="cosmographBody">
          <div className="timeField">
            <div className="timeLabels" aria-hidden="true">
              <span>{t.past}</span><span>{t.now}</span><span>{t.future}</span>
            </div>

            <div className="astroBand">
              <span>SUPPORTING · TEMPORAL FIELD</span>
              <strong>{t.astroField}</strong>
              <small>{t.astroStatus}</small>
              <em>{t.astroBoundary}</em>
            </div>

            <div className="timeAxis" aria-hidden="true">
              <span className="pastSegment"></span>
              <i className="nowNeedle"></i>
              <span className="futureSegment"></span>
            </div>

            <div className="temporalGrid">
              <article className="pastNode">
                <span className="nodeRole">{t.pastLead}</span>
                <strong>{t.lockedRecord}</strong>
                <b>{baselineTime.replace("T", " ").slice(0, 16)} UTC</b>
                <small>{baseline.evidence_source_count} {ru ? "proof sources" : "proof sources"} · {baseline.freshness}</small>
              </article>

              <article className="nowNode">
                <span className="nodeRole">{t.nowLead}</span>
                <strong>{t.acceptedField}</strong>
                <div className="stateTriplet">
                  <span><small>STATE</small><b>{baseline.status}</b></span>
                  <span><small>DELTA</small><b>{baseline.delta_direction}</b></span>
                  <span><small>SYNTHESIS</small><b>{baseline.synthesis_state}</b></span>
                </div>
              </article>

              <article className="futureNode">
                <div className="futureWindowHead">
                  <span className="nodeRole">{t.futureLead}</span>
                  <small>DEMONSTRATION · NOT ACCEPTED FORECAST</small>
                </div>
                <strong>{t.prospective}</strong>
                <b className="windowDate">{sampleWindow.dateRange}</b>
                <p>{sampleWindow.btcStructure}</p>
                <div className="futureConditions">
                  <div className="confirm"><span>{t.confirm}</span><p>{sampleWindow.condition}</p></div>
                  <div className="invalidate"><span>{t.break}</span><p>{sampleWindow.invalidation}</p></div>
                </div>
              </article>
            </div>

            <div className="checkpointRail" aria-label="30-day reassessment rhythm">
              {checkpoints.map((checkpoint, index) => <div className={index === 0 ? "checkpoint active" : "checkpoint"} key={checkpoint.id}>
                <i aria-hidden="true"></i>
                <span>{index === 0 ? "LOCK" : index === checkpoints.length - 1 ? "CLOSE" : t.checkpoint}</span>
                <strong>{checkpoint.id}</strong>
                <small>{checkpoint.date}</small>
              </div>)}
            </div>
          </div>

          <aside className="controlField">
            <div className="controlHead"><span>CONTROL · RESEARCH INTEGRITY</span><strong>LOCK → APPEND → CLOSE</strong></div>
            <div className="controlSpine" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            <div className="controlStack">
              <div><span>01</span><strong>LOCKED CLAIMS</strong><small>{baselineTime.slice(0, 10)}</small></div>
              <div><span>02</span><strong>FORECAST MEMORY</strong><small>{t.memory}</small></div>
              <div><span>03</span><strong>INVALIDATION</strong><small>{ru ? "Explicit break condition" : "Explicit break condition"}</small></div>
              <div><span>04</span><strong>WHAT CHANGED</strong><small>ENTRY 00 → DAY 30</small></div>
              <div><span>05</span><strong>SOURCE & PROOF</strong><small>{t.proof}</small></div>
            </div>
            <div className="closeoutSeal"><span>{t.closeout}</span><strong>{t.closeoutShort}</strong><small>HELD / FAILED / UNRESOLVED</small></div>
          </aside>
        </div>

        <div className="cosmographLegend">
          <span><b>PRIMARY</b> Bitcoin market / technical evidence</span>
          <span><b>SUPPORTING</b> Astro / Ephemerides temporal field</span>
          <span><b>CONTROL</b> Memory · invalidation · proof</span>
        </div>
      </section>

      <section className="categoryReveal">
        <span>{t.categoryKicker}</span>
        <h2>{t.categoryTitle}</h2>
        <p>{t.categoryLead}</p>
      </section>

      <section className="axesSection">
        <div className="axesLead"><span>FIELD RELATION</span><h2>{t.compositionTitle}</h2><p>{t.compositionNote}</p></div>
        <div className="axesMap">
          <div className="axisPrimary"><span>PRIMARY</span><strong>{t.compositionPrimary}</strong></div>
          <div className="axisSupporting"><span>SUPPORTING</span><strong>{t.compositionSupporting}</strong></div>
          <div className="axisControl"><span>CONTROL</span><strong>{t.compositionControl}</strong></div>
        </div>
      </section>

      <section className="supportGrid">
        <article className="supportPanel astroPanel">
          <span className="supportMark">TEMPORAL FIELD</span>
          <h2>{t.astroTitle}</h2>
          <p>{t.astroText}</p>
          <div className="astroAvailability">
            <strong>Canonical Ephemerides</strong>
            <span>AVAILABLE</span>
          </div>
          <small>{t.astroPossible}</small>
          <em>{t.astroBoundary}</em>
        </article>
        <article className="supportPanel proofPanel">
          <span className="supportMark">CONTROL FIELD</span>
          <h2>{t.sourceTitle}</h2>
          <p>{t.sourceText}</p>
          <div className="proofLines">
            <span>BTC accepted Snapshot / change memory</span>
            <span>Canonical public-safe daily Ephemerides</span>
            <span>Freshness + provenance + uncertainty</span>
            <span>No causal claim · no trading instruction</span>
          </div>
        </article>
      </section>

      <section className="differenceSection">
        <div className="differenceHead"><span>PRODUCT BOUNDARY</span><h2>{t.difference}</h2></div>
        <div className="differenceGrid">
          <div className="notColumn"><span>NOT THIS</span>{t.notItems.map(item => <p key={item}><b>×</b>{item}</p>)}</div>
          <div className="yesColumn"><span>THIS</span>{t.yesItems.map(item => <p key={item}><b>+</b>{item}</p>)}</div>
        </div>
      </section>

      <section id="request" className="cta">
        <p className="eyebrow">FOUNDING · PRIVATE RESEARCH</p>
        <h2>{t.request}</h2>
        <p>{t.requestText}</p>
        <button type="button" aria-label={t.request}>{t.request}</button>
        <small>LOCKED BASELINE → PROSPECTIVE WINDOWS → APPEND-ONLY REASSESSMENT → DAY 30 CLOSEOUT</small>
      </section>
    </main>

    <style jsx>{`
      :global(html){background:#efede6;color:#111;scroll-behavior:smooth}
      :global(body){margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#efede6;color:#111}
      :global(*){box-sizing:border-box} a{color:inherit;text-decoration:none}
      main{max-width:1220px;margin:0 auto;padding:0 28px 76px}
      .topbar{height:70px;display:flex;align-items:center;border-bottom:1px solid #c7c2b7;gap:24px;font-size:11px;letter-spacing:.14em}.brand{font-size:15px;font-weight:900}.preview{color:#6d685f}.lang{margin-left:auto;display:flex;gap:7px}
      .hero{padding:58px 0 48px;max-width:960px}.eyebrow{font-size:10px;letter-spacing:.2em;font-weight:800;margin:0 0 16px;color:#6b675f}.hero h1{font-family:Georgia,serif;font-size:clamp(46px,6.5vw,82px);line-height:.94;letter-spacing:-.045em;margin:0 0 22px;font-weight:500}.lead{font-size:clamp(18px,2vw,27px);line-height:1.32;max-width:860px;margin:0 0 18px}.question{font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.5;max-width:800px;color:#39362f}.identityRow{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}.identityRow>*{border:1px solid #aaa59a;padding:8px 11px;font-size:9px;letter-spacing:.11em}

      .cosmograph{background:#11110f;color:#f5f2e9;border:1px solid #11110f;margin-bottom:22px;overflow:hidden}.cosmographHead{display:grid;grid-template-columns:1.618fr 1fr;gap:38px;align-items:end;padding:30px 32px 26px;border-bottom:1px solid #393730}.objectMark{display:block;color:#d8ff72;font-size:9px;letter-spacing:.18em;margin-bottom:10px}.cosmographHead h2{font-family:Georgia,serif;font-size:clamp(34px,4.5vw,57px);line-height:1;letter-spacing:-.035em;font-weight:500;margin:0}.cosmographHead p{margin:0;color:#b9b4aa;line-height:1.62;font-size:13px}
      .cosmographBody{display:grid;grid-template-columns:minmax(0,1.618fr) minmax(260px,1fr);min-height:690px}.timeField{position:relative;padding:28px 30px 24px;border-right:1px solid #393730;overflow:hidden;background:radial-gradient(circle at 38.2% 43%,rgba(216,255,114,.07),transparent 26%),#11110f}.timeLabels{display:grid;grid-template-columns:38.2% 12% 49.8%;font-size:9px;letter-spacing:.18em;color:#777269;margin-bottom:14px}.timeLabels span:nth-child(2){color:#d8ff72;text-align:center}.timeLabels span:last-child{text-align:right}
      .astroBand{position:relative;margin:0 0 38px 38.2%;width:61.8%;min-height:70px;border-top:1px solid #69655d;border-bottom:1px solid #393730;padding:11px 14px 10px}.astroBand:before{content:"";position:absolute;left:0;top:-5px;width:9px;height:9px;border:1px solid #c8c3b9;border-radius:50%;background:#11110f}.astroBand span,.astroBand strong,.astroBand small,.astroBand em{display:block}.astroBand span{font-size:8px;letter-spacing:.14em;color:#918c82}.astroBand strong{font-family:Georgia,serif;font-size:16px;font-weight:500;margin:5px 0}.astroBand small{color:#aaa59b;font-size:10px}.astroBand em{font-size:9px;color:#777269;font-style:normal;margin-top:5px}
      .timeAxis{position:relative;height:38px;margin:0 2px 6px}.timeAxis:before{content:"";position:absolute;left:0;right:0;top:18px;height:1px;background:#656158}.pastSegment{position:absolute;left:0;top:15px;width:38.2%;height:7px;border-top:1px solid #8b867b;border-bottom:1px solid #393730}.futureSegment{position:absolute;left:38.2%;right:0;top:15px;height:7px;border-top:1px solid #d8ff72;border-bottom:1px solid #4d4a43}.nowNeedle{position:absolute;left:38.2%;top:0;width:1px;height:38px;background:#d8ff72;box-shadow:0 0 0 4px rgba(216,255,114,.08)}.nowNeedle:after{content:"";position:absolute;left:-4px;top:14px;width:9px;height:9px;border-radius:50%;background:#d8ff72}
      .temporalGrid{display:grid;grid-template-columns:38.2% 23.6% 38.2%;min-height:330px}.temporalGrid article{padding:20px 18px 18px;position:relative}.pastNode{border-right:1px solid #393730;color:#b5b0a6}.nowNode{border-right:1px solid #393730;background:#181813}.futureNode{background:#151511}.nodeRole{display:block;font-size:8px;letter-spacing:.14em;color:#817c72;text-transform:uppercase;margin-bottom:18px}.temporalGrid strong{display:block;font-family:Georgia,serif;font-size:20px;line-height:1.15;font-weight:500;margin-bottom:12px}.pastNode b,.windowDate{display:block;font-size:11px;letter-spacing:.04em;color:#f5f2e9;margin-bottom:8px}.pastNode small{font-size:10px;color:#777269;line-height:1.45}.stateTriplet{display:grid;gap:11px;margin-top:22px}.stateTriplet span{border-top:1px solid #3f3d36;padding-top:9px}.stateTriplet small,.stateTriplet b{display:block}.stateTriplet small{font-size:7px;letter-spacing:.13em;color:#817c72}.stateTriplet b{font-size:11px;margin-top:4px;color:#d8ff72;overflow-wrap:anywhere}.futureWindowHead{display:flex;justify-content:space-between;gap:10px;align-items:start}.futureWindowHead>small{font-size:7px;letter-spacing:.08em;color:#706c64;text-align:right;max-width:150px}.futureNode>p{font-size:10px;line-height:1.5;color:#a9a49a;margin:12px 0 16px}.futureConditions{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#34322d;border:1px solid #34322d}.futureConditions>div{background:#11110f;padding:12px}.futureConditions span{display:block;font-size:8px;letter-spacing:.1em;margin-bottom:7px}.futureConditions p{font-size:9px;line-height:1.45;color:#aaa59b;margin:0}.confirm span{color:#d8ff72}.invalidate span{color:#c6c0b4}
      .checkpointRail{display:grid;grid-template-columns:repeat(6,1fr);margin-top:26px;border-top:1px solid #393730}.checkpoint{position:relative;padding:18px 7px 8px;border-right:1px solid #2d2b27;min-height:78px}.checkpoint:last-child{border-right:0}.checkpoint i{position:absolute;top:-5px;left:50%;width:9px;height:9px;border:1px solid #777269;border-radius:50%;background:#11110f}.checkpoint.active i{background:#d8ff72;border-color:#d8ff72}.checkpoint span,.checkpoint strong,.checkpoint small{display:block}.checkpoint span{font-size:7px;letter-spacing:.1em;color:#777269}.checkpoint strong{font-size:8px;margin:9px 0 3px;overflow-wrap:anywhere}.checkpoint small{font-size:8px;color:#656158}.checkpoint:last-child strong{color:#d8ff72}
      .controlField{position:relative;padding:28px 25px 24px;background:#e9e6dd;color:#151512}.controlHead{border-bottom:1px solid #bbb6aa;padding-bottom:17px}.controlHead span,.controlHead strong{display:block}.controlHead span{font-size:8px;letter-spacing:.15em;color:#777168}.controlHead strong{font-family:Georgia,serif;font-size:21px;font-weight:500;margin-top:8px}.controlSpine{position:absolute;left:39px;top:105px;bottom:155px;width:1px;background:#aaa499;display:flex;flex-direction:column;justify-content:space-around}.controlSpine i{width:7px;height:7px;border:1px solid #11110f;border-radius:50%;background:#e9e6dd;transform:translateX(-3px)}.controlStack{padding:14px 0 8px 30px}.controlStack>div{min-height:78px;padding:15px 0;border-bottom:1px solid #ccc7bc}.controlStack span,.controlStack strong,.controlStack small{display:block}.controlStack span{font-size:8px;color:#8a8479}.controlStack strong{font-size:10px;letter-spacing:.1em;margin:7px 0}.controlStack small{font-family:Georgia,serif;font-size:14px;color:#5f5a52}.closeoutSeal{margin:18px 0 0 30px;border:1px solid #11110f;padding:15px}.closeoutSeal span,.closeoutSeal strong,.closeoutSeal small{display:block}.closeoutSeal span{font-size:8px;letter-spacing:.1em;color:#777168}.closeoutSeal strong{font-family:Georgia,serif;font-size:18px;font-weight:500;margin:8px 0}.closeoutSeal small{font-size:8px;letter-spacing:.08em}
      .cosmographLegend{display:grid;grid-template-columns:1.618fr 1fr 1fr;border-top:1px solid #393730}.cosmographLegend span{padding:13px 18px;border-right:1px solid #393730;font-size:9px;color:#aaa59b}.cosmographLegend span:last-child{border-right:0}.cosmographLegend b{color:#f5f2e9;margin-right:7px;font-size:8px;letter-spacing:.1em}.cosmographLegend span:first-child b{color:#d8ff72}

      .categoryReveal{padding:76px 0 72px;display:grid;grid-template-columns:38.2% 61.8%;border-bottom:1px solid #c7c2b7}.categoryReveal>span{font-size:9px;letter-spacing:.16em;color:#7c766d;padding-top:10px}.categoryReveal h2{grid-column:2;font-family:Georgia,serif;font-size:clamp(38px,5.3vw,70px);line-height:.96;letter-spacing:-.04em;font-weight:500;margin:0 0 24px}.categoryReveal p{grid-column:2;font-size:16px;line-height:1.6;max-width:720px;margin:0;color:#514d46}
      .axesSection{padding:34px 0 42px;display:grid;grid-template-columns:38.2% 61.8%;border-bottom:1px solid #c7c2b7}.axesLead{padding-right:32px}.axesLead>span,.supportMark,.differenceHead>span{font-size:8px;letter-spacing:.15em;color:#777168}.axesLead h2,.supportPanel h2,.differenceHead h2{font-family:Georgia,serif;font-size:29px;font-weight:500;margin:9px 0 12px}.axesLead p{font-size:10px;line-height:1.5;color:#777168}.axesMap{border-left:1px solid #c7c2b7}.axesMap>div{display:grid;grid-template-columns:125px 1fr;padding:18px 22px;border-bottom:1px solid #c7c2b7}.axesMap>div:last-child{border-bottom:0}.axesMap span{font-size:8px;letter-spacing:.13em;font-weight:800}.axesMap strong{font-size:12px;font-weight:500}.axisPrimary{background:#11110f;color:#f5f2e9}.axisPrimary span{color:#d8ff72}.axisSupporting{background:#2a2823;color:#f5f2e9}.axisControl{background:#e1ddd3}
      .supportGrid{display:grid;grid-template-columns:1.618fr 1fr;margin-top:22px;border:1px solid #c7c2b7}.supportPanel{padding:30px;min-height:310px}.supportPanel+ .supportPanel{border-left:1px solid #c7c2b7}.supportPanel p{font-size:13px;line-height:1.65;color:#5c574f;max-width:650px}.astroPanel{background:#24221e;color:#f5f2e9}.astroPanel .supportMark{color:#9d988e}.astroPanel p{color:#b9b4aa}.astroAvailability{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #4b4841;border-bottom:1px solid #4b4841;padding:15px 0;margin:24px 0 13px}.astroAvailability strong{font-family:Georgia,serif;font-weight:500}.astroAvailability span{font-size:8px;letter-spacing:.12em;color:#d8ff72}.astroPanel>small{display:block;color:#aaa59b;line-height:1.5}.astroPanel>em{display:block;font-style:normal;color:#777269;font-size:9px;margin-top:18px}.proofPanel{background:#f9f7f1}.proofLines{margin-top:24px;border-top:1px solid #d3cfc5}.proofLines span{display:block;padding:12px 0;border-bottom:1px solid #d3cfc5;font-size:10px;color:#5d5850}
      .differenceSection{margin-top:22px;background:#11110f;color:#f5f2e9;display:grid;grid-template-columns:38.2% 61.8%;padding:30px}.differenceHead{padding-right:28px}.differenceHead>span{color:#8f8a80}.differenceGrid{display:grid;grid-template-columns:1fr 1.618fr;border-left:1px solid #393730}.notColumn,.yesColumn{padding:5px 22px}.yesColumn{border-left:1px solid #393730}.notColumn>span,.yesColumn>span{font-size:8px;letter-spacing:.14em;color:#817c72}.yesColumn>span{color:#d8ff72}.differenceGrid p{display:flex;gap:11px;align-items:center;padding:11px 0;margin:0;border-bottom:1px solid #2f2d28;font-family:Georgia,serif;font-size:15px}.differenceGrid b{font-family:Inter,sans-serif;font-size:10px;width:20px;height:20px;border:1px solid #5a564e;border-radius:50%;display:grid;place-items:center;color:#827d74}.yesColumn b{background:#d8ff72;border-color:#d8ff72;color:#11110f}
      .cta{margin-top:22px;background:#11110f;color:#f5f2e9;padding:58px 32px;text-align:center}.cta .eyebrow{color:#aaa69d}.cta h2{font-family:Georgia,serif;font-size:clamp(36px,5vw,60px);font-weight:500;margin:0 0 18px}.cta p{max-width:650px;margin:0 auto 26px;color:#c9c5bd;line-height:1.55}.cta button{background:#d8ff72;color:#111;border:0;padding:15px 24px;font-weight:800;letter-spacing:.08em;font-size:11px;cursor:default}.cta small{display:block;color:#77736c;margin-top:22px;letter-spacing:.08em;font-size:9px}

      @media(max-width:900px){
        .cosmographHead{grid-template-columns:1fr;gap:14px}.cosmographBody{grid-template-columns:1fr}.timeField{border-right:0;border-bottom:1px solid #393730}.controlField{min-height:520px}.cosmographLegend{grid-template-columns:1fr}.cosmographLegend span{border-right:0;border-bottom:1px solid #393730}.cosmographLegend span:last-child{border-bottom:0}.supportGrid{grid-template-columns:1fr}.supportPanel+.supportPanel{border-left:0;border-top:1px solid #c7c2b7}.differenceSection{grid-template-columns:1fr;gap:22px}.differenceGrid{border-left:0}.categoryReveal,.axesSection{grid-template-columns:1fr}.categoryReveal h2,.categoryReveal p{grid-column:1}.categoryReveal>span{margin-bottom:18px}.axesLead{padding-right:0}.axesMap{border-left:0;border-top:1px solid #c7c2b7;margin-top:18px}
      }
      @media(max-width:720px){
        main{padding:0 15px 42px}.topbar{height:60px}.preview{display:none}.hero{padding:46px 0 36px}.hero h1{font-size:48px}.lead{font-size:19px}.cosmographHead{padding:24px 20px 20px}.cosmographBody{min-height:0}.timeField{padding:24px 20px}.timeLabels{grid-template-columns:1fr 1fr 1fr}.astroBand{margin-left:0;width:100%;margin-bottom:24px}.timeAxis{display:none}.temporalGrid{grid-template-columns:1fr;gap:0;border-left:1px solid #393730;margin-left:8px}.temporalGrid article{margin-left:16px;border-right:0;border-bottom:1px solid #393730;padding:18px 12px 22px}.temporalGrid article:before{content:"";position:absolute;left:-21px;top:25px;width:9px;height:9px;border-radius:50%;border:1px solid #777269;background:#11110f}.nowNode:before{background:#d8ff72!important;border-color:#d8ff72!important}.futureConditions{grid-template-columns:1fr}.checkpointRail{grid-template-columns:repeat(2,1fr);margin-top:24px;border-left:1px solid #393730}.checkpoint{border-bottom:1px solid #2d2b27}.checkpoint i{left:15px}.controlField{padding:24px 20px}.controlSpine{left:34px}.controlStack{padding-left:28px}.closeoutSeal{margin-left:28px}.categoryReveal{padding:54px 0}.categoryReveal h2{font-size:43px}.axesMap>div{grid-template-columns:1fr;gap:6px;padding:16px}.supportPanel{padding:24px}.differenceSection{padding:24px 20px}.differenceGrid{grid-template-columns:1fr}.yesColumn{border-left:0;border-top:1px solid #393730;margin-top:16px;padding-top:18px}.identityRow>*{font-size:8px}
      }
      @media(max-width:440px){.hero h1{font-size:40px}.cosmographHead h2{font-size:34px}.categoryReveal h2{font-size:37px}.stateTriplet b{font-size:10px}.futureWindowHead{display:block}.futureWindowHead>small{display:block;text-align:left;margin-bottom:12px}.axesMap strong{line-height:1.4}}
    `}</style>
  </>;
}
