import styles from "./signal.module.css";
export default function Signal() {
  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}>
      <h1>Signal Φ</h1>

<nav className={styles.rail} aria-label="Route rail" data-phi-rail>
  <a className={styles.railLink} href="/reading">← /reading</a>
  <span className={styles.railSep}>/</span>
  <span className={styles.railHere}>/signal</span>
  <span className={styles.railSep}>/</span>
  <a className={styles.railLink} href="/map">/map →</a>
</nav>


      <p>
        System signal is present.<br />
        No action is required.
      </p>

      <hr />

      <p>
        Reading continues.<br />
        Structure remains stable.
      </p>

      <hr />

      <p>
        This page confirms continuity.<br />
        It does not request interaction.
      </p>

      <hr />

      <p><strong>RU</strong></p>

      <p>
        The system signal is present.<br />
        No action is required.
      </p>

      <p>
        Reading continues.<br />
        The structure is stable.
      </p>

      <p>
        This page records continuity.<br />
        It does not require interaction.
      </p>
    </main>
  );
}
