import { useRouter } from "next/router";

function frame(mode, q) {
  const base = [`Signal: "${q}"`, ""];

  if (mode === "project") {
    return [
      ...base,
      "▣ Objective Layer",
      "  Structural objective detected.",
      "",
      "▣ Timeline Layer",
      "  Mid-term phase transition likely.",
      "",
      "▣ Execution Layer",
      "  Controlled expansion advised.",
      "",
      "▣ Risk Node",
      "  Volatility cluster present."
    ];
  }

  if (mode === "asset") {
    return [
      ...base,
      "▣ Asset Definition",
      "  Interpreted as structural capital layer.",
      "",
      "▣ Liquidity Layer",
      "  Compression detected.",
      "",
      "▣ Risk Envelope",
      "  Moderate instability window.",
      "",
      "▣ Evolution Potential",
      "  Adaptive positioning suggested."
    ];
  }

  return [
    ...base,
    "▣ Pattern Recognition",
    "  Interaction pattern identified.",
    "",
    "▣ Interaction Vector",
    "  Directional alignment needed.",
    "",
    "▣ Stability Vector",
    "  Balance threshold near pivot.",
    "",
    "▣ Suggested Move",
    "  Recalibrate communication phase."
  ];
}

export default function Reading() {
  const router = useRouter();
  const { mode = "project", q = "" } = router.query;
  const lines = frame(mode, q);

  return (
    <div style={{ padding: "120px 40px", maxWidth: "720px", margin: "0 auto" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ marginBottom: "6px" }}>{l}</div>
      ))}
    </div>
  );
}
