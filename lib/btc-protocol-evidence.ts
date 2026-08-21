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


export type BtcOriginsHistorySubject =
  | "satoshi_history"
  | "bitcoin_origin"
  | "genesis_history";

export type BtcOriginsPreparedQuestion = {
  id: string;
  subject: BtcOriginsHistorySubject;
  question: string;
};

export const BTC_ORIGINS_PREPARED_QUESTIONS: Record<
  BtcPublicLocale,
  BtcOriginsPreparedQuestion[]
> = {
  ru: [
    {
      id: "bitcoin_origin_timeline",
      subject: "bitcoin_origin",
      question: "Как появился Bitcoin: от white paper до запуска сети?",
    },
    {
      id: "satoshi_known_facts",
      subject: "satoshi_history",
      question: "Что точно известно о Сатоши Накамото?",
    },
    {
      id: "genesis_first_days",
      subject: "genesis_history",
      question: "Что произошло в первые дни Bitcoin после Genesis?",
    },
    {
      id: "genesis_times_message",
      subject: "genesis_history",
      question: "Что означает сообщение The Times в Genesis-блоке?",
    },
    {
      id: "satoshi_departure_boundary",
      subject: "satoshi_history",
      question: "Почему Сатоши ушёл и что здесь остаётся неизвестным?",
    },
  ],
  en: [
    {
      id: "bitcoin_origin_timeline",
      subject: "bitcoin_origin",
      question: "How did Bitcoin emerge, from the white paper to the network launch?",
    },
    {
      id: "satoshi_known_facts",
      subject: "satoshi_history",
      question: "What is known for certain about Satoshi Nakamoto?",
    },
    {
      id: "genesis_first_days",
      subject: "genesis_history",
      question: "What happened in Bitcoin's first days after Genesis?",
    },
    {
      id: "genesis_times_message",
      subject: "genesis_history",
      question: "What does the Times message in the Genesis block mean?",
    },
    {
      id: "satoshi_departure_boundary",
      subject: "satoshi_history",
      question: "Why did Satoshi leave, and what remains unknown?",
    },
  ],
};

type BtcOriginsLocalized = [string, string];

type BtcOriginsSource = {
  id: string;
  label: BtcOriginsLocalized;
  url: string;
};

type BtcOriginsTimelineEntry = {
  date: string;
  text: BtcOriginsLocalized;
};

export const BTC_ORIGINS_KNOWLEDGE_CAPSULE: {
  timeline: BtcOriginsTimelineEntry[];
  sources: BtcOriginsSource[];
  known: BtcOriginsLocalized[];
  supported_inference: BtcOriginsLocalized[];
  disputed: BtcOriginsLocalized[];
  unknown_boundary: BtcOriginsLocalized[];
} = {
  timeline: [
    {
      date: "2008-10-31",
      text: [
        "Satoshi Nakamoto announced the Bitcoin paper on the Cryptography mailing list.",
        "Сатоши Накамото представил документ Bitcoin в рассылке Cryptography.",
      ],
    },
    {
      date: "2009-01-03",
      text: [
        "The Genesis block established height 0 and embedded the Times headline dated 3 January 2009.",
        "Genesis-блок закрепил высоту 0 и включил заголовок The Times от 3 января 2009 года.",
      ],
    },
    {
      date: "2009-01-08",
      text: [
        "The mailing-list archive recorded the first Bitcoin alpha release announcement and its issuance schedule.",
        "Архив рассылки зафиксировал объявление первого alpha-релиза Bitcoin и график эмиссии.",
      ],
    },
    {
      date: "2010-12-12",
      text: [
        "Satoshi's last documented public forum post concerned Bitcoin 0.3.19 and denial-of-service controls.",
        "Последний документированный публичный пост Сатоши касался Bitcoin 0.3.19 и защиты от DoS.",
      ],
    },
    {
      date: "2011-04",
      text: [
        "A preserved email says Satoshi had moved on and that Bitcoin was in good hands with Gavin and the wider team.",
        "Сохранённое письмо сообщает, что Сатоши занялся другими делами и оставил Bitcoin Гэвину и более широкому сообществу.",
      ],
    },
  ],
  sources: [
    {
      id: "mailing_list_announcement",
      label: [
        "Satoshi Nakamoto — Cryptography mailing-list announcement, 31 Oct 2008",
        "Сатоши Накамото — объявление в рассылке Cryptography, 31 октября 2008",
      ],
      url: "https://www.metzdowd.com/pipermail/cryptography/2008-October/014810.html",
    },
    {
      id: "white_paper",
      label: [
        "Bitcoin: A Peer-to-Peer Electronic Cash System — original paper",
        "Bitcoin: A Peer-to-Peer Electronic Cash System — оригинальный документ",
      ],
      url: "https://bitcoin.org/bitcoin.pdf",
    },
    {
      id: "first_release_archive",
      label: [
        "Satoshi Nakamoto — Bitcoin v0.1 release announcement, 8 Jan 2009",
        "Сатоши Накамото — объявление Bitcoin v0.1 в рассылке, 8 января 2009",
      ],
      url: "https://www.metzdowd.com/pipermail/cryptography/2009-January/014994.html",
    },
    {
      id: "genesis_source_code",
      label: [
        "Bitcoin Core chain parameters — Genesis construction and embedded message",
        "Параметры цепи Bitcoin Core — конструкция Genesis и встроенное сообщение",
      ],
      url: "https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp",
    },
    {
      id: "last_public_post",
      label: [
        "Satoshi Nakamoto — last documented public forum post, 12 Dec 2010",
        "Сатоши Накамото — последний документированный публичный пост, 12 декабря 2010",
      ],
      url: "https://bitcointalk.org/index.php?topic=2228.msg29479#msg29479",
    },
    {
      id: "final_handoff_email",
      label: [
        "Mike Hearn email archive — Satoshi's April 2011 handoff message",
        "Архив писем Майка Хирна — сообщение Сатоши о передаче работы, апрель 2011",
      ],
      url: "https://plan99.net/~mike/satoshi-emails/thread5.html",
    },
  ],
  known: [
    [
      "Satoshi Nakamoto is the pseudonymous identity attached to the paper, early code, and documented communications.",
      "Сатоши Накамото — псевдоним, связанный с документом, ранним кодом и документированной перепиской.",
    ],
    [
      "The public record documents the paper announcement, Genesis, the first release, later maintenance, and a handoff.",
      "Публичные материалы документируют объявление документа, Genesis, первый релиз, дальнейшую поддержку и передачу работы.",
    ],
    [
      "No legal identity has been publicly proven by a reproducible cryptographic and documentary standard.",
      "Ни одна юридическая личность не доказана публично воспроизводимым криптографическим и документальным стандартом.",
    ],
  ],
  supported_inference: [
    [
      "The sequence of releases and messages supports a deliberate transfer from a founding author to an open-source contributor network.",
      "Последовательность релизов и сообщений поддерживает вывод о сознательной передаче работы от основателя сети участников open source.",
    ],
    [
      "The Times text provides a not-before date and plausibly comments on the banking crisis; a more specific intent is not documented.",
      "Текст The Times задаёт нижнюю временную границу и, вероятно, комментирует банковский кризис; более точный замысел не документирован.",
    ],
  ],
  disputed: [
    [
      "Claims naming a particular person or group as Satoshi remain disputed unless supported by independently reproducible proof.",
      "Версии, называющие конкретного человека или группу Сатоши, остаются спорными без независимо воспроизводимого доказательства.",
    ],
    [
      "Estimates of coins mined or still controlled by Satoshi depend on attribution methods and are not exact identity proof.",
      "Оценки монет, добытых или контролируемых Сатоши, зависят от метода атрибуции и не являются точным доказательством личности.",
    ],
    [
      "WikiLeaks, the CIA, personal risk, or a single event as the cause of departure are hypotheses, not established facts.",
      "WikiLeaks, ЦРУ, личный риск или одно событие как причина ухода — гипотезы, а не установленные факты.",
    ],
  ],
  unknown_boundary: [
    [
      "The legal identity, whether Satoshi was one person or a team, exact location, motive for leaving, current status, and definitive key ownership remain unknown.",
      "Юридическая личность, один это был человек или группа, точное местоположение, мотив ухода, текущий статус и окончательное владение ключами остаются неизвестными.",
    ],
  ],
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


function originsHistoryAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  const q = route.normalized_question.toLowerCase();
  const asksDeparture = /why.*satoshi.*leave|почему.*сатоши.*уш|причин.*уход/.test(q);
  const asksTimes = /the times|times message|сообщени[ея].*times/.test(q);
  const subject = route.subject as BtcOriginsHistorySubject;
  const direct: Record<BtcOriginsHistorySubject, BtcOriginsLocalized> = {
    bitcoin_origin: [
      "Bitcoin moved from a published peer-to-peer electronic-cash design in October 2008 to a running proof-of-work network with Genesis and an early public software release in January 2009.",
      "Bitcoin прошёл путь от опубликованной в октябре 2008 года схемы одноранговых электронных денег до работающей Proof-of-Work сети с Genesis и ранним публичным выпуском программы в январе 2009 года.",
    ],
    genesis_history: asksTimes
      ? [
          "The Genesis block contains the exact newspaper text “The Times 03/Jan/2009 Chancellor on brink of second bailout for banks”. It proves the block was constructed no earlier than that date; its broader political meaning is a supported interpretation, not a documented statement of intent.",
          "Genesis-блок содержит точный газетный текст «The Times 03/Jan/2009 Chancellor on brink of second bailout for banks». Он доказывает, что блок создан не раньше этой даты; более широкий политический смысл — поддерживаемая интерпретация, а не документированное заявление о намерении.",
        ]
      : [
          "Genesis fixed Bitcoin's first protocol anchor at height 0. The following public release turned that anchor into software other participants could run, inspect, and extend.",
          "Genesis закрепил первую протокольную точку Bitcoin на высоте 0. Последующий публичный релиз превратил эту точку в программу, которую другие участники могли запускать, проверять и развивать.",
        ],
    satoshi_history: asksDeparture
      ? [
          "The exact reason Satoshi left is not known. The documents show a gradual withdrawal and transfer of responsibility; they do not prove that WikiLeaks, the CIA, personal danger, or any single event caused it.",
          "Точная причина ухода Сатоши неизвестна. Документы показывают постепенный отход и передачу ответственности, но не доказывают, что причиной стали WikiLeaks, ЦРУ, личная опасность или одно конкретное событие.",
        ]
      : [
          "What is certain is a documented pseudonymous record: the 2008 paper, early code and releases, public technical discussion, and a later handoff. Satoshi's legal identity has not been publicly proven.",
          "Точно известен документированный след псевдонима: документ 2008 года, ранний код и релизы, публичное техническое обсуждение и последующая передача работы. Юридическая личность Сатоши публично не доказана.",
        ],
  };
  const headline: Record<BtcOriginsHistorySubject, BtcOriginsLocalized> = {
    bitcoin_origin: ["From the Bitcoin paper to a running network", "От документа Bitcoin к работающей сети"],
    genesis_history: asksTimes
      ? ["The Genesis message: documented text, bounded meaning", "Сообщение Genesis: документированный текст и граница смысла"]
      : ["Genesis and Bitcoin's first public days", "Genesis и первые публичные дни Bitcoin"],
    satoshi_history: asksDeparture
      ? ["Satoshi's departure: documented handoff, unknown motive", "Уход Сатоши: документированная передача, неизвестный мотив"]
      : ["Satoshi Nakamoto: the documented record", "Сатоши Накамото: документированный след"],
  };
  const significance: Record<BtcOriginsHistorySubject, BtcOriginsLocalized> = {
    bitcoin_origin: [
      "The decisive change was not only an idea: independently verifiable software and a live chain made the monetary rules operational.",
      "Решающим было не только появление идеи: независимо проверяемая программа и живая цепь сделали денежные правила действующими.",
    ],
    genesis_history: [
      "Genesis gives every validating implementation a common historical anchor; the embedded text also binds the launch to a public date and contemporary context.",
      "Genesis даёт всем проверяющим реализациям общий исторический якорь; встроенный текст также связывает запуск с публичной датой и контекстом эпохи.",
    ],
    satoshi_history: [
      "Bitcoin's continuity no longer depends on proving who Satoshi was: protocol validity comes from reproducible rules, code, and network verification rather than founder identity.",
      "Непрерывность Bitcoin не зависит от доказательства личности Сатоши: допустимость протокола определяется воспроизводимыми правилами, кодом и сетевой проверкой, а не личностью основателя.",
    ],
  };
  const timeline = BTC_ORIGINS_KNOWLEDGE_CAPSULE.timeline.map(
    (entry) => `${entry.date} — ${pick(locale, entry.text)}`,
  );
  const sourceLines = BTC_ORIGINS_KNOWLEDGE_CAPSULE.sources.map(
    (source) => `${pick(locale, source.label)}|${source.url}`,
  );
  return {
    answer_state: subject === "satoshi_history" ? "LIMITED" : "CONFIRMED",
    answer_mode: "PROTOCOL_EXPLAIN",
    headline: pick(locale, headline[subject]),
    direct_answer: pick(locale, direct[subject]),
    sections: [
      {
        id: "timeline",
        label: locale === "ru" ? "Краткая хронология" : "Concise chronology",
        bullets: timeline,
      },
      {
        id: "significance",
        label: locale === "ru" ? "Значение для Bitcoin" : "Why it matters for Bitcoin",
        paragraph: pick(locale, significance[subject]),
      },
      {
        id: "known",
        label: locale === "ru" ? "Что подтверждено" : "What is documented",
        bullets: BTC_ORIGINS_KNOWLEDGE_CAPSULE.known.map((line) => pick(locale, line)),
      },
      {
        id: "supported_inference",
        label: locale === "ru" ? "Поддерживаемый вывод" : "Supported inference",
        bullets: BTC_ORIGINS_KNOWLEDGE_CAPSULE.supported_inference.map((line) => pick(locale, line)),
      },
      {
        id: "disputed",
        label: locale === "ru" ? "Спорные утверждения" : "Disputed claims",
        bullets: BTC_ORIGINS_KNOWLEDGE_CAPSULE.disputed.map((line) => pick(locale, line)),
      },
      {
        id: "unknown_boundary",
        label: locale === "ru" ? "Что остаётся неизвестным" : "What remains unknown",
        bullets: BTC_ORIGINS_KNOWLEDGE_CAPSULE.unknown_boundary.map((line) => pick(locale, line)),
      },
      {
        id: "sources",
        label: locale === "ru" ? "Первичные источники" : "Primary sources",
        bullets: sourceLines,
      },
    ],
    source_boundary: locale === "ru"
      ? "Исторический ответ разделяет документированный факт, поддерживаемый вывод, спорную версию и неизвестное. Он не подтверждает личность Сатоши, точный объём его монет или мотив ухода."
      : "The historical answer separates documented fact, supported inference, disputed claims, and unknowns. It does not authenticate Satoshi's identity, exact holdings, or motive for leaving.",
    proof_label: locale === "ru" ? "Исторические источники доступны" : "Historical sources available",
  };
}

export function buildBtcProtocolAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  const question = route.normalized_question.toLowerCase();
  const isRu = locale === "ru";
  if (/карт[ау]\s+генезис|genesis\s+chart/.test(question)) {
    return {
      answer_state: "LIMITED", answer_mode: "CLARIFICATION",
      headline: isRu ? "Для карты генезиса нужна принятая модель события" : "A genesis chart requires an accepted event model",
      direct_answer: isRu ? "Протокольный Genesis известен, но астрологическая карта требует отдельно принятого события, времени UTC и правила координат; эти параметры нельзя выдумать." : "Protocol Genesis is known, but an astrological chart requires a separately accepted event, UTC time, and coordinate rule; those parameters cannot be invented.",
      sections: [],
      source_boundary: isRu ? "Протокольный факт не преобразуется автоматически в астрологическую карту." : "A protocol fact does not automatically become an astrological chart.",
      proof_label: isRu ? "Граница Genesis подтверждена" : "Genesis boundary confirmed",
    };
  }
  if (route.subject === "satoshi_history" || route.subject === "bitcoin_origin" || route.subject === "genesis_history") {
    const history = originsHistoryAnswer(locale, route);
    return /что\s+известно.*genesis|what\s+is\s+known.*genesis/.test(question) ? { ...history, answer_mode: "PROTOCOL_FACT" } : history;
  }
  const item = evidence[route.subject] ?? evidence.overview;
  const mechanism = item.mechanism.map((line) => pick(locale, line));
  const supplyFact = route.subject === "supply" && /предел|limit|how\s+does.*supply/.test(question);
  const genesisFact = route.subject === "genesis" && /что\s+было|what\s+(?:was|happened)|генезис|genesis/.test(question);
  const latestBlockState = route.subject === "blocks" && /latest\s+accepted\s+block|current\s+(?:block|tip)|последн[а-яё]*\s+принят[а-яё]*\s+блок|текущ[а-яё]*\s+(?:высот|tip)/.test(question);
  const exactFutureHeight = route.subject === "blocks" && /2030|future|будущ|точн[а-яё]*\s+block\s*height|exact\s+block\s+height/.test(question);
  const subsidyVsReward = route.subject === "subsidy" && /отлич|difference|total\s+(?:miner\s+)?reward|общ[а-яё]*\s+наград/.test(question);
  const miningIssuance = route.subject === "mining" && /выпуск|эмисси|issuance|new\s+(?:btc|coins?)/.test(question);
  let direct = pick(locale, item.direct);
  if (subsidyVsReward) direct = isRu ? "Block subsidy — это новые BTC по графику эмиссии; общая награда майнера за блок равна subsidy плюс допустимые комиссии из уже существующих BTC." : "Block subsidy is newly issued BTC under the issuance schedule; total miner reward for a block is subsidy plus valid transaction fees paid from existing BTC.";
  if (miningIssuance) direct = isRu ? "Майнинг связывает Proof of Work и эмиссию через допустимый блок: майнер доказывает работу, а coinbase может получить не больше протокольной subsidy плюс комиссии; новые BTC появляются только в части subsidy." : "Mining links proof of work and issuance through a valid block: a miner proves work, and coinbase may claim no more than the protocol subsidy plus fees; only the subsidy portion creates new BTC.";
  if (latestBlockState) direct = isRu ? "Точный текущий tip/height нельзя назвать без привязанного динамического chain-state snapshot; этот публичный ответ не будет выдумывать состояние цепи." : "The exact current tip/height cannot be stated without a bound dynamic chain-state snapshot; this public answer will not invent chain state.";
  if (exactFutureHeight) direct = isRu ? "Точная высота блока на календарную дату 1 января 2030 заранее неизвестна: её можно только оценивать из предположений о времени блоков, а не утверждать как факт." : "The exact block height on a calendar date such as 1 January 2030 is not knowable in advance; it can only be estimated from block-time assumptions, not stated as fact.";
  return {
    answer_state: latestBlockState ? "LIMITED" : "CONFIRMED",
    answer_mode: (route.intents.includes("fact") || supplyFact || genesisFact || latestBlockState) ? "PROTOCOL_FACT" : "PROTOCOL_EXPLAIN",
    headline: pick(locale, item.headline),
    direct_answer: direct,
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
