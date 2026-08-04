import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";

const BTC_SESSION_KEY = "bhrigu:btc-cosmographer:session:v0_3";
const FREE_SESSION_START_KEY = "bhrigu:btc-free-corridor:start:v0_1";
const FREE_SESSION_DURATION_MS = 60 * 60 * 1000;

const QUESTIONS = [
  {
    label: "Ситуация сейчас",
    question: "Что происходит с BTC сейчас?",
  },
  {
    label: "Что изменилось",
    question: "Что изменилось с прошлого проверенного снимка?",
  },
  {
    label: "Где расхождение",
    question: "Какие сигналы сейчас расходятся и почему это важно?",
  },
  {
    label: "Что дальше",
    question: "Что должно измениться, чтобы текущий вывод усилился или отменился?",
  },
  {
    label: "Проверить источники",
    question: "Покажи источники и время обновления данных этого чтения.",
  },
];

const SUBJECT_LABELS = {
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
};

const PUBLIC_CONCLUSIONS = {
  liquidity: "Ликвидность сейчас слабее рыночной структуры: общий рынок расширяется, но денежный резерв не подтверждает это движение полностью.",
  market_structure: "Структура рынка BTC сейчас усиливается, но ликвидность пока не подтверждает движение полностью.",
  change_memory: "С прошлого проверенного снимка доля BTC выросла, доля стейблкоинов снизилась, а участие рынка расширилось.",
  general_btc_field: "Поле BTC сейчас смешанное: структура усиливается, но ликвидность и память изменений не дают полного подтверждения.",
  mars: "Состояние BTC и окно Марса сейчас расходятся; это сопоставление не доказывает причинное влияние.",
  jupiter: "Состояние BTC и окно Юпитера сопоставлены как независимые слои; совпадение не является доказательством причинности.",
  halving: "Халвинг определяется высотой блока и меняет темп эмиссии, но сам по себе не задаёт направление цены.",
};

const PUBLIC_CONDITIONS = {
  liquidity: [
    ["Усилит", "рост денежного резерва и активности вместе с расширением рынка"],
    ["Ослабит", "дальнейшее снижение ликвидности при сохранении текущей структуры"],
    ["Отменит", "разворот структуры рынка одновременно с ухудшением ликвидности"],
  ],
  market_structure: [
    ["Усилит", "сохранение расширения рынка при улучшении ликвидности"],
    ["Ослабит", "рост структуры без подтверждения денежным резервом и участием"],
    ["Отменит", "смена рыночного режима и разворот принятых структурных показателей"],
  ],
  change_memory: [
    ["Усилит", "следующий снимок подтвердит текущие изменения в том же направлении"],
    ["Ослабит", "часть изменений остановится или вернётся к прошлой контрольной точке"],
    ["Отменит", "следующий проверенный снимок покажет противоположный переход"],
  ],
  general_btc_field: [
    ["Усилит", "структура, ликвидность и участие начнут подтверждать один вывод"],
    ["Ослабит", "расхождение между ведущими показателями сохранится"],
    ["Отменит", "принятый рыночный режим изменится в следующем проверенном снимке"],
  ],
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[?!.]+$/g, "");
}

function subjectLabel(subject) {
  return SUBJECT_LABELS[subject] || "текущего предмета";
}

function contextualQuestion(rawQuestion, subject, previousSubject) {
  const normalized = normalize(rawQuestion);
  const active = subject || "general_btc_field";
  const label = subjectLabel(active);

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

  if (/^а что дальше$|^что дальше$|^и что дальше$|^что изменит.*вывод$/.test(normalized)) {
    if (active === "liquidity") return "Какие изменения ликвидности усилят, ослабят или отменят текущий вывод по BTC?";
    if (active === "market_structure") return "Какие изменения структуры рынка усилят, ослабят или отменят текущий вывод по BTC?";
    if (active === "change_memory") return "Что должно измениться в следующем проверенном снимке, чтобы текущий вывод по BTC усилился или отменился?";
    return `Что должно измениться, чтобы вывод по ${label} усилился или отменился?`;
  }

  if (/какие факты создают расхождение|что его снимет/.test(normalized)) {
    return `Какие факты создают расхождение в ${label} и что его снимет?`;
  }

  if (/вернись к предыдущ|вернуться к предыдущ|снова к предыдущ/.test(normalized) && previousSubject) {
    return `Вернись к ${subjectLabel(previousSubject)}: что изменилось и что важно сейчас?`;
  }

  return rawQuestion;
}

function replaceTechnicalLanguage(root) {
  if (!root) return;
  const replacements = [
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
  ];
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

function QuestionNavigator({ compact, onQuestion }) {
  return <section className={`btcPublicNavigator${compact ? " btcPublicNavigatorCompact" : ""}`} aria-labelledby="btc-public-navigator-title">
    <p className="btcPublicEyebrow">Быстрый вход</p>
    <h2 id="btc-public-navigator-title">Что вы хотите понять о BTC?</h2>
    <div className="btcPublicQuestionGrid">
      {QUESTIONS.map((item) => <button key={item.label} type="button" onClick={() => onQuestion(item.question)}>
        <span>{item.label}</span>
        <small>{item.question}</small>
      </button>)}
    </div>
    <p className="btcPublicNavigatorNote">Или напишите вопрос своими словами.</p>
  </section>;
}

function FreeContract({ remainingMs, expired, onRestart, onContinue }) {
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
  if (expired) return <section className="btcFreeGate" role="status">
    <p className="btcPublicEyebrow">Бесплатная сессия завершена</p>
    <h2>Ответы остаются доступны</h2>
    <p>Продолжение этого контура требует сохранённой истории. Можно начать новый бесплатный разговор или перейти к сохранению и продолжению.</p>
    <div className="btcFreeGateActions">
      <button type="button" onClick={onRestart}>Начать новый бесплатный разговор</button>
      <button type="button" className="btcFreeGateSecondary" onClick={onContinue}>Сохранить и продолжить</button>
    </div>
  </section>;

  return <p className="btcFreeContract" data-free-session-contract="60-minutes">
    <strong>Бесплатный разговор · 60 минут</strong>
    <span>Все продолжения в этой вкладке остаются бесплатными{remainingMs < FREE_SESSION_DURATION_MS ? ` · осталось около ${remainingMinutes} мин.` : ""}</span>
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
  const [hasConversation, setHasConversation] = useState(false);
  const [remainingMs, setRemainingMs] = useState(FREE_SESSION_DURATION_MS);
  const [expired, setExpired] = useState(false);
  const [subject, setSubject] = useState("general_btc_field");
  const [previousSubject, setPreviousSubject] = useState(null);

  const liveHref = useMemo(() => `/crypto-astro/btc/live?lang=${locale}`, [locale]);

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
      setHasConversation(conversation);
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
        replaceTechnicalLanguage(latestTurn);
        latestTurn.querySelectorAll("details.answerSource, details.answerSourceHistory").forEach((details) => {
          details.removeAttribute("open");
        });

        const body = latestTurn.querySelector(".turnBody");
        const answerLead = latestTurn.querySelector(".answerLead");
        if (body && answerLead && !body.querySelector(".btcPublicConclusion")) {
          const conclusion = document.createElement("p");
          conclusion.className = "btcPublicConclusion";
          conclusion.setAttribute("data-public-first-conclusion", "true");
          conclusion.textContent = PUBLIC_CONCLUSIONS[subjects.active] || answerLead.textContent || "";
          answerLead.before(conclusion);
          answerLead.classList.add("btcPublicExplanation");
        }

        const conditions = PUBLIC_CONDITIONS[subjects.active];
        const nextStep = latestTurn.querySelector(".answerNextStep");
        if (body && conditions && !body.querySelector(".btcPublicConditions")) {
          const section = document.createElement("section");
          section.className = "btcPublicConditions";
          section.innerHTML = `<h3>Что изменит вывод</h3>${conditions.map(([label, value]) => `<p><strong>${label}</strong><span>${value}</span></p>`).join("")}`;
          if (nextStep) nextStep.before(section);
          else body.appendChild(section);
        }

        if (nextStep && !nextStep.dataset.publicActionBound) {
          nextStep.dataset.publicActionBound = "true";
          nextStep.setAttribute("role", "button");
          nextStep.setAttribute("tabindex", "0");
          const execute = () => {
            if (expired) return;
            const composerNode = document.querySelector("form.liveComposer");
            const textarea = composerNode?.querySelector("textarea[name='q']");
            const proposed = nextStep.querySelector("strong")?.textContent || "";
            if (!composerNode || !textarea || !proposed) return;
            textarea.value = contextualQuestion(proposed, subjects.active, subjects.previous);
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
  }, [active, pathname, expired]);

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;

    const tick = () => {
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
      const remaining = FREE_SESSION_DURATION_MS - (Date.now() - start);
      setRemainingMs(Math.max(0, remaining));
      setExpired(remaining <= 0);
    };

    tick();
    const timer = window.setInterval(tick, 15000);
    return () => window.clearInterval(timer);
  }, [active, pathname]);

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches("form.liveComposer")) return;
      if (expired) {
        event.preventDefault();
        setExpired(true);
        document.querySelector(".btcFreeGate")?.scrollIntoView({ block: "center" });
        return;
      }
      const textarea = form.querySelector("textarea[name='q']");
      if (!textarea) return;
      const rewritten = contextualQuestion(textarea.value, subject, previousSubject);
      if (rewritten !== textarea.value) {
        textarea.value = rewritten;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [active, expired, previousSubject, subject]);

  if (!active || typeof document === "undefined") return null;

  const openQuestion = (question) => {
    if (expired) return;
    window.location.assign(`${liveHref}&q=${encodeURIComponent(question)}`);
  };

  const restart = () => {
    window.sessionStorage.removeItem(BTC_SESSION_KEY);
    window.sessionStorage.removeItem(FREE_SESSION_START_KEY);
    window.location.assign(liveHref);
  };

  const continuePaid = () => {
    window.location.assign(`/access?lang=${locale}&intent=btc-continuity`);
  };

  return <>
    {entryRoot && createPortal(<QuestionNavigator onQuestion={openQuestion}/>, entryRoot)}
    {liveRoot && createPortal(<QuestionNavigator compact onQuestion={openQuestion}/>, liveRoot)}
    {contractRoot && createPortal(<FreeContract
      remainingMs={remainingMs}
      expired={expired}
      onRestart={restart}
      onContinue={continuePaid}
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
      .btcPublicConclusion{margin:18px 0 0;padding:18px 20px;border-left:3px solid var(--b);background:rgba(210,164,95,.07);color:var(--t);font-size:clamp(19px,2.2vw,24px);font-weight:650;line-height:1.48}
      .btcPublicExplanation{margin-top:12px!important;padding:0!important;border:0!important;background:transparent!important;color:var(--t2)!important;font-size:14px!important}
      .btcPublicConditions{display:grid;gap:8px;margin-top:18px;padding:16px;border:1px solid rgba(106,168,255,.18);border-radius:14px;background:rgba(5,13,23,.58)}
      .btcPublicConditions h3{margin:0 0 4px;font-size:13px;letter-spacing:.04em;text-transform:uppercase}
      .btcPublicConditions p{display:grid;grid-template-columns:72px 1fr;gap:10px;margin:0;color:var(--t2);font-size:13px;line-height:1.5}
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
      @media(max-width:680px){.btcPublicNavigator{gap:14px;padding:26px 0}.btcPublicNavigator h2{font-size:32px}.btcPublicQuestionGrid{grid-template-columns:1fr;gap:8px}.btcPublicQuestionGrid button,.btcPublicQuestionGrid button:last-child{grid-column:auto;min-height:0;padding:15px}.btcPublicQuestionGrid button{gap:7px}.btcPublicQuestionGrid span{font-size:15px}.btcFreeContract{display:grid}.btcPublicConclusion{padding:14px;font-size:18px}.btcPublicConditions p{grid-template-columns:64px 1fr}.btcFreeGateActions{display:grid}.btcFreeGateActions button{width:100%}}
    `}</style>
  </>;
}
