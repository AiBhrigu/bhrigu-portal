import type { BtcPublicLocale } from "./btc-public-language-contract";
import type {
  BtcCosmographerAnswerState,
  BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";

export const BTC_PROTOCOL_EVIDENCE_SCHEMA =
  "btc_protocol_public_evidence_v0_1" as const;

export type BtcCosmographerSection = {
  id: string;
  label: string;
  paragraph?: string;
  bullets?: string[];
};

export type BtcCosmographerAnswerProjection = {
  answer_state: BtcCosmographerAnswerState;
  answer_mode:
    | "PROTOCOL_FACT"
    | "PROTOCOL_EXPLAIN"
    | "MARKET_DIAGNOSIS"
    | "ASTRO_INTERVAL"
    | "ASTRO_STATE"
    | "ASTRO_BTC_BRIDGE"
    | "METHODOLOGY"
    | "NAVIGATION"
    | "CLARIFICATION";
  headline: string;
  direct_answer: string;
  sections: BtcCosmographerSection[];
  source_boundary: string;
  proof_label: string;
};

type ProtocolEvidence = {
  headline: [string, string];
  direct: [string, string];
  mechanism: [string, string][];
  boundary: [string, string];
};

const evidence: Record<string, ProtocolEvidence> = {
  overview: {
    headline: ["Bitcoin protocol: the operating core", "Протокол Bitcoin: рабочее ядро"],
    direct: [
      "Bitcoin is a proof-of-work monetary network. Full nodes validate blocks and transactions, miners propose proof-of-work blocks, and consensus rules determine issuance and valid state.",
      "Bitcoin — денежная сеть с доказательством работы. Полные узлы проверяют блоки и транзакции, майнеры предлагают блоки с Proof of Work, а правила консенсуса определяют эмиссию и допустимое состояние сети.",
    ],
    mechanism: [
      ["Transactions spend existing UTXOs and create new outputs.", "Транзакции расходуют существующие UTXO и создают новые выходы."],
      ["The active chain is the valid chain with the greatest accumulated work.", "Активной становится допустимая цепь с наибольшей накопленной работой."],
      ["Issuance follows the block-subsidy schedule; fees transfer existing BTC.", "Эмиссия следует графику субсидии блока; комиссии передают уже существующие BTC."],
    ],
    boundary: [
      "This describes consensus mechanics, not current price or investment value.",
      "Это описание механики консенсуса, а не текущей цены или инвестиционной ценности.",
    ],
  },
  supply: {
    headline: ["Bitcoin supply is finite by protocol", "Количество BTC ограничено протоколом"],
    direct: [
      "The familiar limit is 21 million BTC. Under Bitcoin Core's integer-satoshi subsidy rule, the exact nominal sum of all positive block subsidies is 20,999,999.9769 BTC.",
      "Обычно предел называют 21 млн BTC. По целочисленному правилу субсидии Bitcoin Core точная номинальная сумма всех положительных субсидий составляет 20 999 999,9769 BTC.",
    ],
    mechanism: [
      ["New BTC enter through the block subsidy, which halves every 210,000 blocks.", "Новые BTC появляются через субсидию блока, которая уменьшается вдвое каждые 210 000 блоков."],
      ["Nominal issuance is not the same as circulating or spendable supply.", "Номинальная эмиссия не равна обращающемуся или доступному для расходования предложению."],
      ["Lost coins, provably unspendable outputs and coins not yet issued must be treated separately.", "Потерянные монеты, доказуемо недоступные выходы и ещё не выпущенные монеты учитываются отдельно."],
    ],
    boundary: [
      "A current issued or circulating figure requires a separately timestamped chain-state snapshot.",
      "Точное текущее выпущенное или обращающееся количество требует отдельного снимка состояния цепи с временем и высотой блока.",
    ],
  },
  halving: {
    headline: ["Halving is triggered by block height", "Халвинг запускается высотой блока"],
    direct: [
      "A halving cuts the block subsidy in half every 210,000 blocks. The trigger is an exact block height, not a calendar date.",
      "Халвинг уменьшает субсидию блока вдвое каждые 210 000 блоков. Триггером служит точная высота блока, а не календарная дата.",
    ],
    mechanism: [
      ["Subsidy boundaries begin at heights 0, 210,000, 420,000, 630,000, 840,000 and 1,050,000.", "Границы субсидии начинаются на высотах 0, 210 000, 420 000, 630 000, 840 000 и 1 050 000."],
      ["The 840,000–1,049,999 epoch has a nominal subsidy of 3.125 BTC per block.", "В эпохе 840 000–1 049 999 номинальная субсидия составляет 3,125 BTC за блок."],
      ["The next boundary is block 1,050,000; any calendar date is only an estimate.", "Следующая граница — блок 1 050 000; любая календарная дата является только оценкой."],
    ],
    boundary: [
      "Halving changes new issuance. It does not by itself prove a future price direction.",
      "Халвинг меняет темп новой эмиссии. Сам по себе он не доказывает направление будущей цены.",
    ],
  },
  subsidy: {
    headline: ["Block subsidy follows an integer schedule", "Субсидия блока следует целочисленному графику"],
    direct: [
      "For height h, Bitcoin Core uses epoch = floor(h / 210,000) and right-shifts the original 50 BTC subsidy by that epoch.",
      "Для высоты h Bitcoin Core использует epoch = floor(h / 210 000) и сдвигает исходную субсидию 50 BTC вправо на номер эпохи.",
    ],
    mechanism: [
      ["The calculation is performed in integer satoshis.", "Расчёт выполняется в целых сатоши."],
      ["After the shift guard reaches its limit, subsidy becomes zero.", "После достижения предела сдвига субсидия становится нулевой."],
      ["Transaction fees are additional miner revenue but are not newly issued BTC.", "Комиссии добавляются к доходу майнера, но не являются новой эмиссией BTC."],
    ],
    boundary: [
      "A block may claim no more than subsidy plus valid transaction fees.",
      "Coinbase-транзакция блока может заявить не больше субсидии плюс допустимые комиссии.",
    ],
  },
  fees: {
    headline: ["Fees transfer existing BTC", "Комиссии передают существующие BTC"],
    direct: [
      "Transaction fees equal inputs minus outputs and are paid to the miner of the block. They do not increase total Bitcoin issuance.",
      "Комиссия транзакции равна разнице между входами и выходами и достаётся майнеру блока. Она не увеличивает общую эмиссию Bitcoin.",
    ],
    mechanism: [
      ["A valid coinbase may claim block subsidy plus transaction fees.", "Допустимая coinbase-транзакция может получить субсидию блока плюс комиссии."],
      ["As subsidy declines, fees become a larger part of direct miner compensation.", "По мере снижения субсидии комиссии становятся большей частью прямого вознаграждения майнеров."],
    ],
    boundary: [
      "The protocol structure does not guarantee a future fee level or security budget.",
      "Структура протокола не гарантирует будущий уровень комиссий или бюджет безопасности.",
    ],
  },
  difficulty: {
    headline: ["Difficulty targets a ten-minute block interval", "Сложность нацелена на десятиминутный интервал"],
    direct: [
      "Bitcoin mainnet retargets proof-of-work difficulty every 2,016 blocks toward a 600-second target spacing.",
      "Основная сеть Bitcoin перенастраивает сложность Proof of Work каждые 2 016 блоков к целевому интервалу 600 секунд.",
    ],
    mechanism: [
      ["The target timespan is 1,209,600 seconds.", "Целевой период составляет 1 209 600 секунд."],
      ["The measured timespan is bounded before the new target is calculated.", "Перед вычислением новой цели измеренный период ограничивается правилами протокола."],
      ["Block timestamps are consensus fields, not exact wall-clock attestations.", "Временные метки блоков — поля консенсуса, а не точные свидетельства реального времени."],
    ],
    boundary: [
      "A current difficulty or next-retarget estimate requires a dynamic tip snapshot.",
      "Текущая сложность или оценка следующего ретаргета требует динамического снимка вершины цепи.",
    ],
  },
  mining: {
    headline: ["Mining proposes work; nodes enforce validity", "Майнинг предлагает работу, узлы обеспечивают допустимость"],
    direct: [
      "Miners assemble candidate blocks and search for a header hash below the target. Full nodes independently reject blocks that violate consensus rules.",
      "Майнеры собирают блок-кандидат и ищут хеш заголовка ниже цели. Полные узлы независимо отклоняют блоки, нарушающие правила консенсуса.",
    ],
    mechanism: [
      ["Proof of work orders valid history by accumulated chainwork.", "Proof of Work упорядочивает допустимую историю по накопленной работе."],
      ["Peer agreement cannot make an invalid block valid.", "Согласие участников не может сделать недопустимый блок допустимым."],
    ],
    boundary: [
      "Mining power affects competition for chainwork, not permission to rewrite consensus rules.",
      "Мощность майнинга влияет на конкуренцию за chainwork, но не даёт права переписывать правила консенсуса.",
    ],
  },
  utxo: {
    headline: ["Bitcoin state is a UTXO set", "Состояние Bitcoin — это набор UTXO"],
    direct: [
      "Bitcoin does not maintain a native account-balance table. Validated state is the set of unspent transaction outputs accepted by the active chain.",
      "Bitcoin не ведёт нативную таблицу балансов счетов. Проверенное состояние — набор неизрасходованных выходов транзакций, принятых активной цепью.",
    ],
    mechanism: [
      ["Each input references a previous output and supplies unlocking data.", "Каждый вход ссылается на предыдущий выход и предоставляет данные разблокировки."],
      ["Each output carries value and a locking script.", "Каждый выход содержит сумму и блокирующий скрипт."],
      ["Full nodes verify existence, value, script rules and absence of double spending.", "Полные узлы проверяют существование, стоимость, правила скриптов и отсутствие двойного расходования."],
    ],
    boundary: [
      "Wallet balances are derived views over controlled UTXOs.",
      "Баланс кошелька — производное представление контролируемых UTXO.",
    ],
  },
  genesis: {
    headline: ["Genesis anchors Bitcoin history", "Genesis закрепляет начало истории Bitcoin"],
    direct: [
      "The Bitcoin Genesis block is height 0. It anchors the chain's history and the initial 50 BTC subsidy epoch.",
      "Genesis-блок Bitcoin имеет высоту 0. Он закрепляет начало истории цепи и первую эпоху субсидии 50 BTC.",
    ],
    mechanism: [
      ["Later blocks commit to the previous block hash.", "Каждый последующий блок фиксирует хеш предыдущего блока."],
      ["The active history is selected by valid accumulated proof of work.", "Активная история выбирается по допустимой накопленной работе."],
    ],
    boundary: [
      "Genesis is a protocol anchor; attaching market or astrological meaning requires a separate research method.",
      "Genesis — протокольная опорная точка; рыночный или астрологический смысл требует отдельного исследовательского метода.",
    ],
  },
  consensus: {
    headline: ["Consensus separates validity from popularity", "Консенсус отделяет допустимость от популярности"],
    direct: [
      "Bitcoin nodes apply consensus rules independently. The active chain is the valid candidate with the greatest accumulated proof of work.",
      "Узлы Bitcoin независимо применяют правила консенсуса. Активной становится допустимая цепь с наибольшей накопленной Proof of Work.",
    ],
    mechanism: [
      ["Raw block count alone is not the selection rule.", "Одного количества блоков недостаточно для выбора цепи."],
      ["Relay and mempool policy are not the same as consensus validity.", "Политика ретрансляции и mempool не равна консенсусной допустимости."],
      ["Additional confirmations increase replacement cost but do not create mathematical finality.", "Дополнительные подтверждения увеличивают стоимость замены истории, но не создают математической окончательности."],
    ],
    boundary: [
      "Operational finality statements must specify confirmation depth and threat model.",
      "Операционные утверждения об окончательности должны указывать глубину подтверждений и модель угроз.",
    ],
  },
  blocks: {
    headline: ["A block binds transactions to chainwork", "Блок связывает транзакции с chainwork"],
    direct: [
      "A block header commits to the previous block, transaction Merkle root, timestamp, target and nonce. Its proof-of-work hash must satisfy the target.",
      "Заголовок блока фиксирует предыдущий блок, Merkle root транзакций, временную метку, цель и nonce. Его Proof-of-Work хеш должен удовлетворять цели.",
    ],
    mechanism: [
      ["Height identifies position in a candidate chain.", "Высота определяет положение в цепи-кандидате."],
      ["Chain selection depends on accumulated work, not height alone.", "Выбор цепи зависит от накопленной работы, а не только от высоты."],
    ],
    boundary: [
      "Current height and tip hash require a timestamped dynamic protocol snapshot.",
      "Текущая высота и хеш вершины требуют динамического протокольного снимка с отметкой времени.",
    ],
  },
};

const pick = (locale: BtcPublicLocale, value: [string, string]): string =>
  locale === "ru" ? value[1] : value[0];

export function buildBtcProtocolAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  const item = evidence[route.subject] ?? evidence.overview;
  const mechanism = item.mechanism.map((line) => pick(locale, line));
  return {
    answer_state: "CONFIRMED",
    answer_mode: route.intents.includes("fact") ? "PROTOCOL_FACT" : "PROTOCOL_EXPLAIN",
    headline: pick(locale, item.headline),
    direct_answer: pick(locale, item.direct),
    sections: [
      {
        id: "mechanism",
        label: locale === "ru" ? "Как это устроено" : "How it works",
        bullets: mechanism,
      },
      {
        id: "boundary",
        label: locale === "ru" ? "Важная граница" : "Important boundary",
        paragraph: pick(locale, item.boundary),
      },
    ],
    source_boundary: locale === "ru"
      ? "Источник: закреплённый Bitcoin Protocol Source of Truth. Это описание протокола, а не прогноз, ценовая цель или инвестиционная рекомендация."
      : "Source: pinned Bitcoin Protocol Source of Truth. This is protocol description, not a forecast, price target or investment recommendation.",
    proof_label: locale === "ru" ? "Protocol proof доступен" : "Protocol proof available",
  };
}
