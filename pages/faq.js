import React from "react";

export default function FAQ() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 20px" }}>

      <h1 style={{ marginBottom: "32px" }}>FAQ</h1>

      <div style={{ marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid #eee" }}>
        <h3 style={{ marginBottom: "12px" }}>What is Frey?</h3>
        <p>
          <strong>Frey</strong> is the execution intelligence layer of BHRIGU — designed
          to read structured systems and define actionable next steps.
        </p>
      </div>

      <div style={{ marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid #eee" }}>
        <h3 style={{ marginBottom: "12px" }}>What is a Cosmographer?</h3>
        <p>
          A <strong>Cosmographer</strong> reads structure, identifies leverage,
          and defines the next action within complex systems.
        </p>
      </div>

      <div style={{ marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid #eee" }}>
        <h3 style={{ marginBottom: "12px" }}>Is Frey public?</h3>
        <p>
          Frey operates as a surface-first system. Public capabilities remain minimal by design.
          Access to deeper layers is structured and gated.
        </p>
      </div>

      <div style={{ marginBottom: "36px" }}>
        <h3 style={{ marginBottom: "12px" }}>Where can I see system structure?</h3>
        <p>
          Explore structured demonstrations in <strong>/reading</strong> or
          review role definitions in <strong>/cosmographer</strong>.
        </p>
      </div>

    </main>
  );
}
