import { FormEvent, useEffect, useRef, useState } from "react";
import { FieldAnchorGlyph } from "../../components/btc/BtcSurfaceGlyphs";
import BtcAstroCrossChartMatrix from "./BtcAstroCrossChartMatrix";
import { getBtcObservabilityContext, newBtcObservabilityTurnId, recordBtcClientEvent } from "../../lib/btc-observability-client";
import type {
  BtcCleanChatResponse,
  BtcCleanLocale,
  BtcCleanSemanticVisual,
  BtcCleanSource,
} from "../../lib/btc-clean-chat-v1";

const SESSION_VERSION = "btc-clean-chat-v1";
const MAX_TURNS = 16;
const MAX_CONTEXT_TURNS = 12;
const CLIENT_RUNTIME_TIMEOUT_MS = 180_000;
const CANONICAL_CLEAN_CHAT_URL = "https://www.bhrigu.io/crypto-astro/btc/clean-chat";

type CleanTurn = {
  id: string;
  user: string;
  assistant: string | null;
  topic: string | null;
  asOf: string | null;
  sources: BtcCleanSource[];
  evidence?: BtcCleanChatResponse["evidence"];
  semanticVisual?: BtcCleanSemanticVisual | null;
  error?: boolean;
};

type Props = {
  locale: BtcCleanLocale;
  initialQuestion?: string;
};

type RuntimeFailurePayload = {
  message?: string;
  code?: string;
  retryable?: boolean;
};

class CleanChatRuntimeError extends Error {
  constructor(readonly code: string, readonly retryable: boolean) {
    super(code);
    this.name = "CleanChatRuntimeError";
  }
}

function storageKey(locale: BtcCleanLocale): string {
  return `bhrigu:${SESSION_VERSION}:${locale}`;
}

function readTurns(locale: BtcCleanLocale): CleanTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(storageKey(locale));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_TURNS).filter((turn) =>
      turn && typeof turn === "object" && typeof turn.id === "string" && typeof turn.user === "string"
    );
  } catch {
    return [];
  }
}

function persistTurns(locale: BtcCleanLocale, turns: CleanTurn[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(locale), JSON.stringify(turns.slice(-MAX_TURNS)));
  } catch {
    // A full storage surface must never block the visible conversation.
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function continuityPayload(visual: BtcCleanSemanticVisual | null | undefined) {
  const native = visual?.native;
  if (!native || native.type !== "CURRENT_TO_GENESIS_MATRIX") return undefined;
  const primary = native.rows[0] ?? null;
  return {
    semantic_kind: "ASTRO_BTC" as const,
    astro_relation: "CURRENT_TO_GENESIS" as const,
    reference_event: "genesis" as const,
    primary_relation_id: primary?.relation_id ?? null,
    primary_relation_signature: primary ? { transit_body: primary.transit_body, genesis_body: primary.genesis_body, aspect: primary.aspect } : null,
    temporal_window: primary?.window ?? null,
  };
}

function priorPayload(turns: CleanTurn[]) {
  return turns.filter((turn) => turn.assistant).slice(-MAX_CONTEXT_TURNS).map((turn) => ({
    user: turn.user,
    assistant: turn.assistant ?? undefined,
    topic: turn.topic ?? undefined,
    continuity: continuityPayload(turn.semanticVisual),
  }));
}

function formatAsOf(locale: BtcCleanLocale, value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function btcCleanChatRuntimeFailureCopy(locale: BtcCleanLocale, code: string, retryable: boolean): string {
  const ru = locale === "ru";
  if (code === "MODEL_CAPACITY_HOLD") {
    return ru ? "Модельная ёмкость Cosmographer временно приостановлена. Повторять запрос сейчас не нужно." : "Cosmographer model capacity is temporarily paused. Repeating the request now is not needed.";
  }
  if (code === "COST_GUARD_RATE_LIMITED") {
    return ru ? "Слишком много запросов за короткий период. Дождитесь защитного интервала." : "Too many requests in a short period. Wait for the protective interval.";
  }
  if (code === "COST_GUARD_CONCURRENCY_LIMITED") {
    return ru ? "Предыдущий запрос ещё обрабатывается. Дождитесь его завершения." : "A previous request is still being processed. Wait for it to finish.";
  }
  if (code === "COST_GUARD_BUDGET_LIMITED") {
    return ru ? "Временный бюджетный предел Cosmographer достигнут. Попробуйте позже." : "The temporary Cosmographer budget limit has been reached. Please try later.";
  }
  if (code === "COST_GUARD_REPLAY") {
    return ru ? "Этот ход уже был принят. Отправьте новый вопрос только при необходимости." : "This turn was already admitted. Send a new question only if needed.";
  }
  if (code === "COST_GUARD_UNAVAILABLE") {
    return ru ? "Защитный контур временно недоступен. Попробуйте позже." : "The protective access layer is temporarily unavailable. Please try later.";
  }
  if (retryable || code === "MODEL_TIMEOUT" || code === "MODEL_RATE_LIMITED" || code === "MODEL_PROVIDER_TRANSIENT") {
    return ru ? "Сервис временно недоступен. Попробуйте позже." : "The service is temporarily unavailable. Please try later.";
  }
  if (code === "MODEL_OUTPUT_LIMIT") {
    return ru ? "Ответ превысил допустимый объём. Повторять тот же вопрос не нужно." : "The answer exceeded the allowed output size. Repeating the same question is not needed.";
  }
  if (code === "MODEL_CREDIT_UNAVAILABLE") {
    return ru ? "Модельная ёмкость бесплатного Cosmographer временно исчерпана. Повторять запрос не нужно." : "Free Cosmographer model capacity is temporarily exhausted. Repeating the request is not needed.";
  }
  if (code === "MODEL_RESPONSE_INVALID") {
    return ru ? "Модельный ответ не прошёл проверку. Повторять тот же вопрос не нужно." : "The model response did not pass validation. Repeating the same question is not needed.";
  }
  return ru ? "Текущий evidence runtime не завершил ответ. Повторять тот же вопрос не нужно." : "The current evidence runtime did not complete the answer. Repeating the same question is not needed.";
}

async function copyVisibleText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the bounded DOM fallback.
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function buildCleanChatCopyText(locale: BtcCleanLocale, text: string, subject: "user" | "assistant"): string {
  if (subject !== "assistant") return text;
  const sourceLabel = locale === "ru" ? "Источник" : "Source";
  return `${text}\n\n${sourceLabel}: BHRIGU BTC Cosmographer\n${CANONICAL_CLEAN_CHAT_URL}`;
}

function CopyAction({ locale, text, subject }: { locale: BtcCleanLocale; text: string; subject: "user" | "assistant" }) {
  const ru = locale === "ru";
  const [copied, setCopied] = useState(false);
  const aria = subject === "assistant"
    ? (ru ? "Копировать ответ Cosmographer" : "Copy Cosmographer response")
    : (ru ? "Копировать ваше сообщение" : "Copy your message");
  const copyText = buildCleanChatCopyText(locale, text, subject);
  return <button
    type="button"
    className="cleanCopyAction"
    aria-label={aria}
    data-copy-subject={subject}
    data-copy-attribution={subject === "assistant" ? "bhrigu-btc-cosmographer" : undefined}
    onClick={async () => { if (await copyVisibleText(copyText)) setCopied(true); }}
  >{copied ? (ru ? "Скопировано" : "Copied") : (ru ? "Копировать" : "Copy")}</button>;
}

function SemanticVisual({ locale, visual }: { locale: BtcCleanLocale; visual: BtcCleanSemanticVisual }) {
  const ru = locale === "ru";
  const freshness = visual.freshness === "FRESH" ? (ru ? "свежее" : "fresh") : visual.freshness === "LIMITED" ? (ru ? "ограничено" : "limited") : (ru ? "неизвестно" : "unknown");
  const stateLabel = {
    CONFIRMATION: ru ? "Подтверждение" : "Confirmation",
    DIVERGENCE: ru ? "Расхождение" : "Divergence",
    LIMITED: ru ? "Ограничено" : "Limited",
    TEMPORAL: ru ? "Временной контекст" : "Temporal",
    EXPECTATION: ru ? "Ожидание" : "Expectation",
  }[visual.state];
  return <div className="cleanSemanticVisual" data-semantic-visual={visual.kind} data-semantic-state={visual.state} aria-label={ru ? "Смысловой маркер поля" : "Field meaning marker"}>
    <FieldAnchorGlyph className="cleanSemanticGlyph"/>
    <div className="cleanVisualIdentity"><b>{visual.axis_label}</b>{visual.context_label && <span>{visual.context_label}</span>}</div>
    <i className="cleanVisualState" aria-hidden="true"/>
    <strong className="cleanVisualStateLabel">{stateLabel}</strong>
    {visual.metrics.length > 0 && <div className="cleanVisualMetrics">{visual.metrics.slice(0, 2).map((metric) => <span key={metric.label}><small>{metric.label}</small><b>{metric.value}</b></span>)}</div>}
    <em className={`cleanFreshness cleanFreshness-${visual.freshness.toLowerCase()}`}>{freshness}</em>
  </div>;
}

function AssistantMessage({ locale, turn, newest }: { locale: BtcCleanLocale; turn: CleanTurn; newest: boolean }) {
  const ru = locale === "ru";
  return <article className={`cleanMessage cleanAssistant${turn.error ? " cleanError" : ""}`} data-clean-assistant="true" data-topic={turn.topic ?? ""}>
    <div className="cleanRole cleanCosmographerRole"><FieldAnchorGlyph className="cleanRoleGlyph"/><span>Cosmographer</span></div>
    <div className="cleanBubble">
      {turn.assistant === null
        ? <div className="cleanPendingStatus" role="status" aria-live="polite" data-pending-state="evidence">
            <span>{ru ? "Собираю evidence…" : "Gathering evidence…"}</span>
            <span className="cleanThinkingDots" aria-hidden="true"><i/><i/><i/></span>
          </div>
        : <>
            {turn.semanticVisual?.native?.type === "CURRENT_TO_GENESIS_MATRIX" && <BtcAstroCrossChartMatrix locale={locale} native={turn.semanticVisual.native}/>}
            <p>{turn.assistant}</p><CopyAction locale={locale} text={turn.assistant} subject="assistant"/>
          </>}
      {turn.semanticVisual && !turn.semanticVisual.native && turn.assistant !== null && <SemanticVisual locale={locale} visual={turn.semanticVisual}/>}
      {turn.sources.length > 0 && turn.assistant !== null && <details className="cleanSources">
        <summary>{ru ? "Источники" : "Sources"}</summary>
        <div className="cleanSourceList">
          {turn.sources.map((source) => <a key={`${turn.id}-${source.id}`} href={source.href} target="_blank" rel="noreferrer">
            <span>{source.label}</span>
            {source.as_of && <small>{formatAsOf(locale, source.as_of)}</small>}
          </a>)}
        </div>
      </details>}
      {newest && turn.asOf && turn.assistant !== null && <time className="cleanAsOf" dateTime={turn.asOf}>{formatAsOf(locale, turn.asOf)}</time>}
    </div>
  </article>;
}

export default function BtcCleanChatV1({ locale, initialQuestion = "" }: Props) {
  const ru = locale === "ru";
  const [turns, setTurns] = useState<CleanTurn[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const initialSentRef = useRef(false);
  const observabilityOpenedRef = useRef(false);

  useEffect(() => {
    setTurns(readTurns(locale));
    setHydrated(true);
  }, [locale]);

  useEffect(() => {
    if (!hydrated) return;
    persistTurns(locale, turns);
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hydrated, locale, turns]);

  useEffect(() => {
    if (!hydrated || observabilityOpenedRef.current) return;
    observabilityOpenedRef.current = true;
    recordBtcClientEvent({ eventType: "BTC_CHAT_OPENED", locale, surface: "btc_clean_chat" });
  }, [hydrated, locale]);

  const send = async (raw: string) => {
    const nextQuestion = raw.trim().replace(/\s+/g, " ").slice(0, 500);
    if (nextQuestion.length < 2 || busy) return;
    setBusy(true);
    const id = newBtcObservabilityTurnId();
    const pending: CleanTurn = { id, user: nextQuestion, assistant: null, topic: null, asOf: null, sources: [] };
    const before = turns.slice(-MAX_TURNS);
    setTurns([...before, pending]);
    setQuestion("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_RUNTIME_TIMEOUT_MS);
    try {
      const response = await fetch("/api/btc/clean-chat-v1", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          locale,
          question: nextQuestion,
          priorTurns: priorPayload(before),
          observability: (() => {
            const context = getBtcObservabilityContext();
            return context ? { ...context, chatTurnId: id } : undefined;
          })(),
        }),
      });
      const payload = await response.json() as Partial<BtcCleanChatResponse> & RuntimeFailurePayload;
      if (!response.ok || payload.ok !== true || typeof payload.answer !== "string") {
        throw new CleanChatRuntimeError(
          typeof payload.code === "string" ? payload.code : "MODEL_RUNTIME_FAILURE",
          payload.retryable === true,
        );
      }
      const completed: CleanTurn = {
        ...pending,
        assistant: payload.answer,
        topic: typeof payload.topic === "string" ? payload.topic : null,
        asOf: typeof payload.as_of === "string" ? payload.as_of : null,
        sources: Array.isArray(payload.sources) ? payload.sources : [],
        evidence: payload.evidence,
        semanticVisual: payload.semantic_visual ?? null,
      };
      setTurns((current) => current.map((turn) => turn.id === id ? completed : turn).slice(-MAX_TURNS));
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      const code = timedOut ? "MODEL_TIMEOUT" : error instanceof CleanChatRuntimeError ? error.code : "MODEL_RUNTIME_FAILURE";
      const retryable = timedOut || (error instanceof CleanChatRuntimeError && error.retryable);
      const fallback = btcCleanChatRuntimeFailureCopy(locale, code, retryable);
      setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, assistant: fallback, error: true } : turn).slice(-MAX_TURNS));
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!hydrated || initialSentRef.current || !initialQuestion.trim()) return;
    initialSentRef.current = true;
    const existing = readTurns(locale);
    const alreadyLast = existing[existing.length - 1]?.user === initialQuestion.trim();
    if (!alreadyLast) void send(initialQuestion);
  // The direct-entry question is intentionally consumed once per mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, initialQuestion, locale]);

  const clear = () => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKey(locale));
    setTurns([]);
    setQuestion("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(question);
  };

  const hasTurns = turns.length > 0;
  return <main className="cleanChatPage" lang={locale} data-clean-chat="btc-v1" data-session-local="true">
    <header className="cleanTopbar">
      <a href={`/crypto-astro/btc?lang=${locale}`} className="cleanBack">← BTC</a>
      <div className="cleanBrand"><span className="cleanSignal"/>BTC Cosmographer</div>
      <div className="cleanTopActions">
        {hasTurns && <button type="button" onClick={clear}>{ru ? "Новый чат" : "New chat"}</button>}
        <a
          href={`/support?lang=${locale}`}
          className="cleanSupportGlyph"
          onClick={() => recordBtcClientEvent({ eventType: "BTC_SUPPORT_GLYPH_CLICKED", locale, surface: "btc_clean_chat" })}
          data-clean-support-glyph="bitcoin"
          aria-label={ru ? "Поддержать BHRIGU в Bitcoin" : "Support BHRIGU with Bitcoin"}
          title={ru ? "Поддержать BHRIGU в Bitcoin" : "Support BHRIGU with Bitcoin"}
        ><span aria-hidden="true">₿</span></a>
        <a href={`/crypto-astro/btc/clean-chat?lang=${ru ? "en" : "ru"}`}>{ru ? "EN" : "RU"}</a>
      </div>
    </header>

    <section className="cleanChatShell">
      {!hasTurns && hydrated && <article className="cleanMessage cleanAssistant cleanWelcome">
        <div className="cleanRole">Cosmographer</div>
        <div className="cleanBubble">
          <p>{ru
            ? "Спросите о BTC, рыночных ожиданиях, эфемеридах или механике Bitcoin. Когда это помогает понять Bitcoin, Космограф может использовать контекст ETH, DeFi, стейблкоинов, ликвидности и ротации — не превращая диалог в общий крипто-чат."
            : "Ask about BTC, market expectations, ephemerides, or Bitcoin mechanics. When it helps explain Bitcoin, Cosmographer can use ETH, DeFi, stablecoin, liquidity, and rotation context without turning the dialogue into a general crypto chat."}</p>
        </div>
      </article>}

      {hasTurns && <section className="cleanThread" role="log" aria-live="polite" aria-label={ru ? "Диалог BTC" : "BTC dialogue"}>
        {turns.map((turn, index) => <div className="cleanExchange" key={turn.id}>
          <article className="cleanMessage cleanUser">
            <div className="cleanRole">{ru ? "Вы" : "You"}</div>
            <div className="cleanBubble"><p>{turn.user}</p><CopyAction locale={locale} text={turn.user} subject="user"/></div>
          </article>
          <AssistantMessage locale={locale} turn={turn} newest={index === turns.length - 1}/>
        </div>)}
        <div ref={endRef}/>
      </section>}

      {hydrated && <form className="cleanComposer" onSubmit={submit}>
        <label htmlFor="btc-clean-question" className="srOnly">{ru ? "Ваш вопрос" : "Your question"}</label>
        <textarea
          id="btc-clean-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (question.trim().length >= 2 && !busy) void send(question);
            }
          }}
          rows={2}
          minLength={2}
          maxLength={500}
          disabled={busy}
          placeholder={hasTurns
            ? (ru ? "Продолжите мысль…" : "Continue the thought…")
            : (ru ? "Что меняется в BTC прямо сейчас?" : "What is changing in BTC right now?")}
        />
        <button type="submit" disabled={busy || question.trim().length < 2} aria-label={ru ? "Отправить" : "Send"}>↑</button>
      </form>}
      <p className="cleanBoundary">{ru
        ? "Read-only evidence · без торговых сигналов · будущее не выдаётся за установленный факт"
        : "Read-only evidence · no trading signals · future outcomes are not presented as established facts"}</p>
    </section>

    <style jsx global>{`
      .cleanSemanticVisual{grid-template-columns:28px minmax(100px,1fr) minmax(56px,1.618fr) auto auto auto}.cleanVisualStateLabel{min-width:0;color:#dfe4e9;font-size:12px;line-height:1.2;white-space:nowrap}.cleanSemanticVisual[data-semantic-state="CONFIRMATION"] .cleanVisualState{background:#6aa8ff}.cleanSemanticVisual[data-semantic-state="DIVERGENCE"] .cleanVisualState{background:linear-gradient(90deg,#6aa8ff 0 43%,transparent 43% 57%,#6aa8ff 57%)}.cleanSemanticVisual[data-semantic-state="TEMPORAL"] .cleanVisualState{background:#8f7cf4}.cleanSemanticVisual[data-semantic-state="EXPECTATION"] .cleanVisualState{background:linear-gradient(90deg,#6aa8ff,#8f7cf4)}.cleanVisualIdentity>b,.cleanVisualIdentity>span,.cleanVisualMetrics small,.cleanVisualMetrics b,.cleanFreshness,.cleanAsOf,.cleanCopyAction,.cleanBoundary{font-size:12px}.cleanSourceList small{color:#aab2bd;font-size:12px}@media(max-width:680px){.cleanSemanticVisual{grid-template-columns:24px minmax(80px,1fr) minmax(50px,1fr) auto}.cleanVisualStateLabel{grid-column:2/5;grid-row:2}.cleanVisualMetrics{grid-column:2/5;grid-row:3}.cleanFreshness{grid-column:4;grid-row:1}}
      :root{color-scheme:dark}*{box-sizing:border-box}html,body,#__next{min-height:100%;margin:0}body{background:#07090d;color:#eef2f6;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.cleanChatPage{min-height:100vh;background:radial-gradient(circle at 50% -18%,rgba(219,179,94,.09),transparent 38%),#07090d}.cleanTopbar{height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding:0 clamp(18px,4vw,56px);border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;z-index:10;background:rgba(7,9,13,.88);backdrop-filter:blur(18px)}.cleanTopbar a,.cleanTopbar button{color:#aab2bd;text-decoration:none;background:none;border:0;font:inherit;cursor:pointer}.cleanBack{justify-self:start}.cleanBrand{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:650;letter-spacing:.04em}.cleanSignal{width:8px;height:8px;border-radius:50%;background:#d6b46a;box-shadow:0 0 16px rgba(214,180,106,.55)}.cleanTopActions{justify-self:end;display:flex;gap:12px;align-items:center;font-size:13px}.cleanSupportGlyph{width:26px;height:26px;display:grid;place-items:center;border:1px solid rgba(214,180,106,.16);border-radius:50%;color:#7f8791!important;font:600 14px/1 Georgia,serif;opacity:.76;transition:border-color .16s ease,color .16s ease,opacity .16s ease}.cleanSupportGlyph:hover,.cleanSupportGlyph:focus-visible{border-color:rgba(214,180,106,.42);color:#d6b46a!important;opacity:1;outline:none}.cleanChatShell{width:min(880px,calc(100% - 32px));min-height:calc(100vh - 64px);margin:0 auto;padding:clamp(28px,5vw,58px) 0 28px;display:flex;flex-direction:column}.cleanThread{display:flex;flex-direction:column;gap:34px;padding-bottom:28px}.cleanExchange{display:flex;flex-direction:column;gap:20px}.cleanMessage{display:grid;grid-template-columns:152px minmax(0,1fr);gap:18px;align-items:start}.cleanRole{padding-top:4px;color:#737d89;font-size:12px;letter-spacing:.05em;text-transform:uppercase}.cleanBubble{min-width:0}.cleanBubble p{margin:0;color:#dfe4e9;font-size:clamp(16px,1.5vw,18px);line-height:1.72;white-space:pre-wrap}.cleanUser .cleanBubble{justify-self:end;max-width:78%;padding:11px 15px;border-radius:17px 17px 4px 17px;background:#151920}.cleanUser .cleanBubble p{font-size:15px;line-height:1.55;color:#f2f4f6}.cleanAssistant .cleanBubble{padding-top:0}.cleanWelcome{margin:auto 0;padding:10vh 0 12vh}.cleanWelcome .cleanBubble p{font-size:clamp(20px,2.8vw,29px);line-height:1.5;color:#f1f3f5;letter-spacing:-.018em}.cleanExampleRow{display:flex;flex-wrap:wrap;gap:9px;margin-top:24px}.cleanExampleRow button{border:1px solid rgba(255,255,255,.11);background:#0d1117;color:#c6cdd5;border-radius:999px;padding:9px 13px;font:inherit;font-size:13px;cursor:pointer}.cleanExampleRow button:hover{border-color:rgba(214,180,106,.45);color:#f2e3bd}.cleanSources{margin-top:16px;border-top:1px solid rgba(255,255,255,.07);padding-top:11px}.cleanSources summary{cursor:pointer;color:#8f99a5;font-size:12px;list-style:none;width:max-content}.cleanSources summary::-webkit-details-marker{display:none}.cleanSources summary:after{content:" +"}.cleanSources[open] summary:after{content:" −"}.cleanSourceList{display:grid;gap:7px;margin-top:10px}.cleanSourceList a{display:flex;justify-content:space-between;gap:14px;color:#b9c1ca;text-decoration:none;font-size:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.045)}.cleanSourceList a:hover{color:#e6cf9b}.cleanSourceList small{color:#66717d;white-space:nowrap}.cleanAsOf{display:block;margin-top:10px;color:#565f69;font-size:10px}.cleanCopyAction{display:block;margin-top:7px;padding:6px 0;border:0;background:none;color:#68727d;font:inherit;font-size:10px;line-height:1.4;cursor:pointer}.cleanCopyAction:hover,.cleanCopyAction:focus-visible{color:#d6b46a;outline:none}.cleanCosmographerRole{display:flex;align-items:center;gap:7px}.cleanRoleGlyph.fieldAnchorGlyph,.cleanSemanticGlyph.fieldAnchorGlyph{position:relative;display:grid;place-items:center;flex:0 0 auto;width:22px;height:22px;border:1px solid rgba(214,180,106,.42);border-radius:50%;background:radial-gradient(circle,rgba(214,180,106,.08),transparent 68%)}.cleanRoleGlyph.fieldAnchorGlyph:after,.cleanSemanticGlyph.fieldAnchorGlyph:after{content:"";position:absolute;inset:-3px;border:1px solid rgba(214,180,106,.10);border-radius:50%}.cleanRoleGlyph.fieldAnchorGlyph b,.cleanSemanticGlyph.fieldAnchorGlyph b{font:700 12px/1 Georgia,serif;color:#d6b46a}.cleanSemanticVisual{margin-top:15px;min-height:38px;display:grid;grid-template-columns:28px minmax(100px,1fr) minmax(56px,1.618fr) auto auto;gap:10px;align-items:center;border-top:1px solid rgba(255,255,255,.065);border-bottom:1px solid rgba(255,255,255,.045);padding:9px 0;color:#8d97a3}.cleanSemanticGlyph.fieldAnchorGlyph{width:20px;height:20px}.cleanVisualIdentity{display:grid;gap:1px;min-width:0}.cleanVisualIdentity>b{color:#cfd5db;font-size:10px;letter-spacing:.08em}.cleanVisualIdentity>span{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cleanVisualState{height:1px;min-width:56px;background:#d6b46a}.cleanSemanticVisual[data-semantic-state="DIVERGENCE"] .cleanVisualState{background:linear-gradient(90deg,#a77268 0 43%,transparent 43% 57%,#a77268 57%)}.cleanSemanticVisual[data-semantic-state="LIMITED"] .cleanVisualState{background:repeating-linear-gradient(90deg,#6b747e 0 7px,transparent 7px 13px)}.cleanSemanticVisual[data-semantic-state="TEMPORAL"] .cleanVisualState{background:#718aa3}.cleanSemanticVisual[data-semantic-state="EXPECTATION"] .cleanVisualState{background:linear-gradient(90deg,#718aa3,#d6b46a)}.cleanVisualMetrics{display:flex;gap:12px}.cleanVisualMetrics>span{display:grid;gap:1px;white-space:nowrap}.cleanVisualMetrics small{font-size:8px;color:#646f7a}.cleanVisualMetrics b{font-size:11px;color:#b9c1ca;font-variant-numeric:tabular-nums}.cleanFreshness{font-size:8px;font-style:normal;letter-spacing:.06em}.cleanFreshness-fresh{color:#7f9b87}.cleanFreshness-limited,.cleanFreshness-unknown{color:#746f67}.cleanPendingStatus{min-height:28px;display:flex;align-items:center;gap:9px;color:#8f99a5;font-size:13px;line-height:1.5}.cleanThinkingDots{display:inline-flex;align-items:center;gap:4px}.cleanThinkingDots i{display:block;width:4px;height:4px;border-radius:50%;background:#87919d;animation:cleanPulse 1.15s infinite ease-in-out}.cleanThinkingDots i:nth-child(2){animation-delay:.12s}.cleanThinkingDots i:nth-child(3){animation-delay:.24s}@keyframes cleanPulse{0%,70%,100%{opacity:.25;transform:translateY(0)}35%{opacity:1;transform:translateY(-2px)}}.cleanError .cleanBubble p{color:#cbbda4}.cleanComposer{margin-top:auto;display:grid;grid-template-columns:minmax(0,1fr) 46px;gap:10px;align-items:end;padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(15,18,24,.94);box-shadow:0 18px 70px rgba(0,0,0,.25);position:sticky;bottom:14px}.cleanComposer textarea{width:100%;resize:none;border:0;outline:0;background:transparent;color:#f1f3f5;font:inherit;font-size:15px;line-height:1.5;padding:10px 9px;max-height:150px}.cleanComposer textarea::placeholder{color:#626c77}.cleanComposer button{width:40px;height:40px;border-radius:13px;border:0;background:#d6b46a;color:#16130d;font-size:22px;cursor:pointer}.cleanComposer button:disabled{opacity:.28;cursor:default}.cleanBoundary{text-align:center;color:#4f5862;font-size:10px;line-height:1.5;margin:16px 0 0}.srOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:680px){.cleanTopbar{height:58px;padding:0 15px;grid-template-columns:auto 1fr auto}.cleanBrand{justify-self:center;font-size:12px}.cleanTopActions button{display:none}.cleanChatShell{width:min(100% - 24px,880px);padding:24px 0 16px;min-height:calc(100vh - 58px)}.cleanMessage{grid-template-columns:1fr;gap:7px}.cleanRole{padding:0;font-size:10px}.cleanUser .cleanRole{text-align:right}.cleanUser .cleanBubble{max-width:88%}.cleanWelcome{padding:11vh 0 16vh}.cleanWelcome .cleanRole{display:none}.cleanWelcome .cleanBubble p{font-size:21px;line-height:1.48}.cleanThread{gap:28px}.cleanBubble p{font-size:16px;line-height:1.66}.cleanComposer{bottom:8px;border-radius:18px}.cleanSourceList a{display:grid;gap:3px}.cleanSourceList small{white-space:normal}.cleanSemanticVisual{grid-template-columns:24px minmax(80px,1fr) minmax(50px,1fr) auto;gap:8px}.cleanVisualMetrics{grid-column:2/5;gap:14px}.cleanFreshness{grid-column:4}.cleanCosmographerRole{justify-content:flex-start}.cleanCopyAction{min-height:36px;padding:8px 0}}
    `}</style>
  </main>;
}
