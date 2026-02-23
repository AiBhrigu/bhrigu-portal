import { useState } from "react";
import { useRouter } from "next/router";

export default function Frey() {
  const router = useRouter();
  const [mode, setMode] = useState("project");
  const [q, setQ] = useState("");

  const submit = () => {
    if (!q.trim()) return;
    router.push(`/reading?mode=${mode}&q=${encodeURIComponent(q)}`);
  };

  return (
    <div style={{ padding: "120px 40px", maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <button onClick={() => setMode("project")}>PROJECT</button>
        <button onClick={() => setMode("asset")}>ASSET</button>
        <button onClick={() => setMode("human")}>HUMAN</button>
      </div>

      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Enter signal..."
        style={{ width: "100%", padding: "12px" }}
      />
    </div>
  );
}
