import { useEffect, useState } from "react";

function frame(mode, q) {
  const base = [`Signal: "${q}"`, ""];

  if (mode === "project") {
    return [
      ...base,
      "▣ Objective Layer",
      "▣ Timeline Layer",
      "▣ Execution Layer",
      "▣ Risk Node"
    ];
  }

  if (mode === "asset") {
    return [
      ...base,
      "▣ Asset Definition",
      "▣ Liquidity Layer",
      "▣ Risk Envelope",
      "▣ Evolution Potential"
    ];
  }

  return [
    ...base,
    "▣ Pattern Recognition",
    "▣ Interaction Vector",
    "▣ Stability Vector",
    "▣ Suggested Move"
  ];
}

export default function Reading() {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const mode = sessionStorage.getItem("frey_mode") || "project";
    const q = sessionStorage.getItem("frey_signal") || "";
    setLines(frame(mode, q));
  }, []);

  return (
    <div style={{ padding: "120px 40px", maxWidth: "720px", margin: "0 auto" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ marginBottom: "6px" }}>{l}</div>
      ))}
    </div>
  );
}
