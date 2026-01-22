import styles from "./reading.module.css";
export default function Reading() {
  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}>
      \1Φ · \2\3

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
        This portal is not for scrolling.<br />
        It is meant to be read.
      </p>

      <hr />

      <p><strong>Order</strong></p>
      <p>
        1. <a href="/start">/start</a> — confirm presence.<br />
        2. <a href="/map">/map</a> — see the structure.<br />
        3. <a href="/services">/services</a> — contours.<br />
        4. <a href="/orion">/orion</a> — core boundary.<br />
        5. <a href="/frey">/frey</a> — interface boundary.<br />
        6. <a href="/dao">/dao</a> — economic layer boundary.<br />
        7. <a href="/access">/access</a> — understand access.<br />
        8. <a href="/chronicle">/chronicle</a> — record state.
      </p>
    </main>
  );
}
