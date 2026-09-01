import Head from "next/head";
import type { GetServerSideProps } from "next";
import { loadBtcHomeAcceptedState, type BtcHomeAcceptedState } from "../../lib/btc-home-accepted-state";
import { loadPublicEphemeridesToday } from "../../lib/public-ephemerides-live";

type Locale = "en" | "ru";
type CheckpointRow = {
  id: string;
  day: number;
};
type Props = {
  locale: Locale;
  currentState: BtcHomeAcceptedState;
  generatedAtUtc: string;
  checkpoints: CheckpointRow[];
  astroAvailable: boolean;
  astroObservationTime: string | null;
};

const DAYPOINTS = [0, 7, 14, 21, 28, 30] as const;
const IDS = ["BASELINE", "DAY_7", "DAY_14", "DAY_21", "DAY_28", "DAY_30_CLOSEOUT"] as const;

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const locale: Locale = query.lang === "ru" ? "ru" : "en";
  const currentState = await loadBtcHomeAcceptedState();
  const now = new Date();
  const ephemerides = loadPublicEphemeridesToday(locale, now) as any;
  const checkpoints = DAYPOINTS.map((day, index) => ({ id: IDS[index], day }));

  return {
    props: {
      locale,
      currentState,
      generatedAtUtc: now.toISOString(),
      checkpoints,
      astroAvailable: Boolean(ephemerides?.live),
      astroObservationTime: ephemerides?.observationTime ?? null,
    },
  };
};

export default function PhiBtcTimingWindowsFounding({
  locale,
  currentState,
  generatedAtUtc,
  checkpoints,
  astroAvailable,
  astroObservationTime,
}: Props) {
  const ru = locale === "ru";
  const t = ru ? {
    eyebrow: "BHRIGU · FOUNDING RESEARCH OBJECT",
    title: "Φ BTC Timing Windows · Founding",
    lead: "30-дневный частный Bitcoin research object: фиксируем baseline в момент старта объекта, отслеживаем prospective timing windows и сохраняем ранее принятые claims как историческую память.",
    question: "Какие окна времени, структурные условия и точки инвалидации наиболее важны для Bitcoin в следующие 30 дней?",
    privateLabel: "30 ДНЕЙ · BTC ONLY · 6 CHECKPOINTS",
    cosmographTitle: "The 30-Day Bitcoin Cosmograph",
    cosmographLead: "Один объект связывает persisted BASELINE, текущее accepted BTC field, будущие BTC-derived windows, условия проверки, invalidation, reassessment и Day 30 closeout.",
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    pastLead: "Locked reference",
    nowLead: "Current accepted field",
    futureLead: "Observed window",
    lockedRecord: "Locked baseline",
    baselineFormat: "FORMAT ONLY · BOUND AFTER BASELINE RUN",
    baselineBinding: "В активном research object здесь отображается persisted BASELINE run: accepted_at + sources/evidence. Public offer не подменяет его текущим NOW.",
    acceptedField: "Current accepted BTC field",
    evidenceStatus: "EVIDENCE STATUS",
    prospective: "Prospective window",
    windowFormat: "FORMAT ONLY · BTC RESEARCH OBJECT BINDING",
    windowBinding: "Точная дата появляется только из accepted BTC window в BASELINE или checkpoint run. Astro не создаёт окно.",
    confirm: "CONFIRM",
    confirmText: "Независимая BTC evidence усиливает отслеживаемый сценарий.",
    break: "INVALIDATE",
    breakText: "BTC structure не подтверждает сценарий, evidence расходится или proof/freshness boundary не проходит.",
    unresolved: "UNRESOLVED",
    unresolvedText: "Если ни confirm, ни invalidation не разрешают окно, оно продолжается к следующему reassessment.",
    memory: "Append-only forecast memory",
    proof: "Sources + evidence + boundary",
    astroField: "Independent temporal field",
    astroAvailable: "Canonical Ephemerides · AVAILABLE",
    astroUnavailable: "Canonical Ephemerides · UNAVAILABLE",
    astroBoundary: "Supporting only · No Bitcoin causality · No trading signal",
    checkpoint: "REASSESS",
    serviceStart: "SERVICE START",
    relativeSchedule: "Relative to accepted service start",
    closeout: "What actually happened",
    closeoutShort: "DAY 30 CLOSEOUT",
    categoryKicker: "AFTER THE OBJECT IS UNDERSTOOD",
    categoryTitle: "THIS IS A COSMOGRAPHER RESEARCH OBJECT",
    categoryLead: "Не поток ответов, а временная карта одного исследования: BASELINE сохраняется как историческая reference point, текущая evidence меняется, окна проверяются, а последующие записи добавляют reassessment без ретроактивного переписывания ранних claims.",
    compositionTitle: "Analytical axes",
    compositionPrimary: "PRIMARY · Bitcoin market / technical evidence",
    compositionSupporting: "SUPPORTING · Astro / Ephemerides temporal field",
    compositionControl: "CONTROL · Baseline record / memory / invalidation / proof",
    compositionNote: "PRIMARY / SUPPORTING / CONTROL — роли в исследовании, не фиксированные процентные веса.",
    astroTitle: "Astro / Ephemerides field",
    astroText: "На offer-уровне видны только presence, temporal relation, research role и реальная availability. Exact transit / lunar evidence остаётся в deep research / Ephemerides view.",
    astroPossible: "Possible context · aspect phase · stations / ingresses · lunar context · eclipse context when relevant",
    sourceTitle: "Source & Proof",
    sourceText: "NOW использует accepted BTC market evidence corridor. Temporal field использует canonical public-safe Ephemerides. В активном Timing Windows object каждый run хранит sources, evidence и boundary; integrity chain — отдельный механизм, а не обещание внешней notarization.",
    difference: "Why this is different",
    notItems: ["Generic AI chat", "Trading signal", "Astrology prediction"],
    yesItems: ["Persisted baseline run", "BTC-derived windows", "Explicit invalidation", "Append-only continuity", "Independent temporal field", "Day 30 closeout"],
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake остаётся ручным. На этой Preview-странице нет цены, checkout, кошелька или платёжной активации.",
    preview: "VERCEL PREVIEW · OPERATOR REVIEW",
  } : {
    eyebrow: "BHRIGU · FOUNDING RESEARCH OBJECT",
    title: "Φ BTC Timing Windows · Founding",
    lead: "A 30-day private Bitcoin research object: bind the baseline at object start, track prospective timing windows, and preserve earlier accepted claims as historical memory.",
    question: "What are the most important Bitcoin timing windows, structural conditions, and invalidation points over the next 30 days?",
    privateLabel: "30 DAYS · BTC ONLY · 6 CHECKPOINTS",
    cosmographTitle: "The 30-Day Bitcoin Cosmograph",
    cosmographLead: "One object connects a persisted BASELINE, the current accepted BTC field, future BTC-derived windows, test conditions, invalidation, reassessment, and the Day 30 closeout.",
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    pastLead: "Locked reference",
    nowLead: "Current accepted field",
    futureLead: "Observed window",
    lockedRecord: "Locked baseline",
    baselineFormat: "FORMAT ONLY · BOUND AFTER BASELINE RUN",
    baselineBinding: "In an active research object this position binds the persisted BASELINE run: accepted_at + sources/evidence. The public offer does not substitute mutable NOW data.",
    acceptedField: "Current accepted BTC field",
    evidenceStatus: "EVIDENCE STATUS",
    prospective: "Prospective window",
    windowFormat: "FORMAT ONLY · BTC RESEARCH OBJECT BINDING",
    windowBinding: "An exact date appears only from an accepted BTC window in a BASELINE or checkpoint run. Astro does not create the window.",
    confirm: "CONFIRM",
    confirmText: "Independent BTC evidence strengthens the tracked scenario.",
    break: "INVALIDATE",
    breakText: "BTC structure fails to confirm, evidence diverges, or the proof/freshness boundary fails.",
    unresolved: "UNRESOLVED",
    unresolvedText: "If neither confirmation nor invalidation resolves the window, it continues to the next reassessment.",
    memory: "Append-only forecast memory",
    proof: "Sources + evidence + boundary",
    astroField: "Independent temporal field",
    astroAvailable: "Canonical Ephemerides · AVAILABLE",
    astroUnavailable: "Canonical Ephemerides · UNAVAILABLE",
    astroBoundary: "Supporting only · No Bitcoin causality · No trading signal",
    checkpoint: "REASSESS",
    serviceStart: "SERVICE START",
    relativeSchedule: "Relative to accepted service start",
    closeout: "What actually happened",
    closeoutShort: "DAY 30 CLOSEOUT",
    categoryKicker: "AFTER THE OBJECT IS UNDERSTOOD",
    categoryTitle: "THIS IS A COSMOGRAPHER RESEARCH OBJECT",
    categoryLead: "Not a stream of answers but a time-bound map of one investigation: BASELINE remains the historical reference point, current evidence can change, windows are tested, and later records append reassessment without retroactively rewriting earlier claims.",
    compositionTitle: "Analytical axes",
    compositionPrimary: "PRIMARY · Bitcoin market / technical evidence",
    compositionSupporting: "SUPPORTING · Astro / Ephemerides temporal field",
    compositionControl: "CONTROL · Baseline record / memory / invalidation / proof",
    compositionNote: "PRIMARY / SUPPORTING / CONTROL are research roles, not fixed percentage weights.",
    astroTitle: "Astro / Ephemerides field",
    astroText: "At offer level, only presence, temporal relation, research role, and real availability are shown. Exact transit / lunar evidence remains in the deep research / Ephemerides view.",
    astroPossible: "Possible context · aspect phase · stations / ingresses · lunar context · eclipse context when relevant",
    sourceTitle: "Source & Proof",
    sourceText: "NOW uses the accepted BTC market evidence corridor. The temporal field uses canonical public-safe Ephemerides. In an active Timing Windows object each run stores sources, evidence, and boundary; integrity chaining is a separate mechanism, not a claim of external notarization.",
    difference: "Why this is different",
    notItems: ["Generic AI chat", "Trading signal", "Astrology prediction"],
    yesItems: ["Persisted baseline run", "BTC-derived windows", "Explicit invalidation", "Append-only continuity", "Independent temporal field", "Day 30 closeout"],
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake remains manual. This Preview contains no public price, checkout, wallet, or payment activation.",
    preview: "VERCEL PREVIEW · OPERATOR REVIEW",
  };

  const currentTime = currentState.snapshot_time_utc ?? generatedAtUtc;
  const astroStatus = astroAvailable ? t.astroAvailable : t.astroUnavailable;
  const astroTime = astroObservationTime ? astroObservationTime.replace("T", " ").slice(0, 16) + " UTC" : null;

  return <>
    <Head>
      <title>{t.title}</title>
      <meta name="description" content={t.lead} />
      <meta name="robots" content="noindex,nofollow" />
    </Head>
    <main>
      <nav className="topbar" aria-label="Preview controls">
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
          <span>CONDITIONAL RESEARCH</span>
          <span>SOURCE-LINKED</span>
        </div>
      </header>

      <section className="cosmograph" aria-labelledby="cosmograph-title">
        <div className="cosmographHead">
          <div>
            <span className="objectMark">SIGNATURE OBJECT · 01</span>
            <h2 id="cosmograph-title">{t.cosmographTitle}</h2>
          </div>
          <p>{t.cosmographLead}</p>
        </div>

        <div className="cosmographBody">
          <div className="timeField">
            <div className="timeLabels">
              <span>{t.past}</span><span>{t.now}</span><span>{t.future}</span>
            </div>

            <div className="researchFlow">
              <article className="pastNode" aria-label={`${t.past}: ${t.lockedRecord}`}>
                <span className="nodeRole">{t.pastLead}</span>
                <strong>{t.lockedRecord}</strong>
                <b>{t.baselineFormat}</b>
                <p>{t.baselineBinding}</p>
              </article>

              <div className="activeHorizon">
                <article className="nowNode" aria-label={`${t.now}: ${t.acceptedField}`}>
                  <span className="nodeRole">{t.nowLead}</span>
                  <strong>{t.acceptedField}</strong>
                  <time dateTime={currentTime}>{currentTime.replace("T", " ").slice(0, 16)} UTC</time>
                  <div className="stateTriplet">
                    <span><small>{t.evidenceStatus}</small><b>{currentState.status}</b></span>
                    <span><small>DELTA</small><b>{currentState.delta_direction}</b></span>
                    <span><small>SYNTHESIS</small><b>{currentState.synthesis_state}</b></span>
                  </div>
                  <p className="nowProof">{currentState.evidence_source_count} proof sources · {currentState.freshness}</p>
                </article>

                <div className="futureFlow" aria-label={`${t.future}: ${t.prospective}`}>
                  <article className="windowNode">
                    <div className="futureWindowHead">
                      <span className="nodeRole">{t.futureLead}</span>
                      <small>{t.windowFormat}</small>
                    </div>
                    <strong>{t.prospective}</strong>
                    <b className="windowDate">DATE RANGE · FROM ACCEPTED BTC WINDOW</b>
                    <p>{t.windowBinding}</p>
                  </article>

                  <div className="outcomeZone" aria-label="Window outcome conditions">
                    <article className="confirm"><span>{t.confirm}</span><p>{t.confirmText}</p></article>
                    <article className="invalidate"><span>{t.break}</span><p>{t.breakText}</p></article>
                    <div className="unresolvedPath">
                      <span>{t.unresolved}</span>
                      <p>{t.unresolvedText}</p>
                      <b aria-hidden="true">↓</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="astroBand" aria-label={t.astroField}>
              <span>SUPPORTING · TEMPORAL FIELD</span>
              <strong>{t.astroField}</strong>
              <small>{astroStatus}{astroTime ? ` · ${astroTime}` : ""}</small>
              <em>{t.astroBoundary}</em>
            </div>

            <div className="scheduleLabel"><span>30-DAY CHECKPOINT RHYTHM</span><small>{t.relativeSchedule}</small></div>
            <ol className="checkpointRail" aria-label="30-day reassessment rhythm">
              {checkpoints.map((checkpoint, index) => <li className={index === 0 ? "checkpoint active" : "checkpoint"} key={checkpoint.id}>
                <span>{index === 0 ? "LOCK" : index === checkpoints.length - 1 ? "CLOSE" : t.checkpoint}</span>
                <strong>{checkpoint.id}</strong>
                <small>{checkpoint.day === 0 ? t.serviceStart : `+${checkpoint.day} DAYS`}</small>
              </li>)}
            </ol>
          </div>

          <aside className="controlField" aria-label="Research integrity control field">
            <div className="controlHead"><span>CONTROL · RESEARCH INTEGRITY</span><strong>LOCK → APPEND → CLOSE</strong></div>
            <div className="controlStack">
              <div><span>01</span><strong>BASELINE RECORD</strong><small>Persisted after BASELINE run</small></div>
              <div><span>02</span><strong>FORECAST MEMORY</strong><small>{t.memory}</small></div>
              <div><span>03</span><strong>INVALIDATION</strong><small>Explicit break condition</small></div>
              <div><span>04</span><strong>WHAT CHANGED</strong><small>Checkpoint-to-checkpoint evidence deltas</small></div>
              <div><span>05</span><strong>SOURCE & PROOF</strong><small>{t.proof}</small></div>
            </div>
            <div className="closeoutBlock"><span>{t.closeout}</span><strong>{t.closeoutShort}</strong><small>HELD / FAILED / UNRESOLVED</small></div>
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
            <span>{astroAvailable ? "AVAILABLE" : "UNAVAILABLE"}</span>
          </div>
          {astroTime && <time dateTime={astroObservationTime ?? undefined}>{astroTime}</time>}
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
        <small>BASELINE → BTC-DERIVED WINDOWS → APPEND-ONLY REASSESSMENT → DAY 30 CLOSEOUT</small>
      </section>
    </main>

    <style jsx>{`
      :global(html){background:#efede6;color:#111;scroll-behavior:smooth}
      :global(body){margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#efede6;color:#111}
      :global(*){box-sizing:border-box} a{color:inherit;text-decoration:none}
      main{max-width:1220px;margin:0 auto;padding:0 28px 76px}
      .topbar{height:70px;display:flex;align-items:center;border-bottom:1px solid #b7b2a7;gap:24px;font-size:12px;letter-spacing:.12em}.brand{font-size:15px;font-weight:900}.preview{color:#57534c}.lang{margin-left:auto;display:flex;gap:7px}
      .hero{padding:58px 0 48px;max-width:960px}.eyebrow{font-size:12px;letter-spacing:.18em;font-weight:800;margin:0 0 16px;color:#57534c}.hero h1{font-family:Georgia,serif;font-size:clamp(46px,6.5vw,82px);line-height:.94;letter-spacing:-.045em;margin:0 0 22px;font-weight:500}.lead{font-size:clamp(18px,2vw,27px);line-height:1.4;max-width:860px;margin:0 0 18px}.question{font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.55;max-width:800px;color:#39362f}.identityRow{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}.identityRow>*{border:1px solid #918b80;padding:9px 11px;font-size:12px;letter-spacing:.08em}

      .cosmograph{background:#11110f;color:#f5f2e9;border:1px solid #11110f;margin-bottom:22px;overflow:hidden}.cosmographHead{display:grid;grid-template-columns:1.618fr 1fr;gap:34px;align-items:end;padding:34px;border-bottom:1px solid #45423b}.objectMark{display:block;color:#d8ff72;font-size:12px;letter-spacing:.14em;margin-bottom:12px}.cosmographHead h2{font-family:Georgia,serif;font-size:clamp(34px,4.5vw,57px);line-height:1;letter-spacing:-.035em;font-weight:500;margin:0}.cosmographHead p{margin:0;color:#d0cbc1;line-height:1.65;font-size:14px}
      .cosmographBody{display:grid;grid-template-columns:minmax(0,2.618fr) minmax(250px,1fr)}.timeField{padding:34px;border-right:1px solid #45423b;background:#11110f}.timeLabels{display:grid;grid-template-columns:27.6% 27.6% 44.8%;margin-bottom:21px;color:#aaa59b;font-size:12px;letter-spacing:.16em}.timeLabels span:nth-child(2){color:#d8ff72;text-align:center}.timeLabels span:last-child{text-align:right}
      .researchFlow{display:grid;grid-template-columns:minmax(180px,1fr) minmax(0,2.618fr);border-top:1px solid #555149;border-bottom:1px solid #555149}.pastNode{position:relative;padding:34px 21px;color:#d0cbc1;border-right:1px solid #45423b;min-width:0}.pastNode:after{content:"";position:absolute;right:-18px;top:50%;width:35px;height:1px;background:#8f897f}.activeHorizon{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,1.618fr);min-width:0}.nowNode{position:relative;padding:34px 21px;background:#181813;border-right:1px solid #45423b;box-shadow:inset 0 3px 0 #d8ff72;min-width:0}.nowNode:after{content:"";position:absolute;right:-18px;top:50%;width:35px;height:1px;background:#d8ff72;z-index:2}.nodeRole{display:block;font-size:12px;letter-spacing:.12em;color:#b1aca2;text-transform:uppercase;margin-bottom:21px}.pastNode strong,.nowNode strong,.windowNode strong{display:block;font-family:Georgia,serif;font-size:22px;line-height:1.18;font-weight:500;margin-bottom:13px}.pastNode b,.windowDate{display:block;font-size:12px;line-height:1.5;letter-spacing:.04em;color:#f5f2e9;margin-bottom:13px}.pastNode p,.windowNode p{font-size:14px;line-height:1.62;color:#c8c3b9;margin:0}.nowNode time{display:block;font-size:12px;color:#c8c3b9;line-height:1.5}.stateTriplet{display:grid;gap:13px;margin-top:21px}.stateTriplet span{border-top:1px solid #4b4841;padding-top:12px}.stateTriplet small,.stateTriplet b{display:block}.stateTriplet small{font-size:12px;letter-spacing:.08em;color:#b7b2a8}.stateTriplet b{font-size:14px;margin-top:5px;color:#d8ff72;overflow-wrap:anywhere}.nowProof{font-size:12px;color:#c8c3b9;line-height:1.5;margin:21px 0 0}
      .futureFlow{display:grid;grid-template-rows:minmax(250px,1.618fr) minmax(210px,1fr);min-width:0;background:#151511}.windowNode{padding:34px 26px;min-width:0}.futureWindowHead{display:flex;justify-content:space-between;gap:13px;align-items:start}.futureWindowHead>small{font-size:12px;line-height:1.45;color:#b1aca2;text-align:right;max-width:190px}.outcomeZone{display:grid;grid-template-columns:1fr 1fr;align-content:start;border-top:1px solid #45423b;background:#11110f}.outcomeZone article{padding:21px;border-right:1px solid #45423b}.outcomeZone article:nth-child(2){border-right:0}.outcomeZone article span,.unresolvedPath span{display:block;font-size:12px;letter-spacing:.1em;font-weight:800;margin-bottom:8px}.outcomeZone article p,.unresolvedPath p{font-size:14px;line-height:1.55;color:#d0cbc1;margin:0}.confirm span{color:#d8ff72}.invalidate span{color:#f5f2e9}.unresolvedPath{grid-column:1/-1;position:relative;padding:17px 21px 26px;border-top:1px solid #45423b;text-align:center}.unresolvedPath span{color:#d0cbc1}.unresolvedPath b{display:block;color:#d8ff72;font-size:18px;line-height:1;margin-top:10px}
      .astroBand{margin-top:21px;border-top:1px solid #555149;border-bottom:1px solid #45423b;padding:17px 21px;background:#171612}.astroBand span,.astroBand strong,.astroBand small,.astroBand em{display:block}.astroBand span{font-size:12px;letter-spacing:.1em;color:#b1aca2}.astroBand strong{font-family:Georgia,serif;font-size:18px;font-weight:500;margin:7px 0}.astroBand small{color:#d0cbc1;font-size:12px;line-height:1.5}.astroBand em{font-size:12px;line-height:1.5;color:#b7b2a8;font-style:normal;margin-top:6px}
      .scheduleLabel{display:flex;justify-content:space-between;gap:21px;align-items:baseline;margin-top:21px;color:#d0cbc1}.scheduleLabel span{font-size:12px;letter-spacing:.1em;font-weight:800}.scheduleLabel small{font-size:12px;color:#b7b2a8}.checkpointRail{list-style:none;padding:0;display:grid;grid-template-columns:repeat(6,1fr);margin:13px 0 0;border-top:1px solid #555149}.checkpoint{padding:17px 8px 10px;border-right:1px solid #34322d;min-height:94px}.checkpoint:last-child{border-right:0}.checkpoint span,.checkpoint strong,.checkpoint small{display:block}.checkpoint span{font-size:12px;letter-spacing:.06em;color:#b1aca2}.checkpoint strong{font-size:12px;margin:10px 0 5px;overflow-wrap:anywhere}.checkpoint small{font-size:12px;line-height:1.4;color:#c8c3b9}.checkpoint.active{box-shadow:inset 0 3px 0 #d8ff72}.checkpoint:last-child strong{color:#d8ff72}
      .controlField{padding:34px 24px;background:#1b1a17;color:#e4e0d7}.controlHead{border-bottom:1px solid #45423b;padding-bottom:17px}.controlHead span,.controlHead strong{display:block}.controlHead span{font-size:12px;letter-spacing:.1em;color:#b1aca2}.controlHead strong{font-family:Georgia,serif;font-size:20px;font-weight:500;margin-top:8px}.controlStack{padding-top:8px}.controlStack>div{padding:21px 0;border-bottom:1px solid #45423b}.controlStack span,.controlStack strong,.controlStack small{display:block}.controlStack span{font-size:12px;color:#b1aca2}.controlStack strong{font-size:12px;letter-spacing:.08em;margin:7px 0}.controlStack small{font-size:14px;line-height:1.5;color:#d0cbc1}.closeoutBlock{margin-top:21px;border:1px solid #555149;padding:17px}.closeoutBlock span,.closeoutBlock strong,.closeoutBlock small{display:block}.closeoutBlock span{font-size:12px;color:#b1aca2}.closeoutBlock strong{font-family:Georgia,serif;font-size:18px;font-weight:500;margin:8px 0}.closeoutBlock small{font-size:12px;letter-spacing:.06em;color:#d0cbc1}
      .cosmographLegend{display:grid;grid-template-columns:1.618fr 1fr 1fr;border-top:1px solid #45423b}.cosmographLegend span{padding:15px 18px;border-right:1px solid #45423b;font-size:12px;line-height:1.5;color:#d0cbc1}.cosmographLegend span:last-child{border-right:0}.cosmographLegend b{color:#f5f2e9;margin-right:7px;font-size:12px;letter-spacing:.06em}.cosmographLegend span:first-child b{color:#d8ff72}

      .categoryReveal{padding:76px 0 72px;display:grid;grid-template-columns:38.2% 61.8%;border-bottom:1px solid #b7b2a7}.categoryReveal>span{font-size:12px;letter-spacing:.12em;color:#57534c;padding-top:10px}.categoryReveal h2{grid-column:2;font-family:Georgia,serif;font-size:clamp(38px,5.3vw,70px);line-height:.96;letter-spacing:-.04em;font-weight:500;margin:0 0 24px}.categoryReveal p{grid-column:2;font-size:16px;line-height:1.65;max-width:720px;margin:0;color:#4b4741}
      .axesSection{padding:34px 0 42px;display:grid;grid-template-columns:38.2% 61.8%;border-bottom:1px solid #b7b2a7}.axesLead{padding-right:32px}.axesLead>span,.supportMark,.differenceHead>span{font-size:12px;letter-spacing:.1em;color:#57534c}.axesLead h2,.supportPanel h2,.differenceHead h2{font-family:Georgia,serif;font-size:29px;font-weight:500;margin:9px 0 12px}.axesLead p{font-size:14px;line-height:1.55;color:#57534c}.axesMap{border-left:1px solid #b7b2a7}.axesMap>div{display:grid;grid-template-columns:125px 1fr;padding:18px 22px;border-bottom:1px solid #b7b2a7}.axesMap>div:last-child{border-bottom:0}.axesMap span{font-size:12px;letter-spacing:.08em;font-weight:800}.axesMap strong{font-size:14px;line-height:1.5;font-weight:500}.axisPrimary{background:#11110f;color:#f5f2e9}.axisPrimary span{color:#d8ff72}.axisSupporting{background:#2a2823;color:#f5f2e9}.axisControl{background:#dfdbd1}
      .supportGrid{display:grid;grid-template-columns:1.618fr 1fr;margin-top:22px;border:1px solid #b7b2a7}.supportPanel{padding:30px;min-height:310px}.supportPanel+.supportPanel{border-left:1px solid #b7b2a7}.supportPanel p{font-size:14px;line-height:1.65;color:#4b4741;max-width:650px}.astroPanel{background:#24221e;color:#f5f2e9}.astroPanel .supportMark{color:#c8c3b9}.astroPanel p{color:#d0cbc1}.astroAvailability{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #555149;border-bottom:1px solid #555149;padding:15px 0;margin:24px 0 13px}.astroAvailability strong{font-family:Georgia,serif;font-weight:500}.astroAvailability span{font-size:12px;letter-spacing:.08em;color:#d8ff72}.astroPanel time,.astroPanel>small{display:block;color:#d0cbc1;font-size:12px;line-height:1.55}.astroPanel>em{display:block;font-style:normal;color:#b7b2a8;font-size:12px;line-height:1.5;margin-top:18px}.proofPanel{background:#f9f7f1}.proofLines{margin-top:24px;border-top:1px solid #c7c2b7}.proofLines span{display:block;padding:12px 0;border-bottom:1px solid #c7c2b7;font-size:12px;line-height:1.5;color:#4f4b45}
      .differenceSection{margin-top:22px;background:#11110f;color:#f5f2e9;display:grid;grid-template-columns:38.2% 61.8%;padding:30px}.differenceHead{padding-right:28px}.differenceHead>span{color:#b1aca2}.differenceGrid{display:grid;grid-template-columns:1fr 1.618fr;border-left:1px solid #45423b}.notColumn,.yesColumn{padding:5px 22px}.yesColumn{border-left:1px solid #45423b}.notColumn>span,.yesColumn>span{font-size:12px;letter-spacing:.1em;color:#b1aca2}.yesColumn>span{color:#d8ff72}.differenceGrid p{display:flex;gap:11px;align-items:center;padding:11px 0;margin:0;border-bottom:1px solid #34322d;font-family:Georgia,serif;font-size:15px}.differenceGrid b{font-family:Inter,sans-serif;font-size:12px;width:24px;height:24px;border:1px solid #777269;border-radius:50%;display:grid;place-items:center;color:#d0cbc1}.yesColumn b{background:#d8ff72;border-color:#d8ff72;color:#11110f}
      .cta{margin-top:22px;background:#11110f;color:#f5f2e9;padding:58px 32px;text-align:center}.cta .eyebrow{color:#d0cbc1}.cta h2{font-family:Georgia,serif;font-size:clamp(36px,5vw,60px);font-weight:500;margin:0 0 18px}.cta p{max-width:650px;margin:0 auto 26px;color:#d0cbc1;line-height:1.6;font-size:14px}.cta button{background:#d8ff72;color:#111;border:0;padding:15px 24px;font-weight:800;letter-spacing:.08em;font-size:12px;cursor:default}.cta small{display:block;color:#b7b2a8;margin-top:22px;letter-spacing:.06em;font-size:12px;line-height:1.5}

      @media(max-width:900px){
        .cosmographHead{grid-template-columns:1fr;gap:14px}.cosmographBody{grid-template-columns:1fr}.timeField{border-right:0;border-bottom:1px solid #45423b}.controlField{padding:28px 24px}.cosmographLegend{grid-template-columns:1fr}.cosmographLegend span{border-right:0;border-bottom:1px solid #45423b}.cosmographLegend span:last-child{border-bottom:0}.supportGrid{grid-template-columns:1fr}.supportPanel+.supportPanel{border-left:0;border-top:1px solid #b7b2a7}.differenceSection{grid-template-columns:1fr;gap:22px}.differenceGrid{border-left:0}.categoryReveal,.axesSection{grid-template-columns:1fr}.categoryReveal h2,.categoryReveal p{grid-column:1}.categoryReveal>span{margin-bottom:18px}.axesLead{padding-right:0}.axesMap{border-left:0;border-top:1px solid #b7b2a7;margin-top:18px}
      }
      @media(max-width:720px){
        main{padding:0 15px 42px}.topbar{height:60px}.preview{display:none}.hero{padding:46px 0 36px}.hero h1{font-size:48px}.lead{font-size:19px}.cosmographHead{padding:24px 20px}.timeField{padding:24px 20px}.timeLabels{grid-template-columns:1fr;gap:8px;border-left:1px solid #555149;padding-left:18px}.timeLabels span,.timeLabels span:nth-child(2),.timeLabels span:last-child{text-align:left}.researchFlow{grid-template-columns:1fr;border-left:1px solid #555149;border-top:0;margin-left:8px}.pastNode{border-right:0;border-bottom:1px solid #45423b;margin-left:16px;padding:24px 16px}.pastNode:after{right:auto;left:-21px;top:31px;width:9px;height:9px;border-radius:50%;background:#11110f;border:1px solid #b7b2a8}.activeHorizon{grid-template-columns:1fr;margin-left:16px}.nowNode{border-right:0;border-bottom:1px solid #45423b;padding:24px 16px;box-shadow:inset 3px 0 0 #d8ff72}.nowNode:after{right:auto;left:-21px;top:31px;width:9px;height:9px;border-radius:50%;background:#d8ff72}.futureFlow{grid-template-rows:auto auto}.windowNode{position:relative;padding:24px 16px;border-bottom:1px solid #45423b}.windowNode:before{content:"";position:absolute;left:-21px;top:31px;width:9px;height:9px;border-radius:50%;background:#11110f;border:1px solid #d8ff72}.futureWindowHead{display:block}.futureWindowHead>small{display:block;text-align:left;max-width:none;margin-bottom:13px}.outcomeZone{grid-template-columns:1fr 1fr}.outcomeZone article{padding:17px 13px}.unresolvedPath{padding:17px 13px 24px}.astroBand{margin-top:21px}.scheduleLabel{display:grid;gap:6px}.checkpointRail{grid-template-columns:repeat(2,1fr)}.checkpoint{border-bottom:1px solid #34322d}.controlField{padding:24px 20px}.categoryReveal{padding:54px 0}.categoryReveal h2{font-size:43px}.axesMap>div{grid-template-columns:1fr;gap:6px;padding:16px}.supportPanel{padding:24px}.differenceSection{padding:24px 20px}.differenceGrid{grid-template-columns:1fr}.yesColumn{border-left:0;border-top:1px solid #45423b;margin-top:16px;padding-top:18px}
      }
      @media(max-width:440px){.hero h1{font-size:40px}.cosmographHead h2{font-size:34px}.categoryReveal h2{font-size:37px}.outcomeZone{gap:1px}.outcomeZone article p{font-size:14px}.axesMap strong{line-height:1.4}}
    `}</style>
  </>;
}
