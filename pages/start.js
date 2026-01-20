import styles from "./start.module.css";

export default function Start() {
  return (
    <main className={styles.content}>
      \1Φ · \2\3

      <section className={styles.block}>
        <div className={styles.lang}>EN</div>
        <p className={styles.en}>
          The portal is open.<br /><br />
          This is not an interface.<br />
          This is an axis.<br /><br />
          Presence precedes interaction.<br />
          Structure precedes explanation.
        </p>
      </section>

      <hr className={styles.hr} />

      <section className={styles.block}>
        <div className={styles.lang}>Русский</div>
        <p className={styles.ru}>
          Портал открыт.<br /><br />
          Это не интерфейс.<br />
          Это ось.<br /><br />
          Присутствие предшествует взаимодействию.<br />
          Структура предшествует объяснению.
        </p>
      </section>

      <nav className={styles.rail} aria-label="Route rail">
        <a href="/map">→ /map</a>
      </nav>
    </main>
  );
}
