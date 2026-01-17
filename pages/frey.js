import Head from "next/head";
import { useEffect, useState } from "react";

export default function Frey() {
  const box = { maxWidth: 920, margin: "0 auto", padding: "48px 20px", lineHeight: 1.6 };
  const h1 = { fontSize: "40px", margin: "0 0 12px 0" };
  const lead = { opacity: 0.88, margin: "0 0 22px 0" };
  const card = {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
    margin: "14px 0",
    background: "rgba(0,0,0,0.25)",
  };
  const kbd = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    padding: "2px 8px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    display: "inline-block",
  };
  const btn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    textDecoration: "none",
    background: "rgba(255,255,255,0.06)",
    marginRight: 10,
  };
  const btnPrimary = {
    ...btn,
    background: "linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,215,0,0.35)",
  };
  const small = { opacity: 0.78, fontSize: 13 };

  const [localStatus, setLocalStatus] = useState("CHECKING");

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("http://127.0.0.1:8811/ping", { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setLocalStatus("GREEN"))
      .catch(() => setLocalStatus("RED"));
    return () => ctrl.abort();
  }, []);

  return (
    <>
      <Head>
        <title>Frey · Release v0.1</title>
        <meta name="description" content="Frey — публичный интерфейс Φ-системы ORION (portal / local), Release v0.1" />
      </Head>

      <main style={box}>
        <div style={{ marginBottom: 18 }}>
          <div style={small}><span style={kbd}>/frey</span> · Release v0.1 · Φ</div>
          <h1 style={h1}>Frey</h1>
          <p style={lead}>
            <b>Frey (v0.1)</b><br />
            Frey — публичная навигация: объясняю, структурирую, даю 3 шага и стоп-условия. Без раскрытия внутренних методов.<br /><br />
            <b>Старт</b><br />
            Напиши: <span style={kbd}>Цель / Контекст / Ограничения / Выход</span> — и я дам маршрут.<br /><br />
            <b>Границы</b><br />
            Я не раскрываю внутренние детали системы и не даю гарантий результата. Таблицы/градусы/астроданные — отдельный режим позже.
          </p>

          <div style={{ marginTop: 12 }}>
            <a href="#docs" style={btnPrimary}>Open Docs</a>
            <a href="http://127.0.0.1:8811/docs" target="_blank" rel="noreferrer" style={btn}>
              Open Local
            </a>
          </div>

          <div style={{ ...small, marginTop: 10 }}>
            Local Mode (optional):&nbsp;
            <b style={{ color: localStatus === "GREEN" ? "#6f6" : localStatus === "RED" ? "#f66" : "#ccc" }}>
              {localStatus}
            </b>
            &nbsp;· работает только если Frey запущен локально (127.0.0.1).
          </div>
        </div>

        <section id="docs" style={card}>
          <h2>Как пользоваться</h2>
          <ol>
            <li>Открой <span style={kbd}>/frey</span> на портале.</li>
            <li>Прочитай Docs (публичный режим).</li>
            <li>Если Frey запущен локально — нажми <b>Open Local</b>.</li>
          </ol>
        </section>

        <section style={card}>
          <h2>Safety / IP</h2>
          <p>
            Публичный Frey не раскрывает формулы, алгоритмы и приватные пайплайны.
            Любые вопросы “как считается” — RED и получают безопасный фоллбек.
          </p>
        </section>

        <div style={{ ...small, marginTop: 18 }}>
          /api на портале выключен (410). Публичная поверхность — только навигация и правила.
        </div>
      </main>
    </>
  );
}
