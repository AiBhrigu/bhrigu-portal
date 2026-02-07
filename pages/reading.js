import styles from "./reading.module.css";

export default function Reading() {
  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }} data-frey-reading-surface="__FREY_READING_QUERY_CANON_V0_4__">
      <nav className={styles.rail} aria-label="Route rail" data-phi-rail>
        <a className={styles.railLink} href="/start">← /start</a>
        <span className={styles.railSep}>/</span>
        <span className={styles.railHere}>/reading</span>
        <span className={styles.railSep}>/</span>
        <a className={styles.railLink} href="/signal">/signal →</a>
      </nav>

      <h1 style={{ margin: "1.2rem 0 0.8rem 0" }}>Reading</h1>

      <p>
        This portal is not a feed.<br />
        It is a map you read with intent.
      </p>

      <p>
        No onboarding. No CTA.<br />
        The only move: follow the structure.
      </p>

      <hr />

      <p><strong>Order</strong></p>
      <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
        <li><a href="/start">/start</a> — establish presence.</li>
        <li><a href="/map">/map</a> — perceive structure.</li>
        <li><a href="/services">/services</a> — see the exposed surfaces.</li>
        <li><a href="/cosmography">/cosmography</a> — research boundary.</li>
        <li><a href="/orion">/orion</a> — core boundary.</li>
        <li><a href="/frey">/frey</a> — interface boundary.</li>
        <li><a href="/dao">/dao</a> — governance/economic shell boundary.</li>
        <li><a href="/access">/access</a> — understand the gate.</li>
        <li><a href="/chronicle">/chronicle</a> — record state.</li>
      </ol>

      <hr />

      <p>
        If you need terms: <a href="/faq">/faq</a>.<br />
        Next: <a href="/signal">/signal</a> or <a href="/map">/map</a>.
      </p>
    </main>
  );
}
