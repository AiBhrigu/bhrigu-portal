--- /mnt/data/_frey_patch/orig_frey.js	2026-01-18 15:11:39.490442939 +0000
+++ /mnt/data/_frey_patch/patched_frey.js	2026-01-18 15:11:39.490894822 +0000
@@ -47,10 +47,11 @@
     // Copy helper (SSR-safe: defined during prerender; clipboard runs only on click in browser)
     const buildFreyLine = (t) => {
       const v = (t || "").trim();
-      return v || `ЦЕЛЬ: ...
-КОНТЕКСТ: ...
-ОГРАНИЧЕНИЯ: ...
-ВЫХОД: ...`;
+      return v || `FREY_FREE_LINE v1.0
+GOAL: <1 sentence>.
+CONTEXT: <2–4 facts>.
+CONSTRAINTS: <limits / what not to do>.
+OUTPUT: <format: 3 steps + one stop condition>.`;
     };
 
     const copyFreyLine = async () => {
@@ -110,15 +111,29 @@
           <div style={small}><span style={kbd}>/frey</span> · Release v0.1 · Φ</div>
           <h1 style={h1}>Frey</h1>
           <p style={lead}>
-              Frey — публичная навигация: 3 шага + стоп-условия. Без раскрытия внутренних методов.
-            </p>
+            Frey turns vague questions into clear, repeatable tasks for AI. No magic. Just structure.
+          </p>
+          <div style={{ ...small, margin: "0 0 14px 0" }}>
+            «Фрей — форма запроса: цель/контекст/ограничения/выход. Скопируй → вставь в любой ИИ-чат.»
+          </div>
+
+          <div style={{ margin: "10px 0 18px 0" }}>
+            <div style={small}><span style={kbd}>HOW IT WORKS</span></div>
+            <ol style={{ margin: "8px 0 0 18px" }}>
+              <li>Goal — what you want</li>
+              <li>Context — facts that matter</li>
+              <li>Constraints — limits / rules</li>
+              <li>Output — required format</li>
+              <li>Copy → paste into any AI chat</li>
+            </ol>
+          </div>
 
             <div style={{ margin: "10px 0 18px 0" }}>
-              <div style={small}><span style={kbd}>СТРОКА</span></div>
+              <div style={small}><span style={kbd}>FREE LINE</span></div>
               <textarea
                 value={promptText}
                 onChange={(e) => setPromptText(e.target.value)}
-placeholder={`ЦЕЛЬ: ...\nКОНТЕКСТ: ...\nОГРАНИЧЕНИЯ: ...\nВЫХОД: ...`}
+placeholder={`FREY_FREE_LINE v1.0\nGOAL: <1 sentence>.\nCONTEXT: <2–4 facts>.\nCONSTRAINTS: <limits / what not to do>.\nOUTPUT: <format: 3 steps + one stop condition>.`}
                 style={{
                   width: "100%",
                   minHeight: 120,
@@ -141,6 +156,54 @@
               </div>
             </div>
 
+            <div style={{ marginTop: 12 }}>
+              <div style={small}><span style={kbd}>PREVIEW ANSWER</span> (demo)</div>
+              <pre style={{
+                margin: "8px 0 0 0",
+                padding: "12px 14px",
+                borderRadius: 16,
+                border: "1px solid rgba(255,255,255,0.12)",
+                background: "rgba(0,0,0,0.25)",
+                whiteSpace: "pre-wrap",
+                fontFamily: kbd.fontFamily,
+                fontSize: 13,
+                opacity: 0.92,
+              }}>
+L0 — Result: 1–2 sentences aligned with GOAL.
+L1 — Context: accepted; constraints respected.
+L2 — Next steps:
+• Step one
+• Step two
+• Step three
+STOP: one clear stop condition.
+              </pre>
+            </div>
+
+            <details style={{ ...card, marginTop: 14 }}>
+              <summary>Examples</summary>
+              <pre style={{ ...small, marginTop: 10, whiteSpace: "pre-wrap", fontFamily: kbd.fontFamily }}>
+FREY_FREE_LINE v1.0
+GOAL: Define the next step for the Frey project.
+CONTEXT: MVP API works locally (passport/match/log).
+CONSTRAINTS: No code. No forecasts. Practical actions only.
+OUTPUT: 3 steps for today + one stop condition.
+              </pre>
+              <pre style={{ ...small, marginTop: 10, whiteSpace: "pre-wrap", fontFamily: kbd.fontFamily }}>
+FREY_FREE_LINE v1.0
+GOAL: Outline a crypto test plan for BTC.
+CONTEXT: I can call /phi-passport and /match-user-asset locally.
+CONSTRAINTS: No price prediction. Use only testable steps.
+OUTPUT: 3 tests + one stop condition.
+              </pre>
+              <pre style={{ ...small, marginTop: 10, whiteSpace: "pre-wrap", fontFamily: kbd.fontFamily }}>
+FREY_FREE_LINE v1.0
+GOAL: Prepare a music set brief.
+CONTEXT: Style is cosmic / layered. Audience is live.
+CONSTRAINTS: No marketing fluff.
+OUTPUT: 3 actionable ideas + one stop condition.
+              </pre>
+            </details>
+
             <div style={{ marginTop: 8 }}>
               <a href="#docs" style={btnPrimary}>Details</a>
             </div>
@@ -161,6 +224,12 @@
             </div>
 
             <div style={{ ...small, marginTop: 10 }}>
+              Developers (dev only): <a href="http://127.0.0.1:8811/docs" target="_blank" rel="noreferrer">Local API docs</a>
+              &nbsp;· <a href="https://github.com/AiBhrigu" target="_blank" rel="noreferrer">GitHub</a>
+              &nbsp;· <a href="https://aibhrigu.github.io/phi-cosmography-canon/" target="_blank" rel="noreferrer">Canon</a>
+            </div>
+
+            <div style={{ ...small, marginTop: 10 }}>
               Local Mode (optional):&nbsp;
               <b style={{ color: localStatus === "GREEN" ? "#6f6" : localStatus === "RED" ? "#f66" : "#ccc" }}>
                 {localStatus}
@@ -172,8 +241,7 @@
         <details style={card}>
           <summary>Safety / IP</summary>
           <p>
-            Публичный Frey не раскрывает формулы, алгоритмы и приватные пайплайны.
-            Любые вопросы “как считается” — RED и получают безопасный фоллбек.
+            Public Frey shares templates and examples; methods stay internal.
           </p>
         </details>
 
