import styles from "./reading.module.css";
export default function Reading() {
  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}>
      <h1>Reading</h1>

<nav className={styles.rail} aria-label="Route rail" data-phi-rail>
  <a className={styles.railLink} href="/start">← /start</a>
  <span className={styles.railSep}>/</span>
  <span className={styles.railHere}>/reading</span>
  <span className={styles.railSep}>/</span>
  <a className={styles.railLink} href="/signal">/signal →</a>
</nav>


      <p>
        This portal is not navigated.<br />
        It is read.
      </p>

      <hr />

      <p><strong>Order</strong></p>
      <p>
        1. <a href="/start">/start</a> — establish presence.<br />
        2. <a href="/map">/map</a> — perceive structure.<br />
        3. <a href="/services">/services</a> — observe contours.<br />
        4. <a href="/orion">/orion</a> — core boundary.<br />
        5. <a href="/frey">/frey</a> — interface boundary.<br />
        6. <a href="/dao">/dao</a> — economic shell boundary.<br />
        7. <a href="/access">/access</a> — understand the gate.<br />
        8. <a href="/chronicle">/chronicle</a> — fix the state.
      </p>

      <hr />

      <p><strong>RU</strong></p>
      <p>
        Этот портал не “листают”.<br />
        Его читают.
      </p>

      <hr />

      <p><strong>Порядок</strong></p>
      <p>
        1. <a href="/start">/start</a> — зафиксировать присутствие.<br />
        2. <a href="/map">/map</a> — увидеть структуру.<br />
        3. <a href="/services">/services</a> — контуры.<br />
        4. <a href="/orion">/orion</a> — граница ядра.<br />
        5. <a href="/frey">/frey</a> — граница интерфейса.<br />
        6. <a href="/dao">/dao</a> — граница экономической оболочки.<br />
        7. <a href="/access">/access</a> — понять доступ.<br />
        8. <a href="/chronicle">/chronicle</a> — зафиксировать состояние.
      </p>
    </main>
  );
}
