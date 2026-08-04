import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";

const BTC_SESSION_KEY = "bhrigu:btc-cosmographer:session:v0_3";
const FREE_SESSION_START_KEY = "bhrigu:btc-free-corridor:start:v0_1";
const FREE_SESSION_DURATION_MS = 60 * 60 * 1000;

const COPY = {
  ru: {
    navigatorEyebrow: "Быстрый вход",
    navigatorTitle: "Что вы хотите понять о BTC?",
    navigatorNote: "Или напишите вопрос своими словами.",
    questions: [
      {
        label: "Ситуация сейчас",
        question: "Что происходит с BTC сейчас?",
        canonical: "Что происходит с рынком BTC сейчас?",
      },
      {
        label: "Что изменилось",
        question: "Что изменилось с прошлого проверенного снимка?",
        canonical: "Что изменилось с прошлого проверенного снимка?",
      },
      {
        label: "Где расхождение",
        question: "Какие сигналы сейчас расходятся и почему это важно?",
        canonical: "Что сейчас происходит с BTC и какие сигналы расходятся?",
      },
      {
        label: "Что дальше",
        question: "Что проверить дальше, чтобы подтвердить или пересмотреть вывод?",
        canonical: "Какие данные нужно отслеживать дальше, чтобы подтвердить или пересмотреть текущий вывод по BTC?",
      },
      {
        label: "Проверить источники",
        question: "Покажи источники и время обновления данных этого чтения.",
        canonical: "Какие источники использованы и где граница вывода?",
      },
    ],
    contractTitle: "Бесплатный разговор · 60 минут",
    contractBody: "Все продолжения в этой вкладке остаются бесплатными",
    contractRemaining: (minutes) => ` · осталось около ${minutes} мин.`,
    expiredEyebrow: "Бесплатная сессия завершена",
    expiredTitle: "Ответы остаются в этой вкладке",
    expiredBody: "История не сохраняется и не переносится. Пока эта вкладка открыта, ответы остаются видимыми. Можно начать новый бесплатный разговор или открыть текущий статус Access.",
    restart: "Начать новый бесплатный разговор",
    accessStatus: "Открыть статус Access",
    conditionsTitle: "Основание и граница вывода",
    observed: "Наблюдаем",
    boundary: "Граница",
    watchNext: "Дальше",
  },
  en: {
    navigatorEyebrow: "Quick entry",
    navigatorTitle: "What do you want to understand about BTC?",
    navigatorNote: "Or write the question in your own words.",
    questions: [
      {
        label: "Current situation",
        question: "What is happening with BTC now?",
        canonical: "What is happening with the BTC market now?",
      },
      {
        label: "What changed",
        question: "What changed since the previous verified snapshot?",
        canonical: "What changed since the previous verified snapshot?",
      },
      {
        label: "Where signals diverge",
        question: "Which signals diverge now, and why does it matter?",
        canonical: "What is happening with BTC now, and which signals diverge?",
      },
      {
        label: "What comes next",
        question: "What should be checked next to confirm or revise the read?",
        canonical: "Which data should be watched next to confirm or revise the current BTC read?",
      },
      {
        label: "Check sources",
        question: "Show the sources and update time for this read.",
        canonical: "Which sources were used, and where is the inference boundary?",
      },
    ],
    contractTitle: "Free conversation · 60 minutes",
    contractBody: "All follow-ups in this tab remain free",
    contractRemaining: (minutes) => ` · about ${minutes} min remaining`,
    expiredEyebrow: "Free session ended",
    expiredTitle: "Answers remain in this tab",
    expiredBody: "History is not saved or transferred. While this tab stays open, the answers remain visible. You can start a new free conversation or open the current Access status.",
    restart: "Start a new free conversation",
    accessStatus: "Open Access status",
    conditionsTitle: "Basis and boundary of the read",
    observed: "Observed",
    boundary: "Boundary",
    watchNext: "Watch next",
  },
};

const SUBJECT_LABELS = {
  ru: {
    general_btc_field: "текущей ситуации BTC",
    liquidity: "ликвидности BTC",
    market_structure: "структуры рынка BTC",
    change_memory: "изменений BTC",
    btc_gravity: "доли BTC на рынке",
    market_participation_rotation: "участия рынка",
    temporal_pressure: "временного контекста BTC",
    mars: "сопоставления Марса и BTC",
    jupiter: "сопоставления Юпитера и BTC",
    saturn: "сопоставления Сатурна и BTC",
    mercury: "сопоставления Меркурия и BTC",
    venus: "сопоставления Венеры и BTC",
    sun: "сопоставления Солнца и BTC",
    moon: "сопоставления Луны и BTC",
    planetary_aspects: "планетарного окна и BTC",
    halving: "халвинга Bitcoin",
    source_and_method: "источников и метода",
  },
  en: {
    general_btc_field: "the current BTC situation",
    liquidity: "BTC liquidity",
    market_structure: "BTC market structure",
    change_memory: "BTC changes",
    btc_gravity: "BTC market share",
    market_participation_rotation: "market participation",
    temporal_pressure: "the BTC time context",
    mars: "the Mars and BTC comparison",
    jupiter: "the Jupiter and BTC comparison",
    saturn: "the Saturn and BTC comparison",
    mercury: "the Mercury and BTC comparison",
    venus: "the Venus and BTC comparison",
    sun: "the Sun and BTC comparison",
    moon: "the Moon and BTC comparison",
    planetary_aspects: "the planetary window and BTC",
    halving: "Bitcoin halving",
    source_and_method: "the sources and method",
  },
};

const TECHNICAL_REPLACEMENTS = {
  ru: [
    ["btc_gravity_pct", "Доля BTC"],
    ["stablecoin_share_pct", "Доля стейблкоинов"],
    ["alt_breadth_24h_pct", "Ширина рынка за 24 часа"],
    ["Snapshot Delta", "изменения между проверенными снимками"],
    ["context fresh", "данные актуальны"],
    ["breadth", "ширина рынка"],
    ["Мембрана ликвидности", "Ликвидность"],
    ["Память изменений", "Изменения"],
    ["ведущего маршрута", "основного вывода"],
    ["поддерживающие модули", "дополнительные показатели"],
  ],
  en: [
    ["btc_gravity_pct", "BTC share"],
    ["stablecoin_share_pct", "Stablecoin share"],
    ["alt_breadth_24h_pct", "24-hour market breadth"],
    ["Snapshot Delta", "changes between verified snapshots"],
    ["context fresh", "data current"],
  ],
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[?!.]+$/g, "");
}

function subjectLabel(locale, subject) {
  const labels = SUBJECT_LABELS[locale] || SUBJECT_LABELS.ru;
  return labels[subject] || (locale === "en" ? "the current subject" : "текущего предмета");
}

function contextualQuestion(rawQuestion, subject, previousSubject, locale) {
  const normalized = normalize(rawQuestion);
  const active = subject || "general_btc_field";
  const label = subjectLabel(locale, active);

  if (locale === "en") {
    if (/what.*ask|which questions|what can you do/.test(normalized)) {
      return "Which questions can I ask about BTC?";
    }
    if (/show.*source|which.*source|update time|when.*updated|where.*data/.test(normalized)) {
      return "Which sources were used, and where is the inference boundary?";
    }
    if (/current.*price|price.*now|how much.*btc/.test(normalized)) {
      return "What is happening with the BTC market now?";
    }
    if (/which signals.*diverg|where.*diverg/.test(normalized) && /btc|bitcoin/.test(normalized)) {
      return "What is happening with BTC now, and which signals diverge?";
    }
    if (/what.*matters more/.test(normalized) && /liquidity/.test(normalized) && /structure/.test(normalized)) {
      return "Do liquidity and market structure confirm the current BTC state?";
    }
    if (/^why$|^why is that$|^why so$/.test(normalized)) {
      if (active === "liquidity") return "Why do the current BTC liquidity signals diverge?";
      if (active === "market_structure") return "Why is the current BTC market structure only partially confirmed?";
      if (active === "change_memory") return "Why do the BTC changes since the previous verified snapshot diverge?";
      if (["mars", "jupiter", "saturn", "mercury", "venus", "sun", "moon"].includes(active)) {
        return `Why does ${label} show a divergence?`;
      }
      return "Why do the current BTC signals diverge?";
    }
    if (/^what next$|^and what next$|^what should.*checked next$|^what would change.*read$/.test(normalized)) {
      if (active === "liquidity") return "Which liquidity data should be watched next to confirm or revise the current BTC read?";
      if (active === "market_structure") return "Which market-structure data should be watched next to confirm or revise the current BTC read?";
      if (active === "change_memory") return "What should be checked in the next verified snapshot to confirm or revise the current BTC read?";
      return `What should be watched next to confirm or revise the read about ${label}?`;
    }
    if (/which facts create.*diverg|what would resolve it/.test(normalized)) {
      return `Which facts create the divergence in ${label}, and what would resolve it?`;
    }
    if (/return to the previous|go back to the previous|back to the previous/.test(normalized) && previousSubject) {
      return `Return to ${subjectLabel(locale, previousSubject)}: what changed, and what matters now?`;
    }
    return rawQuestion;
  }

  if (/какой вопрос.*задать|что.*спросить|как.*спросить|какие вопросы|что ты умеешь/.test(normalized)) {
    return "Какие вопросы можно задать о BTC?";
  }
  if (/покажи.*источник|какие.*источник|время обновлен|когда обновлен|откуда.*данн/.test(normalized)) {
    return "Какие источники использованы и где граница вывода?";
  }
  if (/текущ.*цен|цена.*сейчас|сколько.*стоит/.test(normalized)) {
    return "Что происходит с рынком BTC сейчас?";
  }
  if (/какие сигналы.*расход|где.*расхожд/.test(normalized) && /btc|биткоин|биткойн/.test(normalized)) {
    return "Что сейчас происходит с BTC и какие сигналы расходятся?";
  }
  if (/что.*важнее/.test(normalized) && /ликвид/.test(normalized) && /структур/.test(normalized)) {
    return "Подтверждают ли ликвидность и структура рынка текущее состояние BTC?";
  }
  if (/^почему$|^а почему$|^почему это$/.test(normalized)) {
    if (active === "liquidity") return "Почему текущие сигналы ликвидности BTC расходятся?";
    if (active === "market_structure") return "Почему текущая структура рынка BTC подтверждена не полностью?";
    if (active === "change_memory") return "Почему изменения BTC с прошлого проверенного снимка расходятся?";
    if (["mars", "jupiter", "saturn", "mercury", "venus", "sun", "moon"].includes(active)) {
      return `Почему ${label} даёт расхождение?`;
    }
    return "Почему текущие сигналы BTC расходятся?";
  }
  if (/^а что дальше$|^что дальше$|^и что дальше$|^что проверить дальше$|^что изменит.*вывод$/.test(normalized)) {
    if (active === "liquidity") return "Какие данные ликвидности нужно отслеживать дальше, чтобы подтвердить или пересмотреть текущий вывод по BTC?";
    if (active === "market_structure") return "Какие данные структуры рынка нужно отслеживать дальше, чтобы подтвердить или пересмотреть текущий вывод по BTC?";
    if (active === "change_memory") return "Что проверить в следующем подтверждённом снимке, чтобы подтвердить или пересмотреть текущий вывод по BTC?";
    return `Что отслеживать дальше, чтобы подтвердить или пересмотреть вывод по ${label}?`;
  }
  if (/какие факты создают расхождение|что его снимет/.test(normalized)) {
    return `Какие факты создают расхождение в ${label} и что его снимет?`;
  }
  if (/вернись к предыдущ|вернуться к предыдущ|снова к предыдущ/.test(normalized) && previousSubject) {
    return `Вернись к ${subjectLabel(locale, previousSubject)}: что изменилось и что важно сейчас?`;
  }
  return rawQuestion;
}

function replaceTechnicalLanguage(root, locale) {
  if (!root) return;
  const replacements = TECHNICAL_REPLACEMENTS[locale] || TECHNICAL_REPLACEMENTS.ru;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    let next = node.nodeValue || "";
    replacements.forEach(([source, target]) => {
      next = next.replaceAll(source, target);
    });
    if (next !== node.nodeValue) node.nodeValue = next;
  });
}

function latestSubjects() {
  const turns = Array.from(document.querySelectorAll("article[data-route-subject]"));
  const subjects = turns
    .map((turn) => turn.getAttribute("data-route-subject"))
    .filter(Boolean);
  const active = subjects.at(-1) || "general_btc_field";
  const previous = [...subjects].reverse().find((value) => value !== active) || null;
  return { active, previous };
}

function ensurePortalRoot(id, parent, beforeNode = null) {
  if (!parent) return null;
  let root = document.getElementById(id);
  if (!root) {
    root = document.createElement("div");
    root.id = id;
    parent.insertBefore(root, beforeNode);
  }
  return root;
}

function sectionPayload(node) {
  if (!node) return "";
  const clone = node.cloneNode(true);
  clone.querySelectorAll("strong, h3, summary").forEach((label) => label.remove());
  const listItems = Array.from(clone.querySelectorAll("li"))
    .map((item) => String(item.textContent || "").trim())
    .filter(Boolean);
  if (listItems.length) return listItems.join(" · ");
  return String(clone.textContent || "").trim();
}

function answerBoundaryRows(turn, copy) {
  const evidence = sectionPayload(turn.querySelector("[data-answer-section='evidence']"));
  const limit = sectionPayload(turn.querySelector("[data-answer-section='limit']"));
  const change = sectionPayload(turn.querySelector("[data-answer-section='change']"));
  return [
    [copy.observed, evidence, "evidence"],
    [copy.boundary, limit, "limit"],
    [copy.watchNext, change, "change"],
  ].filter(([, value]) => Boolean(value));
}

function freeSessionTimingNow() {
  if (typeof window === "undefined") {
    return { start: 0, remainingMs: FREE_SESSION_DURATION_MS, expired: false };
  }
  const start = Number(window.sessionStorage.getItem(FREE_SESSION_START_KEY) || 0);
  if (!Number.isFinite(start) || start <= 0) {
    return { start: 0, remainingMs: FREE_SESSION_DURATION_MS, expired: false };
  }
  const remainingMs = FREE_SESSION_DURATION_MS - (Date.now() - start);
  return {
    start,
    remainingMs: Math.max(0, remainingMs),
    expired: remainingMs <= 0,
  };
}

function QuestionNavigator({ compact, locale, onQuestion }) {
  const copy = COPY[locale];
  const titleId = compact ? "btc-live-public-navigator-title" : "btc-entry-public-navigator-title";
  return <section className={`btcPublicNavigator${compact ? " btcPublicNavigatorCompact" : ""}`} aria-labelledby={titleId} data-public-locale={locale}>
    <p className="btcPublicEyebrow">{copy.navigatorEyebrow}</p>
    <h2 id={titleId}>{copy.navigatorTitle}</h2>
    <div className="btcPublicQuestionGrid">
      {copy.questions.map((item) => <button key={item.label} type="button" onClick={() => onQuestion(item.canonical)}>
        <span>{item.label}</span>
        <small>{item.question}</small>
      </button>)}
    </div>
    <p className="btcPublicNavigatorNote">{copy.navigatorNote}</p>
  </section>;
}

function FreeContract({ locale, remainingMs, expired, onRestart, onAccessStatus }) {
  const copy = COPY[locale];
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
  if (expired) return <section className="btcFreeGate" role="status" data-continuity-boundary="tab-local-only" data-public-locale={locale}>
    <p className="btcPublicEyebrow">{copy.expiredEyebrow}</p>
    <h2>{copy.expiredTitle}</h2>
    <p>{copy.expiredBody}</p>
    <div className="btcFreeGateActions">
      <button type="button" onClick={onRestart}>{copy.restart}</button>
      <button type="button" className="btcFreeGateSecondary" data-access-status-action="true" onClick={onAccessStatus}>{copy.accessStatus}</button>
    </div>
  </section>;

  return <p className="btcFreeContract" data-free-session-contract="60-minutes" data-public-locale={locale}>
    <strong>{copy.contractTitle}</strong>
    <span>{copy.contractBody}{remainingMs < FREE_SESSION_DURATION_MS ? copy.contractRemaining(remainingMinutes) : ""}</span>
  </p>;
}

export default function BtcFreeCorridorSurfaceAdapter() {
  const router = useRouter();
  const pathname = String(router?.asPath || router?.pathname || "").split("?")[0].split("#")[0];
  const active = pathname === "/crypto-astro/btc" || pathname === "/crypto-astro/btc/live";
  const locale = String(router?.query?.lang || "ru") === "en" ? "en" : "ru";
  const [entryRoot, setEntryRoot] = useState(null);
  const [liveRoot, setLiveRoot] = useState(null);
  const [contractRoot, setContractRoot] = useState(null);
  const [remainingMs, setRemainingMs] = useState(FREE_SESSION_DURATION_MS);
  const [expired, setExpired] = useState(false);
  const [subject, setSubject] = useState("general_btc_field");
  const [previousSubject, setPreviousSubject] = useState(null);

  const liveHref = useMemo(() => `/crypto-astro/btc/live?lang=${locale}`, [locale]);

  const applyExactBoundary = () => {
    const timing = freeSessionTimingNow();
    if (!timing.expired) return false;
    setRemainingMs(0);
    setExpired(true);
    window.requestAnimationFrame(() => {
      document.querySelector(".btcFreeGate")?.scrollIntoView({ block: "center" });
    });
    return true;
  };

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;

    const sync = () => {
      const entryMain = document.querySelector("main[data-btc-static-proof='true']");
      if (entryMain) {
        const anchor = entryMain.querySelector(".snapshotTruthStrip")?.nextSibling || entryMain.firstChild;
        setEntryRoot(ensurePortalRoot("btc-public-question-navigator-root", entryMain, anchor));
      }

      const liveShell = document.querySelector(".liveDialogueShell");
      const composer = liveShell?.querySelector(".liveComposer") || null;
      const conversation = Boolean(liveShell?.querySelector(".liveThread"));
      if (liveShell && composer && !conversation) {
        setLiveRoot(ensurePortalRoot("btc-live-question-navigator-root", liveShell, composer));
      } else {
        setLiveRoot(null);
      }

      const sessionLine = liveShell?.querySelector(".liveSessionLine") || null;
      if (liveShell && sessionLine) {
        setContractRoot(ensurePortalRoot("btc-free-contract-root", liveShell, sessionLine.nextSibling));
      }

      const subjects = latestSubjects();
      setSubject(subjects.active);
      setPreviousSubject(subjects.previous);

      const latestTurn = Array.from(document.querySelectorAll("article[data-route-subject]")).at(-1);
      if (latestTurn) {
        replaceTechnicalLanguage(latestTurn, locale);
        latestTurn.querySelectorAll("details.answerSource, details.answerSourceHistory").forEach((details) => {
          details.removeAttribute("open");
        });

        const body = latestTurn.querySelector(".turnBody");
        const answerLead = latestTurn.querySelector(".answerLead");
        if (answerLead) {
          answerLead.classList.add("btcPublicConclusion");
          answerLead.setAttribute("data-public-first-conclusion", "answer-payload");
          answerLead.setAttribute("data-public-conclusion-source", "answer-direct");
          answerLead.setAttribute("data-public-answer-language", locale);
        }

        const nextStep = latestTurn.querySelector(".answerNextStep");
        if (body && !body.querySelector(".btcPublicConditions")) {
          const rows = answerBoundaryRows(latestTurn, COPY[locale]);
          if (rows.length) {
            const section = document.createElement("section");
            section.className = "btcPublicConditions";
            section.setAttribute("data-public-conditions-bound", "answer-payload");
            section.setAttribute("data-public-condition-semantics", "neutral-boundary");
            section.setAttribute("data-public-answer-language", locale);
            const heading = document.createElement("h3");
            heading.textContent = COPY[locale].conditionsTitle;
            section.appendChild(heading);
            rows.forEach(([label, value, source]) => {
              const row = document.createElement("p");
              row.setAttribute("data-condition-source", source);
              row.setAttribute("data-condition-role", source === "evidence" ? "observed" : source === "limit" ? "boundary" : "watch-next");
              const strong = document.createElement("strong");
              strong.textContent = label;
              const span = document.createElement("span");
              span.textContent = value;
              row.append(strong, span);
              section.appendChild(row);
            });
            if (nextStep) nextStep.before(section);
            else body.appendChild(section);
          }
        }

        if (nextStep && !nextStep.dataset.publicActionBound) {
          nextStep.dataset.publicActionBound = "true";
          nextStep.setAttribute("role", "button");
          nextStep.setAttribute("tabindex", "0");
          const execute = () => {
            if (applyExactBoundary()) return;
            const composerNode = document.querySelector("form.liveComposer");
            const textarea = composerNode?.querySelector("textarea[name='q']");
            const proposed = nextStep.querySelector("strong")?.textContent || "";
            if (!composerNode || !textarea || !proposed) return;
            textarea.value = contextualQuestion(proposed, subjects.active, subjects.previous, locale);
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            composerNode.requestSubmit();
          };
          nextStep.addEventListener("click", execute);
          nextStep.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              execute();
            }
          });
        }
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [active, pathname, expired, locale]);

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;

    let boundaryTimer = 0;
    const tick = () => {
      window.clearTimeout(boundaryTimer);
      const sessionRaw = window.sessionStorage.getItem(BTC_SESSION_KEY);
      const queryHasQuestion = new URLSearchParams(window.location.search).has("q");
      const conversation = Boolean(sessionRaw) || queryHasQuestion || Boolean(document.querySelector(".liveThread"));
      let start = Number(window.sessionStorage.getItem(FREE_SESSION_START_KEY) || 0);
      if (conversation && (!Number.isFinite(start) || start <= 0)) {
        start = Date.now();
        window.sessionStorage.setItem(FREE_SESSION_START_KEY, String(start));
      }
      if (!conversation || !start) {
        setRemainingMs(FREE_SESSION_DURATION_MS);
        setExpired(false);
        return;
      }
      const timing = freeSessionTimingNow();
      setRemainingMs(timing.remainingMs);
      setExpired(timing.expired);
      if (!timing.expired) {
        boundaryTimer = window.setTimeout(tick, Math.max(1, timing.remainingMs + 1));
      }
    };

    tick();
    const displayTimer = window.setInterval(tick, 15000);
    return () => {
      window.clearInterval(displayTimer);
      window.clearTimeout(boundaryTimer);
    };
  }, [active, pathname]);

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches("form.liveComposer")) return;
      if (applyExactBoundary()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const textarea = form.querySelector("textarea[name='q']");
      if (!textarea) return;
      const rewritten = contextualQuestion(textarea.value, subject, previousSubject, locale);
      if (rewritten !== textarea.value) {
        textarea.value = rewritten;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [active, locale, previousSubject, subject]);

  if (!active || typeof document === "undefined") return null;

  const openQuestion = (question) => {
    if (applyExactBoundary()) return;
    window.location.assign(`${liveHref}&q=${encodeURIComponent(question)}`);
  };

  const restart = () => {
    window.sessionStorage.removeItem(BTC_SESSION_KEY);
    window.sessionStorage.removeItem(FREE_SESSION_START_KEY);
    window.location.assign(liveHref);
  };

  const openAccessStatus = () => {
    window.location.assign(`/access?lang=${locale}&intent=btc-continuity-status`);
  };

  return <>
    {entryRoot && createPortal(<QuestionNavigator locale={locale} onQuestion={openQuestion}/>, entryRoot)}
    {liveRoot && createPortal(<QuestionNavigator compact locale={locale} onQuestion={openQuestion}/>, liveRoot)}
    {contractRoot && createPortal(<FreeContract
      locale={locale}
      remainingMs={remainingMs}
      expired={expired}
      onRestart={restart}
      onAccessStatus={openAccessStatus}
    />, contractRoot)}
    <style jsx global>{`
      .btcPublicNavigator{display:grid;gap:18px;padding:clamp(34px,5vw,64px) 0;border-bottom:1px solid var(--bl)}
      .btcPublicNavigatorCompact{padding:20px 0 28px}
      .btcPublicEyebrow{margin:0;color:var(--b);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      .btcPublicNavigator h2,.btcFreeGate h2{max-width:760px;margin:0;font-size:clamp(30px,4.4vw,52px);line-height:1.03;letter-spacing:-.04em}
      .btcPublicQuestionGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
      .btcPublicQuestionGrid button{display:grid;align-content:space-between;gap:18px;min-height:150px;width:100%;padding:18px;border:1px solid rgba(106,168,255,.24);border-radius:16px;background:linear-gradient(145deg,rgba(9,19,33,.86),rgba(5,10,18,.92));color:var(--t);text-align:left}
      .btcPublicQuestionGrid button:hover,.btcPublicQuestionGrid button:focus-visible{border-color:rgba(106,168,255,.62);transform:translateY(-1px)}
      .btcPublicQuestionGrid span{font-size:16px;font-weight:760}
      .btcPublicQuestionGrid small{color:var(--t2);font-size:12px;line-height:1.5}
      .btcPublicNavigatorNote{margin:0;color:var(--m);font-size:13px}
      .btcFreeContract{display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px 18px;margin:0 0 18px;padding:11px 14px;border:1px solid rgba(106,168,255,.16);border-radius:12px;background:rgba(106,168,255,.035);color:var(--t2);font-size:11px;line-height:1.45}
      .btcFreeContract strong{color:var(--t)}
      .answerLead.btcPublicConclusion{margin:18px 0 0;padding:18px 20px;border-left:3px solid var(--b);background:rgba(210,164,95,.07);color:var(--t);font-size:clamp(19px,2.2vw,24px);font-weight:650;line-height:1.48}
      .btcPublicConditions{display:grid;gap:8px;margin-top:18px;padding:16px;border:1px solid rgba(106,168,255,.18);border-radius:14px;background:rgba(5,13,23,.58)}
      .btcPublicConditions h3{margin:0 0 4px;font-size:13px;letter-spacing:.04em;text-transform:uppercase}
      .btcPublicConditions p{display:grid;grid-template-columns:92px 1fr;gap:10px;margin:0;color:var(--t2);font-size:13px;line-height:1.5}
      .btcPublicConditions strong{color:var(--b)}
      .answerNextStep[role='button']{cursor:pointer;transition:border-color .16s ease,background .16s ease}
      .answerNextStep[role='button']:hover,.answerNextStep[role='button']:focus-visible{border-color:rgba(143,124,244,.68);background:rgba(143,124,244,.11)}
      .answerSource .answerAuthority,.answerSourceHistory .answerAuthority,[data-evidence-levels],[data-canonical-bridge-result],.answerEvidenceMeta{display:none!important}
      .btcFreeGate{display:grid;gap:14px;margin:8px 0 24px;padding:22px;border:1px solid rgba(210,164,95,.4);border-radius:18px;background:linear-gradient(145deg,rgba(210,164,95,.09),rgba(5,10,18,.96))}
      .btcFreeGate>p:not(.btcPublicEyebrow){max-width:720px;margin:0;color:var(--t2);line-height:1.6}
      .btcFreeGateActions{display:flex;flex-wrap:wrap;gap:10px}
      .btcFreeGateActions button{min-height:46px}
      .btcFreeGateSecondary{border-color:rgba(106,168,255,.42);background:rgba(106,168,255,.08)}
      @media(max-width:1080px){.btcPublicQuestionGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.btcPublicQuestionGrid button:last-child{grid-column:1/-1}}
      @media(max-width:680px){.btcPublicNavigator{gap:14px;padding:26px 0}.btcPublicNavigator h2{font-size:32px}.btcPublicQuestionGrid{grid-template-columns:1fr;gap:8px}.btcPublicQuestionGrid button,.btcPublicQuestionGrid button:last-child{grid-column:auto;min-height:0;padding:15px}.btcPublicQuestionGrid button{gap:7px}.btcPublicQuestionGrid span{font-size:15px}.btcFreeContract{display:grid}.answerLead.btcPublicConclusion{padding:14px;font-size:18px}.btcPublicConditions p{grid-template-columns:84px 1fr}.btcFreeGateActions{display:grid}.btcFreeGateActions button{width:100%}}
    `}</style>
  </>;
}
