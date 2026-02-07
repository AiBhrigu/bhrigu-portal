import styles from "./map.module.css";
import PortalFooterNav from "../components/PortalFooterNav";

const NODES = [
  { href: "/start", label: "/start", title: "Start", note: "presence anchor" },
  { href: "/reading", label: "/reading", title: "Reading", note: "rhythm of traversal" },
  { href: "/signal", label: "/signal", title: "Signal", note: "Φ continuity seal" },
  { href: "/services", label: "/services", title: "Services", note: "exposed contours" },
  { href: "/cosmography", label: "/cosmography", title: "Cosmography", note: "separated statement" },
  { href: "/orion", label: "/orion", title: "ORION", note: "core boundary" },
  { href: "/frey", label: "/frey", title: "Frey", note: "human interface layer" },
  { href: "/dao", label: "/dao", title: "DAO", note: "economic shell boundary" },
  { href: "/access", label: "/access", title: "Access", note: "email gate" },
  { href: "/github", label: "/github", title: "GitHub", note: "surface reference" },
  { href: "/chronicle", label: "/chronicle", title: "Chronicle", note: "state log" },
];

export default function MapPhi() {
  return (
    <main className={styles.content}>
      <h1 className={styles.h1}>
        Map <span className={styles.phi}>Φ</span>
      </h1>

      <p className={styles.en}>This is not navigation. This is structure.</p>

      <hr className={styles.hr} />

      <h2 className={styles.h2}>Nodes</h2>

      <ul className={styles.list}>
        {NODES.map((n) => (
          <li key={n.href} className={styles.item}>
            <a className={styles.link} href={n.href}>
              <span className={styles.path}>{n.label}</span>
              <span className={styles.sep}>—</span>
              <span className={styles.title}>{n.title}</span>
              <span className={styles.sep}>—</span>
              <span className={styles.note}>{n.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <hr className={styles.hr} />

      <p className={styles.en}>UI-level only. No data. No backend. No core access.</p>

      <nav className={styles.rail} aria-label="Route rail">
        <a href="/start">← /start</a>
        <a href="/cosmography">→ /cosmography</a>
      </nav>
    
            <PortalFooterNav termsHref="/faq" next={[{href:"/cosmography",label:"/cosmography"},{href:"/services",label:"/services"}]} note="Canon: map → cosmography." />
</main>
  );
}
