import Head from "next/head";

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

  return (
    <>
      <Head>
        <title>Frey · Release v0.1</title>
        <meta
          name="description"
          content="Frey — публичный интерфейс Φ-системы ORION (портал / локал), Release v0.1"
        />
      </Head>

      <main style={box}>
        <div style={{ marginBottom: 18 }}>
          <div style={small}>
            <span style={kbd}>/frey</span> · Release v0.1 · Φ
          </div>
          <h1 style={h1}>Frey</h1>
          <p style={lead}>
            Frey — публичный интерфейс Φ-системы ORION: объясняет, как пользоваться,
            и даёт безопасную “поверхностную” навигацию без раскрытия внутренних методов.
          </p>

          <div style={{ marginTop: 12 }}>
            <a href="#docs" style={btnPrimary}>Open Docs</a>
            <a
              href="http://127.0.0.1:8811/docs"
              target="_blank"
              rel="noreferrer"
              style={btn}
            >
              Open Local
            </a>
            <div style={{ ...small, marginTop: 8 }}>
              Open Local работает только на твоей машине, если Frey запущен локально (127.0.0.1:8811).
            </div>
          </div>
        </div>

        <section id="docs" style={card}>
          <h2 style={{ margin: "0 0 8px 0" }}>Как пользоваться (онлайн)</h2>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Открой страницу <span style={kbd}>/frey</span> на портале.</li>
            <li>Нажми <b>Open Docs</b> — прочитай возможности и ограничения.</li>
            <li>Если ты на своей машине и Frey поднят локально — нажми <b>Open Local</b>.</li>
          </ol>
          <p style={{ ...small, marginTop: 10 }}>
            В публичном режиме достаточно Docs: мы не просим доступы и не выводим внутреннюю механику.
          </p>
        </section>

        <section style={card}>
          <h2 style={{ margin: "0 0 8px 0" }}>Режимы</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li><b>Online (Portal):</b> объяснение, навигация, правила безопасности.</li>
            <li><b>Local (Frey API):</b> локальный сервер для тестов и разработки (не публичный).</li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={{ margin: "0 0 8px 0" }}>Быстрые ссылки (локал)</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              <a href="http://127.0.0.1:8811/docs" target="_blank" rel="noreferrer">
                http://127.0.0.1:8811/docs
              </a>
            </li>
            <li>
              <a href="http://127.0.0.1:8811/ping" target="_blank" rel="noreferrer">
                http://127.0.0.1:8811/ping
              </a>
            </li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={{ margin: "0 0 8px 0" }}>Safety / IP</h2>
          <p style={{ margin: 0 }}>
            Frey в публичном режиме не раскрывает внутренние методы, формулы, приватные пайплайны и патентные детали.
            Любые запросы “как именно это считается” — RED и получают безопасный отказ/фоллбек.
          </p>
        </section>

        <div style={{ ...small, marginTop: 18 }}>
          /api на портале остаётся выключен (410/404). Публичная поверхность — только навигация и правила.
        </div>
      </main>
    </>
  );
}
