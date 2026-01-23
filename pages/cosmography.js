import styles from "./cosmography.module.css";

export default function Cosmography() {
  return (
    <main className={styles.content}>
      <h1 className={styles.h1}>Cosmography Φ</h1>

      <section className={styles.block}>
        <p className={styles.en}>
          Cosmography is the research surface.<br />
          It describes structure, cycles, and resonance as a readable field.
        </p>
      </section>

      <hr className={styles.hr} />

      <section className={styles.block}>
        <p className={styles.en}>
          This page is a boundary statement:<br />
          — no dashboards<br />
          — no live instruments<br />
          — no economics on this surface
        </p>
      </section>

      <hr className={styles.hr} />

      <section className={styles.block}>
        <p className={styles.en}>
          If you want the engine boundary: <a href="/orion">/orion</a>.<br />
          If you want the interface boundary: <a href="/frey">/frey</a>.<br />
          If you want the reading order: <a href="/reading">/reading</a>.
        </p>
      </section>

      <nav className={styles.rail} aria-label="Route rail">
        <a href="/map">← /map</a>
        <a href="/reading">↑ /reading</a>
      </nav>
    </main>
  );
}
