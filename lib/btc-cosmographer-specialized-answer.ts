import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";
import type { BtcPublicLocale } from "./btc-public-language-contract";

const q = (route: BtcCosmographerRoute) => route.normalized_question.toLowerCase();
const ru = (locale: BtcPublicLocale) => locale === "ru";

export function boundedClarification(
  locale: BtcPublicLocale,
  headline: string,
  direct: string,
  boundary: string,
): BtcCosmographerAnswerProjection {
  return {
    answer_state: "LIMITED",
    answer_mode: "CLARIFICATION",
    headline,
    direct_answer: direct,
    sections: [{ id: "supported_boundary", label: ru(locale) ? "Что можно утверждать" : "What can be stated", paragraph: boundary }],
    source_boundary: boundary,
    proof_label: ru(locale) ? "Граница доказательности зафиксирована" : "Evidence boundary recorded",
  };
}
export function buildSpecializedMethodologyAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  const text = q(route);
  const isRu = ru(locale);
  let headline = isRu ? "Метод и доказательная граница" : "Method and evidence boundary";
  let direct = isRu
    ? "Статус метода определяется только принятой доказательной записью; формулировка вопроса не может повысить research до validated."
    : "Method status is determined only by the accepted evidence record; prompt wording cannot promote research to validated.";
  let bullets = isRu
    ? ["Наблюдение и источник фиксируются отдельно.", "Производный расчёт должен быть воспроизводим.", "Интерпретация не повышает статус доказательства."]
    : ["Observation and source are recorded separately.", "A derived calculation must be reproducible.", "Interpretation does not promote evidence status."];

  if (/эфемерид|ephemeris|coordinate|координат/.test(text)) {
    headline = isRu ? "Эфемерида и координатная модель" : "Ephemeris and coordinate model";
    direct = isRu
      ? "Астрономический слой использует pyswisseph 2.10.03, MOSEPH_PINNED и геоцентрическую тропическую эклиптическую систему координат."
      : "The astronomical layer uses pyswisseph 2.10.03, MOSEPH_PINNED, and a geocentric tropical ecliptic coordinate system.";
    bullets = isRu ? ["Покрытие публичного evidence: 2026-01-01–2026-12-31.", "Месячные якоря и опубликованные дневные события не дополняются догадкой."] : ["Public evidence coverage: 2026-01-01–2026-12-31.", "Monthly anchors and published daily events are not extended by guesswork."];
  } else if (/annual\s+priority|local\s+concentration|rank\s*3|market\s+concurrence/.test(text)) {
    headline = isRu ? "Annual priority, local concentration и market concurrence — разные величины" : "Annual priority, local concentration, and market concurrence are distinct";
    direct = isRu
      ? "Annual priority ранжирует астрономическое окно внутри года; local concentration описывает плотность точных событий внутри локального окна; market concurrence проверяется отдельно по рыночным данным и не меняет астрономический ранг."
      : "Annual priority ranks an astronomical window within the year; local concentration describes exact-event density inside a local window; market concurrence is tested separately against market evidence and does not change the astronomical rank.";
    bullets = isRu ? ["Annual priority: годовой астрономический ранг.", "Local concentration: локальная плотность/кластерность.", "Market concurrence: отдельное сопоставление с BTC без причинного вывода."] : ["Annual priority: annual astronomical rank.", "Local concentration: local density/clustering.", "Market concurrence: separate BTC comparison without a causal claim."];
  } else if (/browser\s+memory|system\s+logic|памят[ьи]\s+браузер|логик[аи]\s+систем/.test(text)) {
    headline = isRu ? "Контекст хранится как явное состояние диалога" : "Context is carried as explicit dialogue state";
    direct = isRu
      ? "Это не скрытая личная память: браузер хранит сериализованное состояние текущего диалога, а маршрутизатор использует только разрешённые поля этого state packet."
      : "This is not hidden personal memory: the browser stores serialized state for the current dialogue, and routing uses only the permitted fields of that state packet.";
    bullets = isRu ? ["Новая тема может заменить активный предмет.", "Новая беседа очищает session state.", "Отсутствующее предыдущее состояние не восстанавливается эвристически."] : ["A new topic may replace the active subject.", "A new conversation clears session state.", "Missing prior state is not reconstructed heuristically."];
  } else if (/где\s+здесь\s+данн|data[^?!.]{0,32}interpretation|данн[а-яё]*[^?!.]{0,32}интерпретац/.test(text)) {
    headline = isRu ? "Данные, derivation и интерпретация разделены" : "Data, derivation, and interpretation are separated";
    direct = isRu ? "Данные — это зафиксированные источниковые значения; derivation — воспроизводимый расчёт; интерпретация — ограниченный смысл поверх них, который не может создавать новые факты." : "Data are recorded source values; derivation is a reproducible calculation; interpretation is bounded meaning on top of them and cannot create new facts.";
    bullets = isRu ? ["Observation → источник.", "Derivation → проверяемое преобразование.", "Interpretation → вывод с границей."] : ["Observation → source.", "Derivation → checkable transformation.", "Interpretation → bounded conclusion."];
  }
  if (/coverage|revision|период\s+покрыти|ревизи|обновлен|updated/.test(text)) {
    headline = isRu ? "Покрытие и ревизия — разные поля" : "Coverage and revision are separate fields";
    direct = isRu
      ? "Покрытие публичного Astro evidence: 2026-01-01–2026-12-31. Время/идентификатор ревизии должен читаться из активной evidence metadata и не подменяется датой покрытия."
      : "Public Astro evidence coverage is 2026-01-01–2026-12-31. Revision time/identifier must come from the active evidence metadata and is not replaced by the coverage dates.";
  } else if (/applicab|применим|активам|периодам|режимам/.test(text)) {
    headline = isRu ? "Область применимости метода ограничена" : "Method applicability is bounded";
    direct = isRu
      ? "Текущий публичный контур применим к BTC-коридору, принятому периоду астрономического evidence и явно поддержанным режимам BTC Field, Astro Field, Astro × BTC и Method & Proof; это не универсальный метод для любого актива и периода."
      : "The current public method applies to the BTC corridor, the accepted astronomical evidence period, and explicitly supported BTC Field, Astro Field, Astro × BTC, and Method & Proof modes; it is not a universal method for every asset or period.";
  } else if (/100%\s+(?:confidence|уверенн)/.test(text)) {
    return boundedClarification(locale,
      isRu ? "100% уверенность не является поддерживаемым статусом" : "100% confidence is not a supported status",
      isRu ? "Нельзя честно повысить ограниченный исследовательский вывод до 100% уверенности." : "A bounded research conclusion cannot honestly be promoted to 100% confidence.",
      isRu ? "Допустим только статус, поддержанный принятой evidence записью и её границами." : "Only the status supported by the accepted evidence record and its boundaries is allowed.");
  }

  return {
    answer_state: "CONFIRMED",
    answer_mode: "METHODOLOGY",
    headline,
    direct_answer: direct,
    sections: [{ id: "method_status", label: isRu ? "Статус и применимость" : "Status and applicability", bullets }],
    source_boundary: isRu ? "Методологический ответ не меняет frozen evidence и не повышает исследовательский статус по просьбе пользователя." : "A methodology answer does not change frozen evidence or promote research status on request.",
    proof_label: isRu ? "Доказательства метода доступны" : "Method evidence available",
  };
}

export function buildSpecializedNavigationAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  const text = q(route); const isRu = ru(locale);
  let direct = isRu ? "Начните с конкретного предмета: текущее поле BTC, изменение Snapshot, протокол, Astro Field, Astro × BTC или Method & Proof." : "Start with one concrete subject: current BTC field, Snapshot change, protocol, Astro Field, Astro × BTC, or Method & Proof.";
  let headline = isRu ? "Выберите точный вход" : "Choose a precise entry point";
  if (/сменить\s+предмет|change\s+(?:the\s+)?subject/.test(text)) {
    headline = isRu ? "Новый предмет можно задать прямо" : "A new subject can be stated directly";
    direct = isRu ? "Назовите новый предмет явно в следующем вопросе; новая беседа для этого не нужна. Совместимый период сохраняется только когда это безопасно по контексту." : "State the new subject explicitly in the next question; a new conversation is not required. A compatible period is retained only when context makes that safe.";
  } else if (/очистить\s+контекст|начать\s+новую\s+бесед|начать\s+заново|clear\s+context|new\s+conversation/.test(text)) {
    headline = isRu ? "Новая беседа очищает активный session context" : "A new conversation clears active session context";
    direct = isRu ? "Чтобы начать без прошлого контекста, используйте новую беседу/очистку текущего диалога; простой переход к новой теме не равен очистке истории." : "To start without prior context, use a new conversation/clear the current dialogue; changing topic is not the same as clearing history.";
  } else if (/astro\s+field[^?!.]{0,48}astro\s*[×x]\s*btc|чем\s+astro\s+field/.test(text)) {
    headline = isRu ? "Astro Field и Astro × BTC используют разные доказательные контуры" : "Astro Field and Astro × BTC use different evidence lanes";
    direct = isRu ? "Astro Field описывает астрономическую конфигурацию самостоятельно; Astro × BTC сопоставляет её с независимым BTC evidence и сохраняет непричинную, неторговую границу." : "Astro Field describes the astronomical configuration on its own; Astro × BTC compares it with independent BTC evidence while preserving non-causal and non-trading boundaries.";
  } else if (/какой\s+режим\s+сейчас\s+актив|active\s+mode/.test(text)) {
    headline = isRu ? "Активный режим определяется предыдущим разрешённым state packet" : "The active mode comes from the prior permitted state packet";
    direct = route.time_range
      ? (isRu ? `Текущий вопрос относится к сохранённому контексту ${route.time_range.start}–${route.time_range.end}; режим навигации объясняет state, не заменяя аналитический предмет.` : `This question refers to retained context ${route.time_range.start}–${route.time_range.end}; navigation explains that state without replacing the analytical subject.`)
      : (isRu ? "Навигация может объяснить активный state, но не должна выдумывать отсутствующий предыдущий предмет." : "Navigation may explain active state but must not invent a missing prior subject.");
  } else if (/новый\s+предмет[^?!.]{0,32}новая\s+бесед|new\s+topic[^?!.]{0,32}new\s+conversation/.test(text)) {
    headline = isRu ? "Новая тема и новая беседа — не одно и то же" : "A new topic and a new conversation are different";
    direct = isRu ? "Новая тема меняет активный предмет внутри той же session history; новая беседа очищает предыдущий session context." : "A new topic changes the active subject within the same session history; a new conversation clears prior session context.";
  }
  if (route.subject === "routing_conflict") {
    headline = isRu ? "Нужно выбрать один маршрут или явно разделить ответ" : "Choose one route or explicitly split the answer";
    direct = isRu ? "Вопрос смешивает несовместимые режимы. Укажите, что приоритетно: Protocol, BTC Field или Astro; либо попросите явно разделить независимые части." : "The question mixes incompatible modes. State whether Protocol, BTC Field, or Astro has priority, or explicitly request separate independent parts.";
  } else if (/оставь[^?!.]{0,48}активн[^?!.]{0,48}но[^?!.]{0,48}только|keep[^?!.]{0,48}active[^?!.]{0,48}(?:but|while)/.test(text)) {
    headline = isRu ? "Инструкция о предмете конфликтует" : "The subject instruction conflicts";
    direct = isRu ? "Нельзя одновременно оставить один основной Astro-предмет активным и отвечать только про другой. Уточните, какой предмет должен стать активным." : "One primary Astro subject cannot remain active while answering only about another. Specify which subject should become active.";
  }
  return {
    answer_state: route.subject === "routing_conflict" ? "CLARIFICATION" : "LIMITED",
    answer_mode: route.subject === "routing_conflict" ? "CLARIFICATION" : "NAVIGATION",
    headline,
    direct_answer: direct,
    sections: [{ id: "navigation_action", label: isRu ? "Следующее действие" : "Next action", paragraph: direct }],
    source_boundary: isRu ? "Навигация меняет только явный state и не создаёт аналитические факты." : "Navigation changes only explicit state and does not create analytical facts.",
    proof_label: isRu ? "Навигационный контракт" : "Navigation contract",
  };
}

export function specializeMarketAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  answer: BtcCosmographerAnswerProjection,
): BtcCosmographerAnswerProjection {
  const text = q(route); const isRu = ru(locale);
  const evidence = answer.sections.find((s) => s.id === "market_evidence")?.bullets ?? [];
  const watch = answer.sections.find((s) => s.id === "market_watch")?.paragraph ?? "";
  if (/когда\s+покупать|когда\s+продавать|продай\s+мне\s+сигнал|\bbuy\b|\bsell\b|position\s+size|дол[юя]\s+капитал|allocate|invest/.test(text)) {
    return boundedClarification(locale,
      isRu ? "Торговая инструкция вне контракта BTC Cosmographer" : "Trading instruction is outside the BTC Cosmographer contract",
      isRu ? "Я не превращаю исследовательское чтение в сигнал покупки/продажи, тайминг сделки или размер позиции." : "I do not turn a research read into a buy/sell signal, trade timing, or position size.",
      isRu ? "Доступны текущее состояние BTC, доказательства и наблюдаемые условия изменения чтения." : "Current BTC state, evidence, and observable conditions that would change the read remain available.");
  }
  if (/точн[а-яё]*\s+цен[ау].*пик|exact[^?!.]{0,24}price[^?!.]{0,24}peak/.test(text)) {
    return boundedClarification(locale,
      isRu ? "Точная будущая цена на пике не доказуема" : "An exact future peak price is not supportable",
      isRu ? "Принятый Snapshot не доказывает точную будущую цену BTC или точный ценовой пик." : "The accepted Snapshot does not establish an exact future BTC price or exact price peak.",
      isRu ? "Можно показать только принятое текущее состояние и условия, которые изменят чтение." : "Only the accepted current state and conditions that would change the read can be shown.");
  }
  if (/previous\s+verified\s+snapshot\s+is\s+unavailable|предыдущ[а-яё]*\s+проверенн[а-яё]*\s+(?:снимок|snapshot)\s+недоступ/.test(text)) {
    return boundedClarification(locale,
      isRu ? "Сравнение без предыдущего принятого Snapshot невозможно" : "Comparison is unavailable without the previous accepted Snapshot",
      isRu ? "Без предыдущего принятого Snapshot нельзя честно утверждать, что именно изменилось." : "Without the previous accepted Snapshot, it is not possible to state honestly what changed.",
      isRu ? "Допустимы только факты текущего принятого Snapshot; прошлое состояние не восстанавливается догадкой." : "Only facts from the current accepted Snapshot are allowed; prior state is not reconstructed by guesswork.");
  }
  if (route.domain === "snapshot_memory" && evidence.length) {
    const first = evidence.slice(0, 3).join(" ");
    return { ...answer, direct_answer: isRu ? `Сначала изменения: ${first}` : `Changes first: ${first}` };
  }
  if (/what\s+conditions?\s+would\s+weaken|что\s+изменит.*чтени|услов[а-яё]*.*ослаб/.test(text) && watch) {
    return { ...answer, direct_answer: isRu ? `Условия изменения чтения: ${watch}` : `Conditions that would change the read: ${watch}` };
  }
  if (/current\s+enough|fresh|актуальн|свеж/.test(text)) {
    const snapshotLine = evidence.find((line) => /snapshot|принят[а-яё]*\s+цен|accepted btc price/i.test(line));
    return { ...answer, direct_answer: snapshotLine
      ? (isRu ? `Текущесть evidence проверяется по принятой ревизии: ${snapshotLine}` : `Evidence currentness is bounded by the accepted revision: ${snapshotLine}`)
      : answer.direct_answer };
  }
  return answer;
}
export function specializeBridgeAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  answer: BtcCosmographerAnswerProjection,
): BtcCosmographerAnswerProjection {
  const text = q(route); const isRu = ru(locale);
  const historical = /historical|историческ|за\s+те\s+же\s+дат|same\s+dates/.test(text);
  if (/cause|caused|вызвал|обрушил|причин/.test(text)) {
    const missingPeriodEvidence = /yesterday|вчера/.test(text);
    return { ...answer, answer_state: missingPeriodEvidence ? "LIMITED" : answer.answer_state, answer_mode: missingPeriodEvidence ? "CLARIFICATION" : answer.answer_mode, direct_answer: isRu
      ? "Нет: принятое evidence не доказывает причинное влияние планетарной конфигурации на движение BTC. Можно проверять только временное совпадение/расхождение независимых слоёв."
      : "No: accepted evidence does not establish a causal effect of a planetary configuration on BTC. Only temporal concurrence/divergence between independent lanes can be tested." };
  }
  if (historical) {
    return { ...answer, answer_state: "LIMITED", direct_answer: isRu
      ? "Историческое сопоставление требует принятого BTC evidence за тот же период; текущий Snapshot не заменяет исторический ряд и не используется как его суррогат."
      : "Historical comparison requires accepted BTC evidence for the same period; the current Snapshot does not substitute for historical evidence." };
  }
  if (/не\s+подтверж|does\s+not\s+confirm|diverg|расхожд/.test(text)) {
    return { ...answer, direct_answer: isRu
      ? "Неподтверждение — это допустимый результат: рыночный слой расходится с заявленной связью, поэтому вывод остаётся раздельным и непричинным."
      : "Non-confirmation is a valid result: the market lane diverges from the proposed relation, so the conclusion remains split and non-causal." };
  }
  return { ...answer, direct_answer: isRu
    ? "Ограниченный вывод: астрономический и BTC-слои можно сопоставлять как независимые evidence lanes; текущие данные не устанавливают причинность и не создают торговый сигнал."
    : "Bounded conclusion: the astronomical and BTC lanes can be compared as independent evidence lanes; current evidence does not establish causality or create a trading signal." };
}
