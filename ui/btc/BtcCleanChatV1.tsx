import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  BtcCleanChatResponse,
  BtcCleanLocale,
  BtcCleanSource,
} from "../../lib/btc-clean-chat-v1";

const SESSION_VERSION = "btc-clean-chat-v1";
const MAX_TURNS = 16;

type CleanTurn = {
  id: string;
  user: string;
  assistant: string | null;
  topic: string | null;
  asOf: string | null;
  sources: BtcCleanSource[];
  evidence?: BtcCleanChatResponse["evidence"];
  error?: boolean;
};

type Props = {
  locale: BtcCleanLocale;
  initialQuestion?: string;
};

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

function priorPayload(turns: CleanTurn[]) {
  return turns.filter((turn) => turn.assistant).slice(-8).map((turn) => ({
    user: turn.user,
    assistant: turn.assistant ?? undefined,
    topic: turn.topic ?? undefined,
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

function AssistantMessage({ locale, turn, newest }: { locale: BtcCleanLocale; turn: CleanTurn; newest: boolean }) {
  const ru = locale === "ru";
  return <article className={`cleanMessage cleanAssistant${turn.error ? " cleanError" : ""}`} data-clean-assistant="true" data-topic={turn.topic ?? ""}>
    <div className="cleanRole">Cosmographer</div>
    <div className="cleanBubble">
      {turn.assistant === null
        ? <div className="cleanThinking" aria-label={ru ? "Чтение evidence" : "Reading evidence"}><i/><i/><i/></div>
        : <p>{turn.assistant}</p>}
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

  useEffect(() => {
    setTurns(readTurns(locale));
    setHydrated(true);
  }, [locale]);

  useEffect(() => {
    if (!hydrated) return;
    persistTurns(locale, turns);
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hydrated, locale, turns]);

  const send = async (raw: string) => {
    const nextQuestion = raw.trim().replace(/\s+/g, " ").slice(0, 500);
    if (nextQuestion.length < 2 || busy) return;
    setBusy(true);
    const id = makeId();
    const pending: CleanTurn = { id, user: nextQuestion, assistant: null, topic: null, asOf: null, sources: [] };
    const before = turns.slice(-MAX_TURNS);
    setTurns([...before, pending]);
    setQuestion("");

    try {
      const response = await fetch("/api/btc/clean-chat-v1", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        cache: "no-store",
        body: JSON.stringify({ locale, question: nextQuestion, priorTurns: priorPayload(before) }),
      });
      const payload = await response.json() as Partial<BtcCleanChatResponse> & { message?: string };
      if (!response.ok || payload.ok !== true || typeof payload.answer !== "string") {
        throw new Error(payload.message || "runtime unavailable");
      }
      const completed: CleanTurn = {
        ...pending,
        assistant: payload.answer,
        topic: typeof payload.topic === "string" ? payload.topic : null,
        asOf: typeof payload.as_of === "string" ? payload.as_of : null,
        sources: Array.isArray(payload.sources) ? payload.sources : [],
        evidence: payload.evidence,
      };
      setTurns((current) => current.map((turn) => turn.id === id ? completed : turn).slice(-MAX_TURNS));
    } catch {
      const fallback = ru
        ? "Текущий evidence runtime не ответил полностью. Я не подменяю live-данные сохранённым шаблоном; попробуйте повторить вопрос."
        : "The current evidence runtime did not complete. I will not replace live data with a stored template; please try the question again.";
      setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, assistant: fallback, error: true } : turn).slice(-MAX_TURNS));
    } finally {
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
  const examples = useMemo(() => ru
    ? ["Что меняется в BTC прямо сейчас?", "Что сейчас ожидает рынок?"]
    : ["What is changing in BTC right now?", "What is the market expecting?"], [ru]);

  return <main className="cleanChatPage" lang={locale} data-clean-chat="btc-v1" data-session-local="true">
    <header className="cleanTopbar">
      <a href={`/crypto-astro/btc?lang=${locale}`} className="cleanBack">← BTC</a>
      <div className="cleanBrand"><span className="cleanSignal"/>BTC Cosmographer</div>
      <div className="cleanTopActions">
        {hasTurns && <button type="button" onClick={clear}>{ru ? "Новый чат" : "New chat"}</button>}
        <a href={`/crypto-astro/btc/clean-chat?lang=${ru ? "en" : "ru"}`}>{ru ? "EN" : "RU"}</a>
      </div>
    </header>

    <section className="cleanChatShell">
      {!hasTurns && hydrated && <article className="cleanMessage cleanAssistant cleanWelcome">
        <div className="cleanRole">Cosmographer</div>
        <div className="cleanBubble">
          <p>{ru
            ? "Спросите меня о том, что меняется в BTC, почему это важно, что я отслеживаю дальше или что рынок закладывает в будущее. Я соберу ответ заново из принятого Snapshot, памяти изменений и нужных live-источников."
            : "Ask me what is changing in BTC, why it matters, what I am watching next, or what the market is pricing into the future. I will rebuild the answer from the accepted Snapshot, change memory, and the live evidence needed for your question."}</p>
          <div className="cleanExampleRow">
            {examples.map((item) => <button key={item} type="button" onClick={() => void send(item)} disabled={busy}>{item}</button>)}
          </div>
        </div>
      </article>}

      {hasTurns && <section className="cleanThread" role="log" aria-live="polite" aria-label={ru ? "Диалог BTC" : "BTC dialogue"}>
        {turns.map((turn, index) => <div className="cleanExchange" key={turn.id}>
          <article className="cleanMessage cleanUser">
            <div className="cleanRole">{ru ? "Вы" : "You"}</div>
            <div className="cleanBubble"><p>{turn.user}</p></div>
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
      :root{color-scheme:dark}*{box-sizing:border-box}html,body,#__next{min-height:100%;margin:0}body{background:#07090d;color:#eef2f6;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.cleanChatPage{min-height:100vh;background:radial-gradient(circle at 50% -18%,rgba(219,179,94,.09),transparent 38%),#07090d}.cleanTopbar{height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding:0 clamp(18px,4vw,56px);border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;z-index:10;background:rgba(7,9,13,.88);backdrop-filter:blur(18px)}.cleanTopbar a,.cleanTopbar button{color:#aab2bd;text-decoration:none;background:none;border:0;font:inherit;cursor:pointer}.cleanBack{justify-self:start}.cleanBrand{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:650;letter-spacing:.04em}.cleanSignal{width:8px;height:8px;border-radius:50%;background:#d6b46a;box-shadow:0 0 16px rgba(214,180,106,.55)}.cleanTopActions{justify-self:end;display:flex;gap:14px;align-items:center;font-size:13px}.cleanChatShell{width:min(880px,calc(100% - 32px));min-height:calc(100vh - 64px);margin:0 auto;padding:clamp(28px,5vw,58px) 0 28px;display:flex;flex-direction:column}.cleanThread{display:flex;flex-direction:column;gap:34px;padding-bottom:28px}.cleanExchange{display:flex;flex-direction:column;gap:20px}.cleanMessage{display:grid;grid-template-columns:112px minmax(0,1fr);gap:18px;align-items:start}.cleanRole{padding-top:4px;color:#737d89;font-size:12px;letter-spacing:.05em;text-transform:uppercase}.cleanBubble{min-width:0}.cleanBubble p{margin:0;color:#dfe4e9;font-size:clamp(16px,1.5vw,18px);line-height:1.72;white-space:pre-wrap}.cleanUser .cleanBubble{justify-self:end;max-width:78%;padding:11px 15px;border-radius:17px 17px 4px 17px;background:#151920}.cleanUser .cleanBubble p{font-size:15px;line-height:1.55;color:#f2f4f6}.cleanAssistant .cleanBubble{padding-top:0}.cleanWelcome{margin:auto 0;padding:10vh 0 12vh}.cleanWelcome .cleanBubble p{font-size:clamp(20px,2.8vw,29px);line-height:1.5;color:#f1f3f5;letter-spacing:-.018em}.cleanExampleRow{display:flex;flex-wrap:wrap;gap:9px;margin-top:24px}.cleanExampleRow button{border:1px solid rgba(255,255,255,.11);background:#0d1117;color:#c6cdd5;border-radius:999px;padding:9px 13px;font:inherit;font-size:13px;cursor:pointer}.cleanExampleRow button:hover{border-color:rgba(214,180,106,.45);color:#f2e3bd}.cleanSources{margin-top:16px;border-top:1px solid rgba(255,255,255,.07);padding-top:11px}.cleanSources summary{cursor:pointer;color:#8f99a5;font-size:12px;list-style:none;width:max-content}.cleanSources summary::-webkit-details-marker{display:none}.cleanSources summary:after{content:" +"}.cleanSources[open] summary:after{content:" −"}.cleanSourceList{display:grid;gap:7px;margin-top:10px}.cleanSourceList a{display:flex;justify-content:space-between;gap:14px;color:#b9c1ca;text-decoration:none;font-size:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.045)}.cleanSourceList a:hover{color:#e6cf9b}.cleanSourceList small{color:#66717d;white-space:nowrap}.cleanAsOf{display:block;margin-top:10px;color:#565f69;font-size:10px}.cleanThinking{height:28px;display:flex;align-items:center;gap:5px}.cleanThinking i{display:block;width:5px;height:5px;border-radius:50%;background:#87919d;animation:cleanPulse 1.15s infinite ease-in-out}.cleanThinking i:nth-child(2){animation-delay:.12s}.cleanThinking i:nth-child(3){animation-delay:.24s}@keyframes cleanPulse{0%,70%,100%{opacity:.25;transform:translateY(0)}35%{opacity:1;transform:translateY(-2px)}}.cleanError .cleanBubble p{color:#cbbda4}.cleanComposer{margin-top:auto;display:grid;grid-template-columns:minmax(0,1fr) 46px;gap:10px;align-items:end;padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(15,18,24,.94);box-shadow:0 18px 70px rgba(0,0,0,.25);position:sticky;bottom:14px}.cleanComposer textarea{width:100%;resize:none;border:0;outline:0;background:transparent;color:#f1f3f5;font:inherit;font-size:15px;line-height:1.5;padding:10px 9px;max-height:150px}.cleanComposer textarea::placeholder{color:#626c77}.cleanComposer button{width:40px;height:40px;border-radius:13px;border:0;background:#d6b46a;color:#16130d;font-size:22px;cursor:pointer}.cleanComposer button:disabled{opacity:.28;cursor:default}.cleanBoundary{text-align:center;color:#4f5862;font-size:10px;line-height:1.5;margin:16px 0 0}.srOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:680px){.cleanTopbar{height:58px;padding:0 15px;grid-template-columns:auto 1fr auto}.cleanBrand{justify-self:center;font-size:12px}.cleanTopActions button{display:none}.cleanChatShell{width:min(100% - 24px,880px);padding:24px 0 16px;min-height:calc(100vh - 58px)}.cleanMessage{grid-template-columns:1fr;gap:7px}.cleanRole{padding:0;font-size:10px}.cleanUser .cleanRole{text-align:right}.cleanUser .cleanBubble{max-width:88%}.cleanWelcome{padding:11vh 0 16vh}.cleanWelcome .cleanRole{display:none}.cleanWelcome .cleanBubble p{font-size:21px;line-height:1.48}.cleanThread{gap:28px}.cleanBubble p{font-size:16px;line-height:1.66}.cleanComposer{bottom:8px;border-radius:18px}.cleanSourceList a{display:grid;gap:3px}.cleanSourceList small{white-space:normal}}
    `}</style>
  </main>;
}
