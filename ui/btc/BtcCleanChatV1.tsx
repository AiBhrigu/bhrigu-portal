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
    `}</style>
  </main>;
}
