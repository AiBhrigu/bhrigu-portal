export default function Map() {
  const nodes = [
    { href: "/start", label: "Start", note: "presence anchor" },
    { href: "/reading", label: "Reading", note: "rhythm of traversal" },
    { href: "/signal", label: "Signal", note: "Φ continuity seal" },
    { href: "/services", label: "Services", note: "exposed contours" },
    { href: "/cosmography", label: "Cosmography", note: "separated statement" },
    { href: "/orion", label: "ORION", note: "core boundary" },
    { href: "/frey", label: "Frey", note: "human interface layer" },
    { href: "/dao", label: "DAO", note: "economic shell boundary" },
    { href: "/access", label: "Access", note: "email gate" },
    { href: "/github", label: "GitHub", note: "surface reference" },
    { href: "/chronicle", label: "Chronicle", note: "state log" },
  ];

  return (
    <main>
      <h1>
        Map <span className="phi-seal">Φ</span>
      </h1>

      <p className="dim">
        This is not navigation. This is structure.
      </p>

      <hr />

      <p><strong>Nodes</strong></p>

      <ul>
        {nodes.map(n => (
          <li key={n.href} data-node={n.href}>
            <a href={n.href}>{n.href}</a> — <span className="dim">{n.label}</span> — <span className="dim">{n.note}</span>
          </li>
        ))}
      </ul>

      <hr />

      <p className="dim">
        UI-level only. No data. No backend. No core access.
      </p>
    </main>
  );
}
