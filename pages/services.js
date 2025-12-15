export default function Services() {
  const groups = [
    { title: "Human", items: ["Φ-passport", "Resonance profiles", "Identity mapping"] },
    { title: "Asset", items: ["Φ-scoring", "Cycle alignment", "Portfolio resonance"] },
    { title: "Crypto", items: ["Astro-economic signals", "Cycle-based analytics", "Volatility-aware modes"] },
  ];

  return (
    <main>
      <h1>Services</h1>

      <p className="dim">
        Not offerings. Exposed contours.
      </p>

      <hr />

      {groups.map(g => (
        <section key={g.title} style={{ marginBottom: "1.4rem" }}>
          <h3 style={{ margin: "0 0 .4rem 0" }}>{g.title}</h3>
          <ul>
            {g.items.map(i => <li key={i}>{i}</li>)}
          </ul>
        </section>
      ))}

      <hr />

      <p className="dim">
        UI only. No onboarding. No pricing. No calls to action.
      </p>
    </main>
  );
}
