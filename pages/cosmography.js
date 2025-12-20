import styles from "./cosmography.module.css";

export default function Cosmography() {
  return (
    <main className={styles.content}>
      <h1 className={styles.h1}>Cosmography</h1>

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
        <div className={styles.lang}>Русский</div>
        <p className={styles.ru}>
          Космография — научная поверхность.<br />
          Она отделена от управления и экономического контура.<br />
          <br />
          Это декларация границ.<br />
          Без витрин ядра и без “живых приборов” на этой странице.
        </p>
      </section>

      <nav className={styles.rail} aria-label="Route rail">
        <a href="/map">← /map</a>
        <a href="/start">↑ /start</a>
      </nav>
    </main>
  );
}
