import Head from "next/head";
import styles from "./systems.module.css";

const PROOF_ROUTES = {
  temporal: "https://github.com/AiBhrigu/bhrigu-bitcoin-research-state-api",
  ephemerides: "https://www.bhrigu.io/ephemerides?lang=en",
  astro: "https://www.bhrigu.io/astro?lang=en",
  btc: "https://www.bhrigu.io/?lang=en",
  entropy: "https://github.com/captainchapster/Entropy32-Plus/blob/a69f95c0098d25b762845d3b2b4751ef412b00a0/README.md",
  phi: "https://github.com/AiBhrigu",
};

const COMMERCIAL_ROUTES = {
  recon: "https://www.bhrigu.io/access?lang=en",
  frey: "https://www.bhrigu.io/access?offer=frey-personal&lang=en",
  field: "https://www.bhrigu.io/field?lang=en",
};

const SYSTEM_CLASSES = [
  {
    number: "01",
    kind: "ai",
    title: "AI & Persistent Intelligence",
    description: "AI agents, conversational systems, MCP/tool interfaces, research interfaces, context and memory architecture, evaluation and continuity-aware state.",
    bridge: "AI agents · persistent AI · AI memory architecture · MCP · conversational AI · agent evaluation",
  },
  {
    number: "02",
    kind: "astronomy",
    title: "Astronomy & Ephemerides",
    description: "Source-bound astronomical computation, planetary positions, motion, aspect geometry, stations, ingresses, temporal archives and provenance.",
    evidence: "BHRIGU currently publishes a daily source-bound ephemeris with planetary positions, motion, aspect relations, monthly archive bindings, engine identity, commit and dataset hash.",
    bridge: "ephemeris software · planetary calculations · Swiss Ephemeris · astronomical data · aspect calculations",
  },
  {
    number: "03",
    kind: "astrology",
    title: "Astrology Systems",
    description: "Research architecture that keeps astronomical observation, astrological semantics, interpretation and uncertainty as distinct layers.",
    evidence: "The current Astro Research Atlas explicitly separates accepted, reference, research and protected/candidate layers and does not convert research mechanisms into claims of proven market causality.",
    bridge: "astrology software architecture · astrology research systems · transit systems · aspect engines · astrology AI",
  },
  {
    number: "04",
    kind: "temporal",
    title: "Temporal / Prospective Systems",
    description: "Systems that preserve previous state, current state and change across time — then represent possible future paths without silently turning scenarios into certainty.",
    evidence: "Public Bitcoin temporal evidence already preserves precommitted future windows and later compares them with observed reality without rewriting the original baseline.",
    bridge: "temporal intelligence · state tracking · scenario tracking · prospective systems · longitudinal AI",
  },
  {
    number: "05",
    kind: "evidence",
    title: "Scientific Evidence & Verification",
    description: "Provenance, version binding, deterministic validation, reproducible evidence records, explicit source authority and visible failure states.",
    evidence: "The current public Bitcoin evidence stack exposes deterministic verification, source dependencies, commit binding and fail-closed source behavior.",
    bridge: "evidence provenance · deterministic verification · reproducible research systems · AI evaluation · source verification",
  },
  {
    number: "06",
    kind: "btc",
    title: "Bitcoin / Market State Systems",
    description: "Evidence-linked Bitcoin research combining verified state, change memory, temporal context, source boundaries and bounded interpretation.",
    evidence: "BTC is currently the first and only proven public live market corridor; expansion to additional markets is explicitly held outside the proven claim.",
    bridge: "Bitcoin research · BTC market state · Bitcoin research API · temporal evidence · market-state intelligence",
  },
  {
    number: "07",
    kind: "information",
    title: "Information & Product Architecture",
    description: "System maps, information hierarchy, public/protected boundaries, research interfaces, machine-readable discovery surfaces and evidence-linked product architecture.",
    evidence: "The current public system map already separates market, temporal, interpretation/depth and commercial boundary paths rather than collapsing them into one navigation object.",
    bridge: "information architecture · research portal architecture · product system architecture · AI-readable websites · evidence-linked UX",
  },
];

const CAPABILITY_GROUPS = [
  {
    title: "AI / AGENT SYSTEMS",
    items: [
      {
        status: "PROVEN",
        title: "Read-only agent interfaces and MCP research tools.",
        body: "Public proof includes Bitcoin state endpoints, temporal-window interfaces, MCP tools, explicit source failure behavior and a no-trading/no-wallet authority boundary.",
      },
      {
        status: "PROVEN",
        title: "Machine-readable public discovery surfaces.",
        body: "The public Φ profile exposes llms.txt, sitemap and robots discovery routes, while the Founding Field defines machine-readable public registry objects.",
      },
      {
        status: "BOUNDED",
        title: "Persistent / continuity-aware intelligence.",
        body: "Public proof exists for preserving subject, accepted state, evidence boundaries, temporal windows and continuation context. This must not be expanded into a claim of unlimited autonomous memory or universal cross-session persistence.",
      },
    ],
  },
  {
    title: "ASTRONOMY / EPHEMERIDES",
    items: [
      { status: "PROVEN", title: "Source-bound planetary ephemerides." },
      { status: "PROVEN", title: "Planetary longitude and motion state." },
      { status: "PROVEN", title: "Major aspect geometry with applying / separating state." },
      { status: "PROVEN", title: "Published station and ingress context." },
      {
        status: "PROVEN",
        title: "Version, engine, repository, commit and dataset-hash provenance.",
        body: "These objects are directly present in the current Ephemerides public surface.",
      },
      {
        status: "BOUNDED",
        title: "Eclipse computation.",
        body: "Reference eclipse context is public; the Astro Atlas explicitly marks canonical event geometry as separately bounded rather than fully activated publicly.",
      },
    ],
  },
  {
    title: "ASTROLOGY SYSTEMS",
    items: [
      { status: "PROVEN", title: "Separation of astronomical observation from interpretation." },
      { status: "PROVEN", title: "Aspect-phase research semantics." },
      { status: "PROVEN", title: "Research-layer taxonomy with explicit accepted / reference / research / protected states." },
      {
        status: "BOUNDED",
        title: "Astrology × market research.",
        body: "BTC × Astro exists as active bounded research, but this does not establish astrological market causality.",
      },
      {
        status: "BOUNDED",
        title: "General astrology product architecture.",
        body: "The system has relevant research and temporal interpretation surfaces, but /systems must not imply that every conventional astrology engine is currently a proven production capability.",
      },
    ],
  },
  {
    title: "TEMPORAL / PROSPECTIVE SYSTEMS",
    items: [
      { status: "PROVEN", title: "Previous-state versus current-state comparison." },
      { status: "PROVEN", title: "Immutable precommit → later observation." },
      { status: "PROVEN", title: "Declared temporal windows." },
      {
        status: "PROVEN",
        title: "Conditions that strengthen, weaken or invalidate an interpretation.",
        body: "The Bitcoin research stack preserves precommitted windows and the BTC public corridor exposes explicit forward conditions rather than deterministic prediction.",
      },
      {
        status: "BOUNDED",
        title: "Prospective intelligence.",
        valid: ["possible paths", "conditions", "constraints", "invalidation boundaries"],
        invalid: ["guaranteed prediction", "certain future state", "predictive superiority"],
      },
    ],
  },
  {
    title: "SCIENTIFIC EVIDENCE / VERIFICATION",
    items: [
      { status: "PROVEN", title: "Source/provenance binding." },
      { status: "PROVEN", title: "Version-pinned evidence objects." },
      { status: "PROVEN", title: "Deterministic validation surfaces." },
      { status: "PROVEN", title: "Explicit failure state rather than silent source substitution." },
      {
        status: "PROVEN",
        title: "External read-only defect investigation capable of producing an actionable repair.",
        body: "Independent proof exists: Entropy32 Plus publicly credits Cosmographer / BHRIGU with identifying the overlapping interval-comparison defect, and the project changed to non-overlapping interval pairs.",
      },
    ],
  },
  {
    title: "BITCOIN / MARKET SYSTEMS",
    items: [
      { status: "PROVEN", title: "BTC evidence-linked public research corridor." },
      { status: "PROVEN", title: "Verified current state + change memory." },
      { status: "PROVEN", title: "Protocol-time and market-time evidence." },
      { status: "PROVEN", title: "Bounded expectation evidence." },
      { status: "PROVEN", title: "Visible source and causality boundaries." },
      {
        status: "BOUNDED",
        title: "Wider crypto / market systems.",
        body: "Static and research examples exist beyond BTC, but BTC remains the only proven public live corridor.",
      },
    ],
  },
  {
    title: "INFORMATION / PRODUCT ARCHITECTURE",
    items: [
      { status: "PROVEN", title: "System mapping." },
      { status: "PROVEN", title: "Public / protected boundary architecture." },
      { status: "PROVEN", title: "Research-interface architecture." },
      {
        status: "PROVEN",
        title: "Human + agent entry contracts.",
        body: "The existing commercial recon already defines system map, evidence, findings, repair blueprint and strict read-only/public-protected boundaries.",
      },
      {
        status: "BOUNDED",
        title: "Full product development.",
        body: "Architecture capability must not be converted into an implied offer to build any arbitrary product end-to-end.",
      },
    ],
  },
];

const PROOF_OBJECTS = [
  {
    number: "01",
    className: "AI / MCP / Temporal Evidence",
    title: "BHRIGU Bitcoin Temporal Evidence",
    description: "Read-only HTTP + MCP research capability with temporal windows, deterministic verification, public source dependencies and explicit authority boundaries.",
    cta: "Inspect repository ↗",
    status: "PROVEN",
    href: PROOF_ROUTES.temporal,
  },
  {
    number: "02",
    className: "Astronomy / Ephemerides",
    title: "BHRIGU Ephemerides",
    description: "Daily source-bound planetary state with motion, relations, archive context and reproducible provenance.",
    cta: "Open Ephemerides →",
    status: "PROVEN",
    href: PROOF_ROUTES.ephemerides,
  },
  {
    number: "03",
    className: "Astro Research Architecture",
    title: "Astro Research Atlas",
    description: "Public map separating sky/time evidence, research engines, Bitcoin × Astro research and protected research depth.",
    cta: "Open Astro Research Atlas →",
    status: "PROVEN / BOUNDED BY MODULE",
    href: PROOF_ROUTES.astro,
  },
  {
    number: "04",
    className: "Bitcoin State + Change",
    title: "BTC Field / Market Cosmographer",
    description: "Evidence-linked public corridor for verified Bitcoin state, change, temporal context, conditions and visible source boundaries.",
    cta: "Open BTC Field →",
    status: "PROVEN",
    href: PROOF_ROUTES.btc,
  },
  {
    number: "05",
    className: "External System Finding",
    title: "Entropy32 Plus",
    description: "Independent external repository adopted a BHRIGU/Cosmographer finding concerning overlapping entropy comparisons and publicly documented the change.",
    cta: "Inspect upstream evidence ↗",
    status: "PROVEN EXTERNAL ADOPTION",
    href: PROOF_ROUTES.entropy,
  },
  {
    number: "06",
    className: "Public Architecture Layer",
    title: "AiBhrigu / Φ Research Systems",
    description: "Public-safe system hierarchy, selected repositories, proof surfaces, machine-readable discovery routes and protected-IP boundary.",
    cta: "Inspect public proof ↗",
    status: "PROVEN PUBLIC AUTHORITY SURFACE",
    href: PROOF_ROUTES.phi,
  },
];

const METHOD = [
  ["01", "Scope", "Define the system, question and authority boundary."],
  ["02", "State", "Establish what is accepted as current and what earlier state can legitimately be compared."],
  ["03", "Evidence", "Bind observations to source, time and provenance."],
  ["04", "Change", "Identify meaningful deltas without mixing incompatible states."],
  ["05", "Verify", "Test claims, failure conditions and reproducibility."],
  ["06", "Boundary", "Keep observation, interpretation, uncertainty and protected mechanism distinct."],
  ["07", "Output", "Expose the useful result and its evidence without exposing protected mechanics."],
];

const BOUNDARIES = [
  "Astronomical observation is not automatically astrological interpretation.",
  "Astrological research is not proof of physical market causality.",
  "A prospective scenario is not a guaranteed forecast.",
  "Bitcoin research is not financial advice, a trading signal or execution authority.",
  "Persistent state does not imply unlimited personal memory, unattended autonomy or universal account history.",
  "A public interface does not imply access to ORION internals.",
  "A public proof repository does not expose private prompts, evaluators, corpora, unpublished research or protected mechanisms.",
  "A capability class does not automatically mean a commercial service is available for that capability.",
];

const COMMERCIAL = [
  {
    letter: "A",
    title: "Φ External Systems Recon",
    price: "USD 300",
    intro: ["One bounded system.", "Read-only investigation."],
    receive: ["System map", "3 highest-impact findings", "Evidence for each finding", "One exact repair blueprint"],
    cta: "Open External Systems Recon →",
    boundary: "The live object explicitly excludes full product development, penetration testing, trading execution and unbounded redesign.",
    href: COMMERCIAL_ROUTES.recon,
  },
  {
    letter: "B",
    title: "Frey Personal",
    price: "USD 79",
    intro: ["One subject.", "One meaningful temporal horizon.", "One complete Cosmographic Reading."],
    passport: true,
    cta: "Open Frey Personal →",
    boundary: "The current object keeps uncertainty visible and explicitly excludes guaranteed outcomes and medical, legal or financial advice.",
    href: COMMERCIAL_ROUTES.frey,
  },
  {
    letter: "C",
    title: "BHRIGU AI Founding Field",
    price: "USD 99 · one-time",
    intro: ["One public founding coordinate for an agent, model, project or product."],
    attributes: ["Public.", "Timestamped.", "Machine-readable."],
    cta: "Open AI Founding Field →",
    boundary: "The live field explicitly makes no promise of traffic, ranking or endorsement.",
    href: COMMERCIAL_ROUTES.field,
  },
];

const CANONICAL_DESCRIPTION = "Φ Research Systems is a research and systems field working across AI and persistent intelligence, astronomy and ephemerides, astrology research systems, temporal and prospective systems, evidence verification, Bitcoin market-state research, and information architecture. Its public systems preserve explicit boundaries between source, observation, state, change, interpretation, uncertainty and protected mechanism. BHRIGU is a public product and research surface. ORION remains protected analytical depth. AiBhrigu is a public proof namespace.";

function externalProps(href) {
  return href.startsWith("https://github.com")
    ? { target: "_blank", rel: "noreferrer" }
    : {};
}

function Geometry({ kind }) {
  if (kind === "ai") {
    return <div className={`${styles.geometry} ${styles.geometryAi}`} aria-hidden="true"><i /><i /><i /><b /></div>;
  }
  if (kind === "astronomy") {
    return <div className={`${styles.geometry} ${styles.geometryAstronomy}`} aria-hidden="true"><i /><b /><span /><span /><span /></div>;
  }
  if (kind === "astrology") {
    return <div className={`${styles.geometry} ${styles.geometryAstrology}`} aria-hidden="true"><i /><span /><span /><span /><span /></div>;
  }
  if (kind === "temporal") {
    return <div className={`${styles.geometry} ${styles.geometryTemporal}`} aria-hidden="true"><b /><i /><span /><span /><span /></div>;
  }
  if (kind === "evidence") {
    return <div className={`${styles.geometry} ${styles.geometryEvidence}`} aria-hidden="true"><span>SOURCE</span><i /><span>PROVENANCE</span><i /><span>VERIFY</span><i /><span>BOUNDARY</span></div>;
  }
  if (kind === "btc") {
    return <div className={`${styles.geometry} ${styles.geometryBtc}`} aria-hidden="true"><span /><span /><b>₿</b><span /><span /></div>;
  }
  return <div className={`${styles.geometry} ${styles.geometryInformation}`} aria-hidden="true"><i><i><i /></i></i></div>;
}

function SectionHeading({ index, eyebrow, title, id }) {
  return (
    <header className={styles.sectionHeading}>
      <p className={styles.sectionIndex}>{index}</p>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
    </header>
  );
}

function SystemsStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://www.bhrigu.io/systems#page",
    url: "https://www.bhrigu.io/systems",
    name: "Φ Research Systems | AI, Ephemerides & Temporal Evidence",
    description: CANONICAL_DESCRIPTION,
    inLanguage: "en",
    about: {
      "@type": "Thing",
      name: "Φ Research Systems",
      description: CANONICAL_DESCRIPTION,
      sameAs: [PROOF_ROUTES.phi],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "system_classes",
      numberOfItems: 7,
      itemListElement: SYSTEM_CLASSES.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        description: item.description,
      })),
    },
    hasPart: [
      {
        "@type": "ItemList",
        name: "public_proof",
        numberOfItems: 6,
        itemListElement: PROOF_OBJECTS.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: item.href,
          additionalType: item.status,
        })),
      },
      {
        "@type": "ItemList",
        name: "commercial_entries",
        numberOfItems: 3,
        itemListElement: COMMERCIAL.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          description: item.price,
          url: item.href,
        })),
      },
    ],
    sameAs: Object.values(PROOF_ROUTES),
  };
  return <script type="application/ld+json" data-systems-machine-graph="PHI_RESEARCH_SYSTEMS_V0_1" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default function SystemsPage() {
  return (
    <>
      <Head>
        <title>Φ Research Systems | AI, Ephemerides &amp; Temporal Evidence</title>
        <meta name="description" content="Research systems for AI agents, ephemerides, astrology architecture, temporal evidence, Bitcoin state, verification and information architecture." />
        <link rel="canonical" href="https://www.bhrigu.io/systems" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Φ Research Systems | AI, Ephemerides & Temporal Evidence" />
        <meta property="og:description" content="Research systems for AI agents, ephemerides, astrology architecture, temporal evidence, Bitcoin state, verification and information architecture." />
        <meta property="og:url" content="https://www.bhrigu.io/systems" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Φ Research Systems | AI, Ephemerides & Temporal Evidence" />
        <meta name="twitter:description" content="Research systems for AI agents, ephemerides, astrology architecture, temporal evidence, Bitcoin state, verification and information architecture." />
        <SystemsStructuredData />
      </Head>

      <main className={styles.systems} data-systems-page="PHI_RESEARCH_SYSTEMS_V0_1" lang="en">
        <section className={styles.hero} aria-labelledby="systems-title">
          <div className={styles.heroCore}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Φ RESEARCH SYSTEMS</p>
              <h1 id="systems-title">One research architecture. Multiple system classes.</h1>
              <p className={styles.heroLead}>We design evidence-bound systems for problems where state, change, time, provenance and interpretation must remain traceable.</p>
              <p className={styles.heroClasses}>AI and persistent intelligence. Astronomy and ephemerides. Astrology research systems. Temporal and prospective systems. Scientific evidence and verification. Bitcoin and market-state research. Information and product architecture.</p>
              <p className={styles.identityLine}>ONE CORE <span>→</span> MULTIPLE SYSTEM CLASSES</p>
              <div className={styles.heroActions}>
                <a href="#system-classes">Explore system classes ↓</a>
                <a href="#public-proof">Inspect public proof →</a>
              </div>
            </div>

            <div className={styles.fieldCanvas} aria-label="One Φ field expressed through seven distinct system classes">
              <div className={styles.fieldCore}>
                <span>ONE</span>
                <strong>Φ</strong>
                <span>FIELD</span>
              </div>
              <div className={styles.fieldAxis} aria-hidden="true" />
              {SYSTEM_CLASSES.map((item) => (
                <div className={`${styles.expression} ${styles[`expression${item.number}`]}`} key={item.number}>
                  <span className={styles.expressionNumber}>{item.number}</span>
                  <Geometry kind={item.kind} />
                  <strong>{item.title}</strong>
                </div>
              ))}
            </div>
          </div>

          <nav className={styles.proofRail} aria-label="Public proof objects">
            <span className={styles.proofRailLabel}>CONCRETE PUBLIC PROOF</span>
            {PROOF_OBJECTS.map((proof) => (
              <a href={proof.href} {...externalProps(proof.href)} key={proof.number}>
                <span>{proof.number} · {proof.title}</span>
                <strong>{proof.status}</strong>
              </a>
            ))}
          </nav>
        </section>

        <div className={styles.machineReader} data-machine-readable="canonical_entity_description">
          <p>{CANONICAL_DESCRIPTION}</p>
          <p>system_classes · capability_status · public_proof · commercial_entries · boundaries · canonical_urls · sameAs</p>
        </div>

        <section className={`${styles.section} ${styles.fieldSection}`} aria-labelledby="field-title">
          <SectionHeading index="01" eyebrow="THE FIELD" id="field-title" title="Systems that preserve the difference between data, state, change and interpretation." />
          <div className={styles.fieldStatement}>
            <div className={styles.fieldBody}>
              <p>Many systems become unreliable when current state is separated from its history, evidence loses provenance, uncertainty disappears, or interpretation is presented as fact.</p>
              <p>Φ Research Systems works on that structural layer.</p>
              <p>The shared pattern is simple:</p>
            </div>
            <div className={styles.relationChain} aria-label="Object to output relationship">
              {["OBJECT", "STATE", "CHANGE", "TIME", "EVIDENCE", "VERIFICATION", "BOUNDARY", "OUTPUT"].map((node) => <span key={node}>{node}</span>)}
            </div>
            <div className={styles.fieldClosing}>
              <p>Different domains require different instruments.</p>
              <p>The architectural discipline remains consistent.</p>
              <strong>The domain changes.<br />The requirement for traceable state does not.</strong>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.classesSection}`} id="system-classes" aria-labelledby="classes-title">
          <SectionHeading index="02" eyebrow="SYSTEM CLASSES" id="classes-title" title="Seven classes. One structural field." />
          <div className={styles.classLedger}>
            {SYSTEM_CLASSES.map((item) => (
              <article className={styles.classRow} key={item.number} data-system-class={item.kind}>
                <div className={styles.classIdentity}>
                  <span>{item.number}</span>
                  <Geometry kind={item.kind} />
                </div>
                <div className={styles.classCopy}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.evidence && <p className={styles.classEvidence}>{item.evidence}</p>}
                </div>
                <p className={styles.searchBridge}><strong>Search bridge:</strong><br />{item.bridge}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.capabilitiesSection}`} aria-labelledby="capabilities-title">
          <SectionHeading index="03" eyebrow="CAPABILITY STATUS" id="capabilities-title" title="Claim only what can be defended." />
          <p className={styles.sectionLead}>Each capability displayed here must resolve to either:</p>
          <div className={styles.statusKey}>
            <p><strong>PROVEN</strong> — public working proof exists.</p>
            <p><strong>BOUNDED</strong> — capability or research exists, but the public proof supports only a narrower statement.</p>
          </div>
          <div className={styles.capabilityGroups}>
            {CAPABILITY_GROUPS.map((group) => (
              <section className={styles.capabilityGroup} key={group.title}>
                <h3>{group.title}</h3>
                <div className={styles.capabilityList}>
                  {group.items.map((item) => (
                    <article className={styles.capabilityItem} key={`${group.title}-${item.title}`}>
                      <span className={item.status === "PROVEN" ? styles.proven : styles.bounded}>{item.status}</span>
                      <div>
                        <h4>{item.title}</h4>
                        {item.body && <p>{item.body}</p>}
                        {item.valid && (
                          <div className={styles.languageBoundary}>
                            <p><strong>Valid public language:</strong></p>
                            <p>{item.valid.join(" · ")}</p>
                            <p><strong>Invalid public language:</strong></p>
                            <p>{item.invalid.join(" · ")}</p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.proofSection}`} id="public-proof" aria-labelledby="proof-title">
          <SectionHeading index="04" eyebrow="PROOF" id="proof-title" title="Working systems leave inspectable evidence." />
          <p className={styles.sectionLead}>This section should contain proof objects, not generic logos or testimonials.</p>
          <div className={styles.proofLedger}>
            {PROOF_OBJECTS.map((proof) => (
              <article className={styles.proofObject} key={proof.number}>
                <div className={styles.proofIndex}>
                  <span>Proof {proof.number} ·</span>
                  <strong>{proof.className}</strong>
                </div>
                <div className={styles.proofCopy}>
                  <h3>{proof.title}</h3>
                  <p>{proof.description}</p>
                  <a href={proof.href} {...externalProps(proof.href)}>{proof.cta}</a>
                </div>
                <p className={styles.proofStatus}>Proof status: <strong>{proof.status}.</strong></p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.methodSection}`} aria-labelledby="method-title">
          <SectionHeading index="05" eyebrow="METHOD" id="method-title" title="Fix the object before interpreting the system." />
          <div className={styles.methodChain}>
            {METHOD.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p className={styles.methodLine}>SCOPE → STATE → EVIDENCE → CHANGE → VERIFY → BOUNDARY → OUTPUT</p>
        </section>

        <section className={`${styles.section} ${styles.boundarySection}`} aria-labelledby="boundary-title">
          <SectionHeading index="06" eyebrow="BOUNDARY" id="boundary-title" title="Capability is not unlimited authority." />
          <p className={styles.sectionLead}>Φ Research Systems works with explicit limits.</p>
          <div className={styles.boundaryLedger}>
            {BOUNDARIES.map((boundary, index) => <p key={boundary}><span>{String(index + 1).padStart(2, "0")}</span>{boundary}</p>)}
          </div>
          <p className={styles.boundaryLine}>EXPOSE MEANING <span>·</span> PROVE CAPABILITY <span>·</span> PROTECT MECHANISM</p>
          <p className={styles.orionBoundary}>The present ORION public page independently confirms that ORION is protected analytical depth rather than a public API, dashboard or open research mechanism.</p>
        </section>

        <section className={`${styles.section} ${styles.commercialSection}`} id="commercial" aria-labelledby="commercial-title">
          <SectionHeading index="07" eyebrow="AVAILABLE NOW" id="commercial-title" title="Capabilities are broad. Purchasable objects are exact." />
          <p className={styles.sectionLead}>Do not convert the seven system classes into seven service cards.</p>
          <p className={styles.sectionLead}>Only these live commercial objects belong here.</p>
          <div className={styles.commercialRail}>
            {COMMERCIAL.map((item) => (
              <article key={item.letter}>
                <div className={styles.commercialIdentity}>
                  <span>{item.letter}</span>
                  <h3>{item.title}</h3>
                  <strong>{item.price}</strong>
                </div>
                <div className={styles.commercialBody}>
                  {item.intro.map((line) => <p key={line}>{line}</p>)}
                  {item.receive && <><p>You receive:</p><ul>{item.receive.map((line) => <li key={line}>{line}</li>)}</ul></>}
                  {item.passport && <p>Delivered as a portable <strong>Cosmographic Passport</strong>.</p>}
                  {item.attributes && <p className={styles.attributes}>{item.attributes.join(" ")}</p>}
                </div>
                <div className={styles.commercialAction}>
                  <a href={item.href}>{item.cta}</a>
                  <p>{item.boundary}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.separationLine}>
            <strong>CAPABILITY ≠ PRODUCT</strong>
            <p>What Φ Research Systems can credibly work with is broader than what BHRIGU currently sells.</p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.entrySection}`} aria-labelledby="entry-title">
          <SectionHeading index="08" eyebrow="ENTRY" id="entry-title" title="Start with the system, not the pitch." />
          <div className={styles.entryGrid}>
            <div>
              <p>If you are evaluating Φ Research Systems, inspect the working evidence first.</p>
              <p>If you need a live commercial object, choose the exact entry point that matches the problem.</p>
            </div>
            <div className={styles.entryActions}>
              <a href="#public-proof">Inspect public proof →</a>
              <a href="#commercial">View commercial entry points ↑</a>
            </div>
          </div>
          <footer className={styles.pageFooter}>
            <strong>Φ Research Systems</strong>
            <p>Evidence-bound systems across AI, time, astronomy, research and markets.</p>
          </footer>
        </section>
      </main>
    </>
  );
}
