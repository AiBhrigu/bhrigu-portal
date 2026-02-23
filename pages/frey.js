import { useState } from "react";
import { useRouter } from "next/router";

export default function Frey() {
  const router = useRouter();
  const [mode, setMode] = useState("project");
  const [q, setQ] = useState("");

  const submit = () => {
    if (!q.trim()) return;
    sessionStorage.setItem("frey_mode", mode);
    sessionStorage.setItem("frey_signal", q);
    router.push("/reading");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse 70% 40% at center, rgba(255,170,80,0.45) 0%, rgba(0,0,0,0.95) 65%)",
      position: "relative",
      color: "#e7c58f"
    }}>
      <div style={{
        position: "absolute",
        width: "60%",
        height: "1px",
        background: "rgba(255,190,120,0.8)",
        boxShadow: "0 0 18px rgba(255,170,80,0.9)",
        top: "50%",
        transform: "translateY(-50%)"
      }} />

      <div style={{ width: "520px", maxWidth: "90%", textAlign: "center" }}>
        <div style={{ marginBottom: "20px" }}>
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
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px"
          }}
        />
      </div>
    </div>
  );
}
