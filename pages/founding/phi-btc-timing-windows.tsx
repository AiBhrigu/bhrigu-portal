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
    lead: "30-дневный частный Bitcoin research object: зафиксированный baseline, выбранные prospective timing windows, явные условия и invalidation, append-only reassessment и шесть сервисных checkpoints.",
    question: "Какие окна времени, структурные условия и точки инвалидации наиболее важны для Bitcoin в следующие 30 дней?",
    privateLabel: "30 ДНЕЙ · BTC ONLY · 6 CHECKPOINTS",
    baseline: "Locked baseline",
    baselineNote: "Стартовое состояние фиксируется один раз. Следующие записи добавляются, но исходная точка и ранее принятые claims не переписываются.",
    status: "State",
    timestamp: "Accepted timestamp",
    evidence: "Proof sources",
    change: "Current delta",
    synthesis: "Synthesis",
    windows: "Prospective timing windows",
    windowsNote: "TIMING WINDOWS = что отслеживается. Реальный BASELINE run фиксирует 2–4 prospective windows; checkpoints затем возвращаются к ним и проверяют, что подтвердилось, ослабло или осталось unresolved. Карточка ниже — демонстрация структуры, а не новый accepted forecast.",
    astro: "Independent Astro / Ephemerides context",
    astroNote: "Astro / Ephemerides — независимый supporting temporal context внутри sample window. Он не определяет BTC outcome и не превращается в причинный сигнал.",
    changed: "What Changed · append-only memory",
    changedLead: "ENTRY 00 · BASELINE LOCKED",
    changedText: "DAY_7 → DAY_30 добавляют reassessment уже зафиксированных timing windows, новые evidence deltas и причины изменения чтения. Сам checkpoint schedule не создаёт timing windows.",
    rhythm: "30-day checkpoint rhythm",
    rhythmNote: "CHECKPOINTS = когда research object переоценивается. Это service delivery cadence, а не список timing windows.",
    proof: "Source & Proof",
    proofText: "BTC state использует существующий accepted BHRIGU market evidence corridor. Astro field использует canonical public-safe daily ephemerides export. Timing-window semantics следуют существующему Φ BTC Timing Windows runtime contract; каждый вывод ограничен freshness, provenance и explicit uncertainty.",
    sample: "Sample research object · value preview",
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake остаётся ручным. На этой preview-странице нет цены, checkout, кошелька или платёжной активации.",
    preview: "VERCEL PREVIEW · OPERATOR REVIEW",
    closeout: "DAY 30 CLOSEOUT",
  } : {
    eyebrow: "BHRIGU · FOUNDING RESEARCH OBJECT",
    title: "Φ BTC Timing Windows · Founding",
    lead: "A 30-day private Bitcoin research object: locked baseline, selected prospective timing windows, explicit conditions and invalidation, append-only reassessment, and six service checkpoints.",
    question: "What are the most important Bitcoin timing windows, structural conditions, and invalidation points over the next 30 days?",
    privateLabel: "30 DAYS · BTC ONLY · 6 CHECKPOINTS",
    baseline: "Locked baseline",
    baselineNote: "The starting state is locked once. Later entries are appended; the original reference point and earlier accepted claims are never rewritten.",
    status: "State",
    timestamp: "Accepted timestamp",
    evidence: "Proof sources",
    change: "Current delta",
    synthesis: "Synthesis",
    windows: "Prospective timing windows",
    windowsNote: "TIMING WINDOWS = what is being tracked. A real BASELINE run locks 2–4 prospective windows; checkpoints return to those windows and test what strengthened, weakened, failed, or remains unresolved. The card below demonstrates the structure and is not a new accepted forecast.",
    astro: "Independent Astro / Ephemerides context",
    astroNote: "Astro / Ephemerides is independent supporting temporal context inside the sample window. It does not determine a BTC outcome and is not a causal signal.",
    changed: "What Changed · append-only memory",
    changedLead: "ENTRY 00 · BASELINE LOCKED",
    changedText: "DAY_7 → DAY_30 append reassessment of the already locked timing windows, new evidence deltas, and why the read changed. The checkpoint schedule itself does not create timing windows.",
    rhythm: "30-day checkpoint rhythm",
    rhythmNote: "CHECKPOINTS = when the research object is reassessed. This is service delivery cadence, not a list of timing windows.",
    proof: "Source & Proof",
    proofText: "BTC state uses the existing accepted BHRIGU market evidence corridor. Astro field uses the canonical public-safe daily ephemerides export. Timing-window semantics follow the existing Φ BTC Timing Windows runtime contract; every conclusion is bounded by freshness, provenance, and explicit uncertainty.",
    sample: "Sample research object · value preview",
    request: "REQUEST A FOUNDING SLOT",
    requestText: "Founding intake remains manual. This preview contains no public price, checkout, wallet, or payment activation.",
    preview: "VERCEL PREVIEW · OPERATOR REVIEW",
    closeout: "DAY 30 CLOSEOUT",
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

      <section className="baseline card">
        <div className="sectionHead"><p>01</p><h2>{t.baseline}</h2></div>
        <p className="muted">{t.baselineNote}</p>
        <div className="metrics">
          <div><span>{t.status}</span><strong>{baseline.status}</strong></div>
          <div><span>{t.timestamp}</span><strong>{baselineTime.replace("T", " ").slice(0, 16)} UTC</strong></div>
          <div><span>{t.evidence}</span><strong>{baseline.evidence_source_count}</strong></div>
          <div><span>{t.change}</span><strong>{baseline.delta_direction}</strong></div>
          <div><span>{t.synthesis}</span><strong>{baseline.synthesis_state}</strong></div>
          <div><span>Freshness</span><strong>{baseline.freshness}</strong></div>
        </div>
      </section>

      <section className="card">
        <div className="sectionHead"><p>02</p><h2>{t.windows}</h2></div>
        <p className="muted">{t.windowsNote}</p>
        <article className="window sampleWindow">
          <div className="windowTop"><span>DEMONSTRATION SAMPLE · NOT ACCEPTED FORECAST</span><time>{sampleWindow.dateRange}</time></div>
          <h3>{ru ? "Structural confirmation window" : "Structural confirmation window"}</h3>
          <div className="sampleGrid">
            <p><b>{ru ? "BTC-структура" : "BTC structure"}</b>{sampleWindow.btcStructure}</p>
            <p><b>{ru ? "Условие" : "Condition"}</b>{sampleWindow.condition}</p>
            <p><b>{ru ? "Инвалидация" : "Invalidation"}</b>{sampleWindow.invalidation}</p>
            <p><b>Astro context</b>{sampleWindow.astroContext}<small>{sampleWindow.lunarContext}</small></p>
            <p className="proofBoundary"><b>{ru ? "Source / proof boundary" : "Source / proof boundary"}</b>{sampleWindow.proofBoundary}</p>
          </div>
        </article>
      </section>

      <section className="split">
        <article className="card dark">
          <div className="sectionHead"><p>03</p><h2>{t.astro}</h2></div>
          <p>{t.astroNote}</p>
          <div className="astroList">
            <div><span>{sampleWindow.dateRange}</span><strong>{sampleWindow.astroContext}</strong><small>{sampleWindow.lunarContext}</small></div>
            <div><span>BOUNDARY</span><strong>{ru ? "Supporting temporal context only" : "Supporting temporal context only"}</strong><small>{ru ? "Не причинность Bitcoin · не торговый сигнал" : "No Bitcoin causality · no trading signal"}</small></div>
          </div>
        </article>
        <article className="card">
          <div className="sectionHead"><p>04</p><h2>{t.changed}</h2></div>
          <p className="memoryTag">{t.changedLead}</p>
          <p>{t.changedText}</p>
          <div className="memoryLine"><span>{baselineTime.slice(0,10)}</span><strong>{baseline.delta_direction} · {baseline.synthesis_state}</strong></div>
        </article>
      </section>

      <section className="card">
        <div className="sectionHead"><p>05</p><h2>{t.rhythm}</h2></div>
        <p className="muted">{t.rhythmNote}</p>
        <div className="rhythm">{checkpoints.map((checkpoint, i) => <div key={checkpoint.id} className={i === 0 ? "active" : ""}><span>{String(i + 1).padStart(2,"0")}</span><strong>{checkpoint.id}</strong><small>{checkpoint.date}</small></div>)}</div>
      </section>

      <section className="split">
        <article className="card">
          <div className="sectionHead"><p>06</p><h2>{t.proof}</h2></div>
          <p>{t.proofText}</p>
          <ul className="proofList"><li>BTC accepted Snapshot / change memory</li><li>Canonical public-safe daily ephemerides</li><li>Existing Φ BTC Timing Windows baseline/checkpoint runtime semantics</li><li>Timing windows = tracked content · checkpoints = reassessment cadence</li><li>Freshness + source count + uncertainty boundary</li><li>No causal claim · no trading instruction</li></ul>
        </article>
        <article className="card sample">
          <div className="sectionHead"><p>07</p><h2>{t.sample}</h2></div>
          <div className="sampleRead"><span>READ / 00 · DEMONSTRATION FORMAT</span><p>{ru ? `Baseline ${baseline.status}: ${baseline.delta_direction}/${baseline.synthesis_state}. Research object фиксирует prospective window ${sampleWindow.dateRange}, но считает его значимым только при подтверждённом изменении BTC structure. DAY_7 → DAY_30 возвращаются к этому же locked window, не переписывая исходный baseline; Astro остаётся независимым supporting context.` : `Baseline ${baseline.status}: ${baseline.delta_direction}/${baseline.synthesis_state}. The research object locks a prospective window for ${sampleWindow.dateRange}, but treats it as meaningful only if BTC structure confirms a change. DAY_7 → DAY_30 return to that same locked window without rewriting the baseline; Astro remains independent supporting context.`}</p></div>
        </article>
      </section>

      <section id="request" className="cta">
        <p className="eyebrow">FOUNDING · PRIVATE RESEARCH</p>
        <h2>{t.request}</h2>
        <p>{t.requestText}</p>
        <button type="button" aria-label={t.request}>{t.request}</button>
        <small>{t.closeout} · LOCKED BASELINE → TRACKED WINDOWS → APPEND-ONLY REASSESSMENT → CLOSEOUT</small>
      </section>
    </main>
    <style jsx>{`
      :global(html){background:#f1efe9;color:#111;scroll-behavior:smooth} :global(body){margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f1efe9;color:#111}
      :global(*){box-sizing:border-box} a{color:inherit;text-decoration:none} main{max-width:1180px;margin:0 auto;padding:0 28px 70px}.topbar{height:74px;display:flex;align-items:center;border-bottom:1px solid #c9c5bb;gap:24px;font-size:12px;letter-spacing:.13em}.brand{font-size:15px;font-weight:800}.preview{color:#6c685f}.lang{margin-left:auto;display:flex;gap:7px}.hero{padding:84px 0 62px;max-width:980px}.eyebrow{font-size:11px;letter-spacing:.19em;font-weight:800;margin:0 0 18px;color:#6b675f}.hero h1{font-family:Georgia,serif;font-size:clamp(48px,7vw,92px);line-height:.94;letter-spacing:-.045em;margin:0 0 28px;font-weight:500}.lead{font-size:clamp(20px,2.4vw,31px);line-height:1.28;max-width:900px;margin:0 0 28px}.question{font-family:Georgia,serif;font-style:italic;font-size:20px;line-height:1.5;max-width:820px;color:#39362f}.identityRow{display:flex;flex-wrap:wrap;gap:10px;margin-top:34px}.identityRow>*{border:1px solid #aaa59a;padding:9px 12px;font-size:10px;letter-spacing:.1em}.card{background:#fbfaf6;border:1px solid #d4d0c6;border-radius:2px;padding:30px;margin-bottom:18px}.sectionHead{display:flex;align-items:baseline;gap:14px;margin-bottom:18px}.sectionHead p{font-size:11px;letter-spacing:.15em;color:#817b70;margin:0}.sectionHead h2{font-family:Georgia,serif;font-size:31px;font-weight:500;letter-spacing:-.02em;margin:0}.muted{color:#625e56;max-width:880px;line-height:1.55}.metrics{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #d9d5cb;margin-top:28px}.metrics div{padding:22px 16px 8px 0;border-right:1px solid #e0ddd5}.metrics div:nth-child(3n){border-right:0}.metrics span,.metrics strong{display:block}.metrics span{font-size:10px;letter-spacing:.12em;color:#7b766d;text-transform:uppercase;margin-bottom:8px}.metrics strong{font-size:16px}.window{background:#111;color:#f4f1e9;padding:24px;min-height:265px;margin-top:28px}.windowTop{display:flex;justify-content:space-between;gap:16px;font-size:10px;letter-spacing:.12em;color:#aaa69d}.window h3{font-family:Georgia,serif;font-weight:500;font-size:28px;line-height:1.18;margin:22px 0}.sampleGrid{border-top:1px solid #3b3935;padding-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#3b3935}.sampleGrid p{background:#111;padding:16px;margin:0;font-size:12px;line-height:1.55;color:#d5d1c8}.sampleGrid b{display:block;color:#fff;text-transform:uppercase;letter-spacing:.1em;font-size:9px;margin-bottom:6px}.sampleGrid small{display:block;color:#aaa69d;margin-top:6px}.sampleGrid .proofBoundary{grid-column:1/-1}.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dark{background:#24221e;color:#f4f1e9;border-color:#24221e}.astroList{margin-top:25px;border-top:1px solid #4b4841}.astroList div{padding:15px 0;border-bottom:1px solid #4b4841}.astroList span,.astroList strong,.astroList small{display:block}.astroList span{font-size:10px;color:#9f9a90}.astroList strong{font-family:Georgia,serif;font-weight:500;margin:5px 0}.astroList small{color:#aaa59b}.memoryTag{display:inline-block;padding:8px 10px;background:#111;color:#fff;font-size:10px;letter-spacing:.1em}.memoryLine{border-top:1px solid #d9d5cb;margin-top:28px;padding-top:18px;display:flex;justify-content:space-between;gap:12px;font-size:13px}.rhythm{display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid #d8d4ca;border-left:1px solid #d8d4ca;margin-top:24px}.rhythm div{padding:18px 12px;border-right:1px solid #d8d4ca;border-bottom:1px solid #d8d4ca;min-height:105px}.rhythm span,.rhythm strong,.rhythm small{display:block}.rhythm span{font-size:10px;color:#817b70}.rhythm strong{font-size:11px;margin:20px 0 4px}.rhythm small{font-size:10px;color:#817b70}.rhythm .active{background:#111;color:#fff}.proofList{padding-left:18px;line-height:1.8;color:#524e47}.sample{background:#d8ff72;border-color:#c8ed6d}.sampleRead{border-top:1px solid #a9c95d;padding-top:25px}.sampleRead span{font-size:10px;letter-spacing:.12em}.sampleRead p{font-family:Georgia,serif;font-size:22px;line-height:1.45;margin-bottom:0}.cta{margin-top:18px;background:#111;color:#f5f2e9;padding:58px 32px;text-align:center}.cta .eyebrow{color:#aaa69d}.cta h2{font-family:Georgia,serif;font-size:clamp(36px,5vw,60px);font-weight:500;margin:0 0 18px}.cta p{max-width:650px;margin:0 auto 26px;color:#c9c5bd;line-height:1.55}.cta button{background:#d8ff72;color:#111;border:0;padding:15px 24px;font-weight:800;letter-spacing:.08em;font-size:11px;cursor:default}.cta small{display:block;color:#77736c;margin-top:22px;letter-spacing:.08em;font-size:9px}
      @media(max-width:760px){main{padding:0 16px 40px}.topbar{height:62px}.preview{display:none}.hero{padding:58px 0 40px}.hero h1{font-size:52px}.lead{font-size:20px}.card{padding:22px}.metrics{grid-template-columns:1fr 1fr}.metrics div:nth-child(3n){border-right:1px solid #e0ddd5}.metrics div:nth-child(2n){border-right:0}.split{grid-template-columns:1fr}.window{min-height:auto}.windowTop{display:grid}.sampleGrid{grid-template-columns:1fr}.sampleGrid .proofBoundary{grid-column:auto}.rhythm{grid-template-columns:repeat(2,1fr)}.sectionHead h2{font-size:26px}.cta{padding:44px 22px}.identityRow>*{font-size:9px}}
    `}</style>
  </>;
}