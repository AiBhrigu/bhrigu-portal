import styles from "./cosmography.module.css";

export default function Cosmography() {
  return (
    <main className={styles.content}>
      \1Φ · \2\3

      <section className={styles.block}>
        <p className={styles.en}>
          Cosmography is a research surface.<br />
          It is separate from governance.<br />
          It is separate from the portal’s economics.
        </p>
      </section>

      <hr className={styles.hr} />

      <section className={styles.block}>
        <p className={styles.en}>
          This page is a boundary statement.<br />
          No dashboards.<br />
          No live instruments exposed here.
        </p>
      </section>

      <hr className={styles.hr} />

      <section className={styles.block}>
        <div className={styles.lang}>English</div>
        <p className={styles.ru}>
          Cosmography is the scientific surface.<br />
          It is separated from governance and the economic layer.<br />
          <br />
          This is a boundary declaration.<br />
          No core showcase and no “live instruments” on this page.
        </p>
      </section>

      <nav className={styles.rail} aria-label="Route rail">
        <a href="/map">← /map</a>
        <a href="/start">↑ /start</a>
      </nav>
    </main>
  );
}
