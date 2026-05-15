import Head from 'next/head';

const coreDownloads = [
  { label: 'EN Brief Publication v4', href: '/publications/frey/bhrigu-frey-en-brief-v4.pdf' },
  { label: 'EN Full Article v4', href: '/publications/frey/bhrigu-frey-en-full-article-v4.pdf' },
  { label: 'RU v2 Aligned Text', href: '/publications/frey/bhrigu-frey-ru-v2-aligned.pdf' },
];

const posterDownloads = [
  { label: 'EN Approved Poster Pack v5 - Visual Guide PDF', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-visual-guide.pdf' },
  { label: 'EN Approved Poster Pack v5 - ZIP', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5.zip' },
  { label: 'EN Approved Poster Pack v5 - SHA256', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5.sha256' },
  { label: 'EN Approved Poster Pack v5 - Report', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-report.md' },
];

const ruPosterDownloads = [
  { label: 'RU Poster Pack v1 - Visual Guide PDF', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-visual-guide.pdf' },
  { label: 'RU Poster Pack v1 - ZIP', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1.zip' },
  { label: 'RU Poster Pack v1 - ZIP SHA256', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1.zip.sha256' },
  { label: 'RU Poster Pack v1 - Manifest SHA256', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-manifest.sha256' },
  { label: 'RU Poster Pack v1 - Report', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-report.md' },
  { label: 'RU Poster Pack v1 - Contact Sheet', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-contact.jpg' },
];

const routeNodes = [
  { path: '/frey', title: 'Quick temporal input', body: 'The entry point for a date, moment, or question-shaped temporal focus.' },
  { path: '/reading', title: 'Meaning layer', body: 'The place where the temporal input becomes state, rhythm, tension, and direction.' },
  { path: '/access', title: 'Reviewed entry', body: 'A bounded manual path for cases that need a more careful structural reading.' },
];

const metrics = ['state', 'meaning', 'direction', 'compare / delta', 'AI read protocol', 'boundary'];

export default function FreyGuidePage() {
  return (
    <>
      <Head>
        <title>BHRIGU / Frey Guide</title>
        <meta name="description" content="A guide to BHRIGU / Frey as a structured temporal reading interface." />
      </Head>

      <main
        className="freyGuide"
        data-frey-guide="FREY_GUIDE_PUBLIC_ROUTE_V0_1"
        data-frey-downloads="FREY_GUIDE_APPROVED_DOWNLOADS_V0_1"
        data-frey-poster-pack="FREY_GUIDE_APPROVED_POSTER_PACK_V5"
        data-frey-poster-pack-ru="FREY_GUIDE_APPROVED_POSTER_PACK_RU_V1"
      >
        <section className="hero">
          <p className="eyebrow">BHRIGU / FREY GUIDE</p>
          <h1>A guide to structured temporal reading</h1>
          <p className="lead">
            Frey is not a chatbot, not a horoscope, not an oracle, and not a
            prediction engine. It is a bounded public interface for reading a
            temporal field with more structure.
          </p>
          <div className="routeLine" aria-label="BHRIGU Frey public route">
            <a href="/frey">/frey</a><span>→</span><a href="/reading">/reading</a><span>→</span><a href="/access">/access</a>
          </div>
        </section>

        <section className="panel">
          <h2>The public route</h2>
          <div className="grid">
            {routeNodes.map((node) => (
              <article className="card" key={node.path}>
                <p className="path">{node.path}</p>
                <h3>{node.title}</h3>
                <p>{node.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel split">
          <div>
            <h2>How to read a Frey response</h2>
            <p>A Frey response should be read as a structure, not as a command. The correct movement is state → meaning → direction.</p>
            <p>One date opens a state. Two dates open a transition. Compare / Delta is a map of change, not a ranking of better and worse days.</p>
          </div>
          <div className="metricBox">{metrics.map((item) => <span key={item}>{item}</span>)}</div>
        </section>

        <section className="panel">
          <h2>AI read protocol</h2>
          <p>Frey output can be handed to an AI as structured context. It should not be treated as a prophecy, final authority, or deterministic instruction.</p>
          <p>A useful AI reading preserves the structure, connects the metrics, avoids certainty amplification, and keeps human judgment central.</p>
        </section>

        <section className="panel downloadsPanel">
          <p className="eyebrow">PUBLICATION MATERIALS</p>
          <h2>Download the approved guide materials</h2>
          <p>These files preserve the public-safe Frey publication layer: English brief, English full article, and Russian v2 aligned text.</p>
          <div className="downloads">{coreDownloads.map((item) => <a className="download" href={item.href} key={item.href}>{item.label}</a>)}</div>
        </section>

        <section className="panel downloadsPanel">
          <p className="eyebrow">APPROVED VISUAL PACK · EN</p>
          <h2>Poster Pack v5</h2>
          <p>This approved visual guide pack is attached as a public reference asset after visual approval. Technical proofs, broken article layouts, old mixed packs, and route-drift versions are excluded.</p>
          <div className="downloads">{posterDownloads.map((item) => <a className="download" href={item.href} key={item.href}>{item.label}</a>)}</div>
        </section>

        <section className="panel downloadsPanel">
          <p className="eyebrow">APPROVED VISUAL PACK · RU</p>
          <h2>Poster Pack v1</h2>
          <p>Approved Russian visual guide pack aligned to the route canon: /frey → /reading → /access. Old mixed RU packs and route-drift versions are excluded.</p>
          <div className="downloads">{ruPosterDownloads.map((item) => <a className="download" href={item.href} key={item.href}>{item.label}</a>)}</div>
        </section>

        <section className="boundary">
          <h2>Boundary</h2>
          <p>BHRIGU / Frey is not financial, medical, legal, trading, or deterministic life advice. It helps transform time from a vague feeling into a readable field.</p>
        </section>
      </main>

      <style jsx>{`
        .freyGuide{min-height:100vh;padding:72px 22px;color:#f5efe2;background:radial-gradient(circle at 20% 10%,rgba(226,180,92,.18),transparent 32%),radial-gradient(circle at 80% 0%,rgba(75,124,255,.16),transparent 30%),linear-gradient(145deg,#070a12 0%,#10131d 46%,#06070b 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .hero,.panel,.boundary{width:min(1040px,100%);margin:0 auto 24px;border:1px solid rgba(226,180,92,.24);border-radius:28px;background:rgba(9,12,20,.72);box-shadow:0 24px 80px rgba(0,0,0,.32);backdrop-filter:blur(18px)}
        .hero{padding:48px}.panel,.boundary{padding:34px}.eyebrow,.path{margin:0 0 12px;color:#d8ad62;font-size:.78rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
        h1,h2,h3,p{margin-top:0}h1{max-width:860px;margin-bottom:18px;font-size:clamp(2.4rem,7vw,5.8rem);line-height:.95;letter-spacing:-.07em}h2{margin-bottom:16px;font-size:clamp(1.6rem,4vw,2.6rem);letter-spacing:-.04em}h3{margin-bottom:10px;font-size:1.2rem}
        p{color:rgba(245,239,226,.78);font-size:1rem;line-height:1.75}.lead{max-width:780px;font-size:clamp(1.08rem,2.2vw,1.38rem)}
        .routeLine{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:30px;font-size:clamp(1.25rem,4vw,2rem);font-weight:800}.routeLine a,.download{color:#f7d08a;text-decoration:none}.routeLine span{color:rgba(245,239,226,.46)}
        .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{min-height:210px;padding:24px;border:1px solid rgba(245,239,226,.12);border-radius:22px;background:rgba(255,255,255,.045)}
        .split{display:grid;grid-template-columns:1.25fr .75fr;gap:28px;align-items:center}.metricBox,.downloads{display:flex;flex-wrap:wrap;gap:10px}.metricBox span,.download{border:1px solid rgba(226,180,92,.24);border-radius:999px;padding:10px 14px;background:rgba(226,180,92,.08);font-size:.92rem}
        .downloadsPanel{border-color:rgba(226,180,92,.34)}.download{display:inline-flex;align-items:center;min-height:44px}.boundary{border-color:rgba(125,166,255,.28)}
        @media(max-width:820px){.freyGuide{padding:28px 14px}.hero,.panel,.boundary{border-radius:22px;padding:24px}.grid,.split{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
