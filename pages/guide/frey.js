import Head from 'next/head';

const downloads = [
  {
    "label": "EN Brief Publication v4",
    "href": "/publications/frey/bhrigu-frey-en-brief-v4.pdf"
  },
  {
    "label": "EN Full Article v4",
    "href": "/publications/frey/bhrigu-frey-en-full-article-v4.pdf"
  },
  {
    "label": "RU v2 Aligned Text",
    "href": "/publications/frey/bhrigu-frey-ru-v2-aligned.pdf"
  },
  {
    "label": "EN Visual Guide v4",
    "href": "/publications/frey/bhrigu-frey-en-visual-guide-v4.pdf"
  },
  {
    "label": "EN Publication Report v4",
    "href": "/publications/frey/bhrigu-frey-en-publication-report-v4.pdf"
  }
];

const routeNodes = [
  {
    path: '/frey',
    title: 'Quick temporal input',
    body:
      'The entry point for a date, moment, or question-shaped temporal focus.',
  },
  {
    path: '/reading',
    title: 'Meaning layer',
    body:
      'The place where the temporal input becomes state, rhythm, tension, and direction.',
  },
  {
    path: '/access',
    title: 'Reviewed entry',
    body:
      'A bounded manual path for cases that need a more careful structural reading.',
  },
];

const metrics = [
  'state',
  'meaning',
  'direction',
  'compare / delta',
  'AI read protocol',
  'boundary',
];

export default function FreyGuidePage() {
  return (
    <>
      <Head>
        <title>BHRIGU / Frey Guide</title>
        <meta
          name="description"
          content="A guide to BHRIGU / Frey as a structured temporal reading interface."
        />
      </Head>

      <main className="freyGuide" data-frey-guide="FREY_GUIDE_PUBLIC_ROUTE_V0_1" data-frey-downloads="FREY_GUIDE_DOWNLOADS_V0_1">
        <section className="hero">
          <p className="eyebrow">BHRIGU / FREY GUIDE</p>
          <h1>A guide to structured temporal reading</h1>
          <p className="lead">
            Frey is not a chatbot, not a horoscope, not an oracle, and not a
            prediction engine. It is a bounded public interface for reading a
            temporal field with more structure.
          </p>
          <div className="routeLine" aria-label="BHRIGU Frey public route">
            <a href="/frey">/frey</a>
            <span>→</span>
            <a href="/reading">/reading</a>
            <span>→</span>
            <a href="/access">/access</a>
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
            <p>
              A Frey response should be read as a structure, not as a command.
              The correct movement is state → meaning → direction.
            </p>
            <p>
              One date opens a state. Two dates open a transition. Compare /
              Delta is a map of change, not a ranking of better and worse days.
            </p>
          </div>
          <div className="metricBox">
            {metrics.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>AI read protocol</h2>
          <p>
            Frey output can be handed to an AI as structured context. It should
            not be treated as a prophecy, final authority, or deterministic
            instruction.
          </p>
          <p>
            A useful AI reading preserves the structure, connects the metrics,
            avoids certainty amplification, and keeps human judgment central.
          </p>
        </section>

        <section className="panel downloadsPanel">
          <p className="eyebrow">PUBLICATION MATERIALS</p>
          <h2>Download the guide materials</h2>
          <p>
            These files preserve the current public-safe Frey publication layer:
            English overview, full English article, and the Russian v2 text
            aligned to the same route canon.
          </p>
          <div className="downloads">
            {downloads.map((item) => (
              <a className="download" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <section className="boundary">
          <h2>Boundary</h2>
          <p>
            BHRIGU / Frey is not financial, medical, legal, trading, or
            deterministic life advice. It helps transform time from a vague
            feeling into a readable field.
          </p>
        </section>
      </main>

      <style jsx>{`
        .freyGuide {
          min-height: 100vh;
          padding: 72px 22px;
          color: #f5efe2;
          background:
            radial-gradient(circle at 20% 10%, rgba(226, 180, 92, 0.18), transparent 32%),
            radial-gradient(circle at 80% 0%, rgba(75, 124, 255, 0.16), transparent 30%),
            linear-gradient(145deg, #070a12 0%, #10131d 46%, #06070b 100%);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .hero,
        .panel,
        .boundary {
          width: min(1040px, 100%);
          margin: 0 auto 24px;
          border: 1px solid rgba(226, 180, 92, 0.24);
          border-radius: 28px;
          background: rgba(9, 12, 20, 0.72);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(18px);
        }

        .hero {
          padding: 48px;
        }

        .panel,
        .boundary {
          padding: 34px;
        }

        .eyebrow,
        .path {
          margin: 0 0 12px;
          color: #d8ad62;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin-top: 0;
        }

        h1 {
          max-width: 860px;
          margin-bottom: 18px;
          font-size: clamp(2.4rem, 7vw, 5.8rem);
          line-height: 0.95;
          letter-spacing: -0.07em;
        }

        h2 {
          margin-bottom: 16px;
          font-size: clamp(1.6rem, 4vw, 2.6rem);
          letter-spacing: -0.04em;
        }

        h3 {
          margin-bottom: 10px;
          font-size: 1.2rem;
        }

        p {
          color: rgba(245, 239, 226, 0.78);
          font-size: 1rem;
          line-height: 1.75;
        }

        .lead {
          max-width: 780px;
          font-size: clamp(1.08rem, 2.2vw, 1.38rem);
        }

        .routeLine {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          margin-top: 30px;
          font-size: clamp(1.25rem, 4vw, 2rem);
          font-weight: 800;
        }

        .routeLine a,
        .download {
          color: #f7d08a;
          text-decoration: none;
        }

        .routeLine span {
          color: rgba(245, 239, 226, 0.46);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .card {
          min-height: 210px;
          padding: 24px;
          border: 1px solid rgba(245, 239, 226, 0.12);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.045);
        }

        .split {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 28px;
          align-items: center;
        }

        .metricBox,
        .downloads {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .metricBox span,
        .download {
          border: 1px solid rgba(226, 180, 92, 0.24);
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(226, 180, 92, 0.08);
          font-size: 0.92rem;
        }

        .downloadsPanel {
          border-color: rgba(226, 180, 92, 0.34);
        }

        .download {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
        }

        .boundary {
          border-color: rgba(125, 166, 255, 0.28);
        }

        @media (max-width: 820px) {
          .freyGuide {
            padding: 28px 14px;
          }

          .hero,
          .panel,
          .boundary {
            border-radius: 22px;
            padding: 24px;
          }

          .grid,
          .split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
