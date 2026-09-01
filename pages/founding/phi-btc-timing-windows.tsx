import Head from "next/head";
import type { GetServerSideProps } from "next";
import { loadBtcHomeAcceptedState, type BtcHomeAcceptedState } from "../../lib/btc-home-accepted-state";
import { loadPublicEphemeridesToday } from "../../lib/public-ephemerides-live";

type Locale = "en" | "ru";
type CheckpointRow = { id: string; day: number };
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
    lead: "30 дней одного Bitcoin-исследования: фиксируем исходную точку, проверяем будущие окна и сохраняем историю гипотез до Day 30.",
    privateLabel: "30 ДНЕЙ · BTC ONLY · 6 CHECKPOINTS",
    cosmographTitle: "The 30-Day Bitcoin Cosmograph",
    cosmographLead: "Одна карта показывает, что было зафиксировано, что говорит evidence сейчас, что мы проверяем впереди и как исходная запись проходит через весь 30-дневный цикл.",
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    pastMeaning: "Что будет зафиксировано в начале",
    pastInternal: "Locked baseline",
    baselineFormat: "UNBOUND · AFTER RESEARCH START",
    baselineBinding: "Baseline появится после старта research object.",
    nowMeaning: "Что evidence говорит сейчас",
    nowInternal: "Current accepted BTC field",
    evidenceStatus: "EVIDENCE STATUS",
    futureMeaning: "Где появятся будущие окна",
    futureInternal: "Prospective window",
    windowFormat: "UNBOUND · NO ACCEPTED BTC WINDOW YET",
    windowBinding: "Prospective windows появятся после BASELINE или accepted checkpoint research.",
    confirm: "Что усилит тезис",
    confirmInternal: "CONFIRM",
    confirmText: "Независимая BTC evidence усиливает отслеживаемый сценарий.",
    invalidate: "Что его сломает",
    invalidateInternal: "INVALIDATE",
    invalidateText: "BTC structure не подтверждает сценарий, evidence расходится или proof/freshness boundary не проходит.",
    unresolved: "Что остаётся открытым",
    unresolvedInternal: "UNRESOLVED",
    unresolvedText: "Если ни confirmation, ни invalidation не разрешают окно, вопрос продолжается к следующему reassessment.",
    nextReassessment: "Следующий reassessment",
    memory: "Append-only forecast memory",
    proof: "Sources + evidence + boundary",
    astroField: "Independent temporal field",
    astroAvailable: "Canonical Ephemerides · AVAILABLE",
    astroUnavailable: "Canonical Ephemerides · UNAVAILABLE",
    astroBoundary: "Supporting only · No Bitcoin causality · No trading signal",
    checkpoint: "REASSESS",
    serviceStart: "SERVICE START",
    relativeSchedule: "Relative to accepted service start",
    closeoutMeaning: "Что произошло на самом деле",
    closeoutShort: "DAY 30 CLOSEOUT",
    categoryKicker: "AFTER THE OBJECT IS UNDERSTOOD",
    categoryTitle: "THIS IS A COSMOGRAPHER RESEARCH OBJECT",
    categoryLead: "Не поток ответов, а одно исследование во времени: baseline становится исторической reference point, NOW обновляется, будущие окна проверяются, а новые checkpoint-записи не переписывают ранние claims.",
    astroTitle: "Astro / Ephemerides field",
    astroText: "Независимый временной контекст вокруг уже отслеживаемого Bitcoin-исследования. Он не создаёт BTC window и не является prediction source.",
    astroPossible: "Possible context · aspect phase · stations / ingresses · lunar context · eclipse context when relevant",
    sourceTitle: "Source & Proof",
    sourceText: "NOW использует accepted BTC market evidence corridor. В активном Timing Windows object каждый run хранит sources, evidence и boundary; integrity chain не выдаётся за внешнюю notarization.",
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake остаётся ручным. На этой странице нет цены, checkout, кошелька или платёжной активации.",
    preview: "FOUNDING · RESEARCH OBJECT",
  } : {
    eyebrow: "BHRIGU · FOUNDING RESEARCH OBJECT",
    title: "Φ BTC Timing Windows · Founding",
    lead: "Thirty days of one Bitcoin investigation: fix the starting reference, test future windows, and preserve the history of the thesis through Day 30.",
    privateLabel: "30 DAYS · BTC ONLY · 6 CHECKPOINTS",
    cosmographTitle: "The 30-Day Bitcoin Cosmograph",
    cosmographLead: "One map shows what was fixed, what the evidence says now, what is being tested ahead, and how the original record persists through the full 30-day cycle.",
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    pastMeaning: "What will be fixed at the start",
    pastInternal: "Locked baseline",
    baselineFormat: "UNBOUND · AFTER RESEARCH START",
    baselineBinding: "Baseline appears after the research object starts.",
    nowMeaning: "What the evidence says now",
    nowInternal: "Current accepted BTC field",
    evidenceStatus: "EVIDENCE STATUS",
    futureMeaning: "Where prospective windows will appear",
    futureInternal: "Prospective window",
    windowFormat: "UNBOUND · NO ACCEPTED BTC WINDOW YET",
    windowBinding: "Prospective windows appear after BASELINE or accepted checkpoint research.",
    confirm: "What would strengthen the thesis",
    confirmInternal: "CONFIRM",
    confirmText: "Independent BTC evidence strengthens the tracked scenario.",
    invalidate: "What would break it",
    invalidateInternal: "INVALIDATE",
    invalidateText: "BTC structure fails to confirm, evidence diverges, or the proof/freshness boundary fails.",
    unresolved: "What remains open",
    unresolvedInternal: "UNRESOLVED",
    unresolvedText: "If neither confirmation nor invalidation resolves the window, the question continues to the next reassessment.",
    nextReassessment: "Next reassessment",
    memory: "Append-only forecast memory",
    proof: "Sources + evidence + boundary",
    astroField: "Independent temporal field",
    astroAvailable: "Canonical Ephemerides · AVAILABLE",
    astroUnavailable: "Canonical Ephemerides · UNAVAILABLE",
    astroBoundary: "Supporting only · No Bitcoin causality · No trading signal",
    checkpoint: "REASSESS",
    serviceStart: "SERVICE START",
    relativeSchedule: "Relative to accepted service start",
    closeoutMeaning: "What actually happened",
    closeoutShort: "DAY 30 CLOSEOUT",
    categoryKicker: "AFTER THE OBJECT IS UNDERSTOOD",
    categoryTitle: "THIS IS A COSMOGRAPHER RESEARCH OBJECT",
    categoryLead: "Not a stream of answers but one investigation through time: BASELINE becomes the historical reference point, NOW can update, future windows are tested, and new checkpoint records do not rewrite earlier claims.",
    astroTitle: "Astro / Ephemerides field",
    astroText: "Independent temporal context around an already-tracked Bitcoin investigation. It does not create the BTC window and is not the prediction source.",
    astroPossible: "Possible context · aspect phase · stations / ingresses · lunar context · eclipse context when relevant",
    sourceTitle: "Source & Proof",
    sourceText: "NOW uses the accepted BTC market evidence corridor. In an active Timing Windows object every run stores sources, evidence, and boundary; integrity chaining is not presented as external notarization.",
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake remains manual. This page contains no public price, checkout, wallet, or payment activation.",
    preview: "FOUNDING · RESEARCH OBJECT",
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
      <nav className="topbar" aria-label="Founding controls">
        <span className="brand">BHRIGU</span>
        <span className="preview">{t.preview}</span>
        <span className="lang"><a href="?lang=en">EN</a><span>/</span><a href="?lang=ru">RU</a></span>
      </nav>

      <header className="hero">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
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
          <div className="primaryField">
            <div className="timeAxisLabels" aria-label="Time axis">
              <span>{t.past}</span><span>{t.now}</span><span>{t.future}</span>
            </div>

            <div className="researchCanvas" data-baseline-state="unbound" data-window-state="unbound">
              <aside className="pastField" aria-label={`${t.past}: ${t.pastMeaning}`}>
                <span className="humanLabel">{t.pastMeaning}</span>
                <strong>{t.pastInternal}</strong>
                <b>{t.baselineFormat}</b>
                <p>{t.baselineBinding}</p>
                <div className="pastToNow" aria-hidden="true"><span></span></div>
              </aside>

              <div className="activeHorizon">
                <article className="nowField" aria-label={`${t.now}: ${t.nowMeaning}`}>
                  <span className="humanLabel">{t.nowMeaning}</span>
                  <div className="nowBoundary">
                    <small>{t.nowInternal}</small>
                    <strong>NOW</strong>
                    <time dateTime={currentTime}>{currentTime.replace("T", " ").slice(0, 16)} UTC</time>
                    <div className="stateTriplet">
                      <span><small>{t.evidenceStatus}</small><b>{currentState.status}</b></span>
                      <span><small>DELTA</small><b>{currentState.delta_direction}</b></span>
                      <span><small>SYNTHESIS</small><b>{currentState.synthesis_state}</b></span>
                    </div>
                    <p>{currentState.evidence_source_count} proof sources · {currentState.freshness}</p>
                  </div>
                  <div className="nowToWindow" aria-hidden="true"><span></span></div>
                </article>

                <div className="futureField" aria-label={`${t.future}: ${t.futureMeaning}`}>
                  <article className="windowField">
                    <span className="humanLabel">{t.futureMeaning}</span>
                    <small>{t.windowFormat}</small>
                    <strong>{t.futureInternal}</strong>
                    <p>{t.windowBinding}</p>
                  </article>

                  <div className="branchConnector" aria-hidden="true"><span></span><i></i><b></b></div>

                  <div className="outcomeField" aria-label="Window outcome conditions">
                    <article className="confirmField">
                      <span className="humanLabel">{t.confirm}</span>
                      <strong>{t.confirmInternal}</strong>
                      <p>{t.confirmText}</p>
                    </article>
                    <article className="invalidateField">
                      <span className="humanLabel">{t.invalidate}</span>
                      <strong>{t.invalidateInternal}</strong>
                      <p>{t.invalidateText}</p>
                    </article>
                  </div>

                  <div className="outcomeMerge" aria-hidden="true"><span></span><i></i><b></b></div>

                  <div className="unresolvedField">
                    <span className="humanLabel">{t.unresolved}</span>
                    <strong>{t.unresolvedInternal}</strong>
                    <p>{t.unresolvedText}</p>
                    <div className="forwardPath" aria-hidden="true"><span></span><b>↓</b></div>
                    <small>{t.nextReassessment}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="astroBand" aria-label={t.astroField}>
              <span>SUPPORTING TEMPORAL FIELD</span>
              <strong>{t.astroField}</strong>
              <small>{astroStatus}{astroTime ? ` · ${astroTime}` : ""}</small>
              <em>{t.astroBoundary}</em>
            </div>

            <div className="continuityHead">
              <div><span>TIME CONTINUITY</span><strong>BASELINE → D7 → D14 → D21 → D28 → D30</strong></div>
              <small>{t.relativeSchedule}</small>
            </div>
            <ol className="checkpointRail" aria-label="30-day reassessment rhythm">
              {checkpoints.map((checkpoint, index) => <li className="checkpoint" key={checkpoint.id}>
                <span>{index === 0 ? "LOCK" : index === checkpoints.length - 1 ? "CLOSE" : t.checkpoint}</span>
                <strong>{checkpoint.id}</strong>
                <small>{checkpoint.day === 0 ? t.serviceStart : `+${checkpoint.day} DAYS`}</small>
              </li>)}
            </ol>
          </div>

          <aside className="controlField" aria-label="Research integrity control field">
            <div className="controlHead">
              <span>CONTROL / INTEGRITY</span>
              <strong>LOCK → APPEND → CLOSE</strong>
            </div>
            <div className="controlStack">
              <div><span>01</span><strong>BASELINE RECORD</strong><small>Persisted after BASELINE run</small></div>
              <div><span>02</span><strong>FORECAST MEMORY</strong><small>{t.memory}</small></div>
              <div><span>03</span><strong>INVALIDATION</strong><small>Explicit break condition</small></div>
              <div><span>04</span><strong>WHAT CHANGED</strong><small>Checkpoint-to-checkpoint evidence deltas</small></div>
              <div><span>05</span><strong>SOURCE & PROOF</strong><small>{t.proof}</small></div>
            </div>
            <div className="closeoutBlock">
              <span>{t.closeoutMeaning}</span>
              <strong>{t.closeoutShort}</strong>
              <small>HELD / FAILED / UNRESOLVED</small>
            </div>
          </aside>
        </div>

        <div className="fieldLegend">
          <span><b>PRIMARY</b> Bitcoin market / technical evidence</span>
          <span><b>SUPPORTING</b> Astro / Ephemerides temporal context</span>
          <span><b>CONTROL</b> Memory · invalidation · proof</span>
        </div>
      </section>

      <section className="categoryReveal">
        <span>{t.categoryKicker}</span>
        <h2>{t.categoryTitle}</h2>
        <p>{t.categoryLead}</p>
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

      <section id="request" className="cta">
        <p className="eyebrow">FOUNDING · PRIVATE RESEARCH</p>
        <h2>{t.request}</h2>
        <p>{t.requestText}</p>
        <form action="/founding/phi-btc-timing-windows/request" method="get">
          <input type="hidden" name="lang" value={locale} />
          <button type="submit" aria-label={t.request}>{t.request}</button>
        </form>
        <small>BASELINE → BTC-DERIVED WINDOWS → APPEND-ONLY REASSESSMENT → DAY 30 CLOSEOUT</small>
      </section>
    </main>

    <style jsx>{`
      :global(html){background:#efede6;color:#111;scroll-behavior:smooth}
      :global(body){margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#efede6;color:#111}
      :global(*){box-sizing:border-box}a{color:inherit;text-decoration:none}
      main{max-width:1240px;margin:0 auto;padding:0 28px 76px}
      .topbar{height:68px;display:flex;align-items:center;border-bottom:1px solid #b7b2a7;gap:24px;font-size:12px;letter-spacing:.12em}.brand{font-size:15px;font-weight:900}.preview{color:#57534c}.lang{margin-left:auto;display:flex;gap:7px}
      .hero{padding:55px 0 34px;max-width:920px}.eyebrow{font-size:12px;letter-spacing:.18em;font-weight:800;margin:0 0 15px;color:#57534c}.hero h1{font-family:Georgia,serif;font-size:clamp(44px,6vw,76px);line-height:.96;letter-spacing:-.045em;margin:0 0 20px;font-weight:500}.lead{font-size:clamp(18px,2vw,25px);line-height:1.42;max-width:820px;margin:0;color:#39362f}

      .cosmograph{background:#10110f;color:#f5f2e9;border:1px solid #10110f;overflow:hidden}.cosmographHead{display:grid;grid-template-columns:1.618fr 1fr;gap:34px;align-items:end;padding:34px;border-bottom:1px solid #46433c}.objectMark{display:block;color:#d8ff72;font-size:12px;letter-spacing:.14em;margin-bottom:12px}.cosmographHead h2{font-family:Georgia,serif;font-size:clamp(36px,4.8vw,59px);line-height:.98;letter-spacing:-.035em;font-weight:500;margin:0}.cosmographHead p{margin:0;color:#d0cbc1;line-height:1.65;font-size:14px}
      .cosmographBody{display:grid;grid-template-columns:minmax(0,2.618fr) minmax(240px,1fr)}.primaryField{padding:34px;border-right:1px solid #46433c}.timeAxisLabels{display:grid;grid-template-columns:19.1% 50% 30.9%;font-size:12px;letter-spacing:.16em;color:#aaa59b;margin-bottom:13px}.timeAxisLabels span:nth-child(2){text-align:center;color:#d8ff72}.timeAxisLabels span:last-child{text-align:right}
      .researchCanvas{display:grid;grid-template-columns:minmax(165px,1fr) minmax(0,2.618fr);border-top:1px solid #555149;border-bottom:1px solid #555149;min-height:640px}.pastField{position:relative;padding:55px 21px;color:#d0cbc1;border-right:1px solid #46433c;display:flex;flex-direction:column;justify-content:center;min-width:0}.humanLabel{display:block;font-family:Georgia,serif;font-size:18px;line-height:1.3;color:#f5f2e9;margin-bottom:13px}.pastField>strong,.windowField>strong{font-size:12px;letter-spacing:.1em;margin-bottom:8px}.pastField>b,.windowField>b{font-size:12px;line-height:1.45;color:#d0cbc1;margin-bottom:13px}.pastField>p,.windowField>p{font-size:14px;line-height:1.62;color:#c8c3b9;margin:0}.pastToNow{position:absolute;right:-35px;top:50%;width:70px;height:1px;background:#827d74}.pastToNow:after{content:"";position:absolute;right:-1px;top:-4px;width:9px;height:9px;border:1px solid #aaa59b;border-radius:50%;background:#10110f}.pastToNow span{position:absolute;left:4px;top:-17px;font-size:0}
      .activeHorizon{display:grid;grid-template-rows:minmax(245px,1fr) minmax(390px,1.618fr);min-width:0}.nowField{position:relative;display:grid;place-items:center;padding:34px 34px 21px;border-bottom:1px solid #46433c;text-align:center;background:#12130f}.nowField>.humanLabel{margin-bottom:21px;color:#e9e4da}.nowBoundary{width:min(420px,82%);min-height:190px;border:1px solid #777269;border-radius:50%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:30px 45px;box-shadow:0 0 0 13px rgba(216,255,114,.035),inset 0 0 0 1px rgba(216,255,114,.1)}.nowBoundary>small{font-size:12px;line-height:1.4;color:#b7b2a8;letter-spacing:.08em}.nowBoundary>strong{font-family:Georgia,serif;font-size:38px;font-weight:500;color:#d8ff72;margin:5px 0}.nowBoundary>time{font-size:12px;color:#d0cbc1}.stateTriplet{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;width:100%;margin-top:17px}.stateTriplet span{border-top:1px solid #555149;padding-top:9px}.stateTriplet small,.stateTriplet b{display:block}.stateTriplet small{font-size:12px;line-height:1.35;color:#b7b2a8}.stateTriplet b{font-size:14px;margin-top:4px;color:#f5f2e9;overflow-wrap:anywhere}.nowBoundary>p{font-size:12px;color:#c8c3b9;margin:13px 0 0}.nowToWindow{position:absolute;bottom:-26px;left:50%;height:52px;width:1px;background:#d8ff72;z-index:2}.nowToWindow:after{content:"";position:absolute;bottom:-1px;left:-4px;width:9px;height:9px;border-radius:50%;background:#d8ff72}.nowToWindow span{display:none}
      .futureField{position:relative;padding:55px 34px 34px;display:grid;grid-template-rows:minmax(190px,1.618fr) 34px minmax(132px,1fr) 34px auto;background:#151612;min-width:0}.windowField{width:min(560px,82%);justify-self:center;border:1px solid #555149;padding:26px 30px;text-align:center;background:#181914}.windowField>.humanLabel{font-size:22px}.windowField>small{display:block;font-size:12px;line-height:1.45;color:#b1aca2;margin-bottom:8px;letter-spacing:.06em}.windowField>strong{display:block;color:#d8ff72}.branchConnector,.outcomeMerge{position:relative;width:72%;justify-self:center;height:34px}.branchConnector:before{content:"";position:absolute;top:0;left:50%;height:17px;width:1px;background:#777269}.branchConnector>span{position:absolute;left:25%;right:25%;top:17px;height:1px;background:#777269}.branchConnector>i,.branchConnector>b{position:absolute;top:17px;width:1px;height:17px;background:#777269}.branchConnector>i{left:25%}.branchConnector>b{right:25%}.outcomeField{display:grid;grid-template-columns:1fr 1fr;gap:13px;width:min(680px,96%);justify-self:center}.outcomeField article{border:1px solid #4d4a43;padding:21px;min-width:0}.outcomeField .humanLabel{font-size:17px;margin-bottom:8px}.outcomeField strong{display:block;font-size:12px;letter-spacing:.1em;margin-bottom:8px}.outcomeField p{font-size:14px;line-height:1.55;color:#d0cbc1;margin:0}.confirmField{box-shadow:inset 0 2px 0 #d8ff72}.confirmField strong{color:#d8ff72}.invalidateField strong{color:#f5f2e9}.outcomeMerge:before{content:"";position:absolute;bottom:0;left:50%;height:17px;width:1px;background:#777269}.outcomeMerge>span{position:absolute;left:25%;right:25%;top:0;height:1px;background:#777269}.outcomeMerge>i,.outcomeMerge>b{position:absolute;top:0;width:1px;height:17px;background:#777269}.outcomeMerge>i{left:25%}.outcomeMerge>b{right:25%}.unresolvedField{width:min(500px,74%);justify-self:center;text-align:center;padding:17px 21px 13px;border-top:1px solid #555149}.unresolvedField .humanLabel{font-size:17px;margin-bottom:6px}.unresolvedField>strong{display:block;font-size:12px;letter-spacing:.1em;color:#d0cbc1}.unresolvedField>p{font-size:14px;line-height:1.55;color:#c8c3b9;margin:8px 0}.forwardPath{height:34px;color:#d8ff72}.forwardPath span{display:block;width:1px;height:21px;background:#d8ff72;margin:0 auto}.forwardPath b{display:block;font-size:15px;line-height:10px}.unresolvedField>small{font-size:12px;color:#d8ff72;letter-spacing:.06em}
      .researchCanvas[data-baseline-state="unbound"]{grid-template-columns:minmax(150px,.618fr) minmax(0,2.618fr);min-height:0;padding:34px 0}.researchCanvas[data-baseline-state="unbound"] .pastField{align-self:center;margin:0;padding:21px;border:1px solid #46433c;justify-content:flex-start}.researchCanvas[data-window-state="unbound"] .activeHorizon{grid-template-rows:minmax(330px,1fr) auto}.researchCanvas[data-window-state="unbound"] .nowField{min-height:330px}.researchCanvas[data-window-state="unbound"] .futureField{display:block;padding:34px;background:#151612;border-top:1px solid #46433c}.researchCanvas[data-window-state="unbound"] .windowField{width:min(560px,88%);padding:21px 26px}.researchCanvas[data-window-state="unbound"] .branchConnector,.researchCanvas[data-window-state="unbound"] .outcomeField,.researchCanvas[data-window-state="unbound"] .outcomeMerge,.researchCanvas[data-window-state="unbound"] .unresolvedField{display:none}
      .astroBand{display:grid;grid-template-columns:1fr 1.618fr;gap:8px 21px;margin-top:21px;padding:13px 0;border-top:1px solid #555149;border-bottom:1px solid #46433c}.astroBand span{font-size:12px;letter-spacing:.08em;color:#b1aca2}.astroBand strong{font-family:Georgia,serif;font-size:16px;font-weight:500}.astroBand small{grid-column:2;font-size:12px;color:#d0cbc1;line-height:1.45}.astroBand em{grid-column:2;font-size:12px;color:#b7b2a8;font-style:normal;line-height:1.45}.continuityHead{display:flex;justify-content:space-between;gap:21px;align-items:end;margin-top:21px}.continuityHead span,.continuityHead strong{display:block}.continuityHead span{font-size:12px;letter-spacing:.08em;color:#b1aca2}.continuityHead strong{font-size:12px;letter-spacing:.05em;margin-top:6px}.continuityHead small{font-size:12px;color:#b7b2a8}.checkpointRail{list-style:none;padding:0;display:grid;grid-template-columns:repeat(6,1fr);margin:13px 0 0;border-top:1px solid #555149}.checkpoint{position:relative;padding:21px 8px 10px;border-right:1px solid #34322d;min-height:94px}.checkpoint:before{content:"";position:absolute;top:-5px;left:50%;width:9px;height:9px;border-radius:50%;border:1px solid #aaa59b;background:#10110f}.checkpoint:first-child:before,.checkpoint:last-child:before{background:#d8ff72;border-color:#d8ff72}.checkpoint:last-child{border-right:0}.checkpoint span,.checkpoint strong,.checkpoint small{display:block}.checkpoint span{font-size:12px;letter-spacing:.06em;color:#b1aca2}.checkpoint strong{font-size:12px;margin:10px 0 5px;overflow-wrap:anywhere}.checkpoint small{font-size:12px;line-height:1.4;color:#c8c3b9}.checkpoint:last-child strong{color:#d8ff72}
      .controlField{padding:34px 24px;background:#181916;color:#e4e0d7}.controlHead{border-bottom:1px solid #46433c;padding-bottom:17px}.controlHead span,.controlHead strong{display:block}.controlHead span{font-size:12px;letter-spacing:.09em;color:#b1aca2}.controlHead strong{font-family:Georgia,serif;font-size:18px;font-weight:500;margin-top:8px}.controlStack{padding-top:8px}.controlStack>div{padding:21px 0;border-bottom:1px solid #3f3d37}.controlStack span,.controlStack strong,.controlStack small{display:block}.controlStack span{font-size:12px;color:#b1aca2}.controlStack strong{font-size:12px;letter-spacing:.07em;margin:6px 0}.controlStack small{font-size:14px;line-height:1.5;color:#d0cbc1}.closeoutBlock{margin-top:34px;border-top:1px solid #555149;padding-top:21px}.closeoutBlock span,.closeoutBlock strong,.closeoutBlock small{display:block}.closeoutBlock span{font-family:Georgia,serif;font-size:16px;color:#f5f2e9}.closeoutBlock strong{font-size:12px;letter-spacing:.08em;margin:8px 0;color:#d8ff72}.closeoutBlock small{font-size:12px;color:#d0cbc1}
      .fieldLegend{display:grid;grid-template-columns:1.618fr 1fr 1fr;border-top:1px solid #46433c}.fieldLegend span{padding:15px 18px;border-right:1px solid #46433c;font-size:12px;line-height:1.5;color:#d0cbc1}.fieldLegend span:last-child{border-right:0}.fieldLegend b{color:#f5f2e9;margin-right:7px;font-size:12px;letter-spacing:.06em}.fieldLegend span:first-child b{color:#d8ff72}

      .categoryReveal{padding:76px 0 72px;display:grid;grid-template-columns:38.2% 61.8%;border-bottom:1px solid #b7b2a7}.categoryReveal>span{font-size:12px;letter-spacing:.12em;color:#57534c;padding-top:10px}.categoryReveal h2{grid-column:2;font-family:Georgia,serif;font-size:clamp(38px,5.3vw,70px);line-height:.96;letter-spacing:-.04em;font-weight:500;margin:0 0 24px}.categoryReveal p{grid-column:2;font-size:16px;line-height:1.65;max-width:720px;margin:0;color:#4b4741}
      .supportGrid{display:grid;grid-template-columns:1.618fr 1fr;margin-top:22px;border:1px solid #b7b2a7}.supportPanel{padding:30px;min-height:280px}.supportPanel+.supportPanel{border-left:1px solid #b7b2a7}.supportMark{font-size:12px;letter-spacing:.1em}.supportPanel h2{font-family:Georgia,serif;font-size:29px;font-weight:500;margin:9px 0 12px}.supportPanel p{font-size:14px;line-height:1.65;max-width:650px}.astroPanel{background:#24221e;color:#f5f2e9}.astroPanel .supportMark{color:#c8c3b9}.astroPanel p{color:#d0cbc1}.astroAvailability{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #555149;border-bottom:1px solid #555149;padding:15px 0;margin:24px 0 13px}.astroAvailability strong{font-family:Georgia,serif;font-weight:500}.astroAvailability span{font-size:12px;letter-spacing:.08em;color:#d8ff72}.astroPanel time,.astroPanel>small{display:block;color:#d0cbc1;font-size:12px;line-height:1.55}.astroPanel>em{display:block;font-style:normal;color:#b7b2a8;font-size:12px;line-height:1.5;margin-top:18px}.proofPanel{background:#f9f7f1}.proofPanel .supportMark{color:#57534c}.proofPanel p{color:#4b4741}.proofLines{margin-top:24px;border-top:1px solid #c7c2b7}.proofLines span{display:block;padding:12px 0;border-bottom:1px solid #c7c2b7;font-size:12px;line-height:1.5;color:#4f4b45}
      .cta{margin-top:22px;background:#10110f;color:#f5f2e9;padding:55px 32px;text-align:center}.cta .eyebrow{color:#d0cbc1}.cta h2{font-family:Georgia,serif;font-size:clamp(36px,5vw,60px);font-weight:500;margin:0 0 18px}.cta p{max-width:650px;margin:0 auto 26px;color:#d0cbc1;line-height:1.6;font-size:14px}.cta form{margin:0}.cta button{background:#d8ff72;color:#111;border:0;padding:15px 24px;font-weight:800;letter-spacing:.08em;font-size:12px;cursor:pointer}.cta small{display:block;color:#b7b2a8;margin-top:22px;letter-spacing:.06em;font-size:12px;line-height:1.5}

      @media(max-width:960px){
        .cosmographHead{grid-template-columns:1fr;gap:13px}.cosmographBody{grid-template-columns:1fr}.primaryField{border-right:0;border-bottom:1px solid #46433c}.controlField{padding:28px 24px}.fieldLegend{grid-template-columns:1fr}.fieldLegend span{border-right:0;border-bottom:1px solid #46433c}.fieldLegend span:last-child{border-bottom:0}.supportGrid{grid-template-columns:1fr}.supportPanel+.supportPanel{border-left:0;border-top:1px solid #b7b2a7}.categoryReveal{grid-template-columns:1fr}.categoryReveal h2,.categoryReveal p{grid-column:1}.categoryReveal>span{margin-bottom:18px}
      }
      @media(max-width:720px){
        main{padding:0 15px 42px}.topbar{height:60px}.preview{display:none}.hero{padding:42px 0 28px}.hero h1{font-size:45px}.lead{font-size:19px}.cosmographHead{padding:24px 20px}.primaryField{padding:24px 20px}.timeAxisLabels{grid-template-columns:1fr;gap:8px;border-left:1px solid #555149;padding-left:18px}.timeAxisLabels span,.timeAxisLabels span:nth-child(2),.timeAxisLabels span:last-child{text-align:left}.researchCanvas,.researchCanvas[data-baseline-state="unbound"]{grid-template-columns:1fr;border-top:0;border-left:1px solid #555149;min-height:0;margin-left:8px;padding:0}.pastField,.researchCanvas[data-baseline-state="unbound"] .pastField{border-right:0;border-bottom:1px solid #46433c;margin-left:16px;padding:21px 16px;align-self:auto}.pastToNow{right:auto;left:-21px;top:27px;width:9px;height:9px;border:1px solid #aaa59b;border-radius:50%;background:#10110f}.pastToNow:after{display:none}.activeHorizon,.researchCanvas[data-window-state="unbound"] .activeHorizon{grid-template-rows:auto auto;margin-left:16px}.nowField,.researchCanvas[data-window-state="unbound"] .nowField{padding:34px 12px 42px;place-items:stretch;text-align:left;min-height:0}.nowField>.humanLabel{margin-left:4px}.nowBoundary{width:100%;min-height:0;border-radius:22px;align-items:flex-start;padding:24px 21px;box-shadow:inset 3px 0 0 #d8ff72}.nowBoundary>strong{font-size:34px}.stateTriplet{grid-template-columns:1fr}.nowToWindow{left:21px;bottom:-26px;height:52px}.futureField,.researchCanvas[data-window-state="unbound"] .futureField{display:block;padding:34px 12px 24px}.windowField,.researchCanvas[data-window-state="unbound"] .windowField{width:100%;justify-self:stretch;text-align:left;padding:21px}.branchConnector,.outcomeMerge{width:82%;justify-self:start;margin-left:9%;}.outcomeField{width:100%;grid-template-columns:1fr;gap:13px}.branchConnector{display:none}.outcomeMerge{display:none}.confirmField,.invalidateField{position:relative;margin-left:18px}.confirmField:before,.invalidateField:before{content:"";position:absolute;left:-19px;top:0;bottom:-14px;width:1px;background:#555149}.confirmField:after,.invalidateField:after{content:"";position:absolute;left:-22px;top:25px;width:7px;height:7px;border:1px solid #aaa59b;border-radius:50%;background:#151612}.unresolvedField{width:auto;justify-self:stretch;margin-left:18px;text-align:left;border-top:1px solid #555149;padding:21px 0 13px}.forwardPath span{margin-left:21px}.forwardPath b{margin-left:17px}.unresolvedField>small{display:block;margin-left:0}.astroBand{grid-template-columns:1fr;gap:6px;padding:13px 0}.astroBand small,.astroBand em{grid-column:1}.continuityHead{display:block}.continuityHead small{display:block;margin-top:8px}.checkpointRail{grid-template-columns:1fr;border-left:1px solid #555149;margin-left:8px;border-top:0}.checkpoint{border-right:0;border-bottom:1px solid #34322d;padding:17px 13px 17px 28px;min-height:0}.checkpoint:before{top:22px;left:-5px}.checkpoint:last-child{border-bottom:0}.controlField{padding:28px 20px}.controlStack>div{padding:17px 0}.categoryReveal{padding:54px 0}.categoryReveal h2{font-size:42px}.supportPanel{padding:24px}.cta{padding:48px 20px}
      }
      @media(max-width:440px){.hero h1{font-size:39px}.cosmographHead h2{font-size:34px}.categoryReveal h2{font-size:36px}.windowField>.humanLabel{font-size:20px}}
    `}</style>
  </>;
}
