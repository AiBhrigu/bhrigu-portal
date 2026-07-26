import type {
  BtcEnvelopeQuestionClass,
  BtcSynthesisState,
} from "./btc-market-envelope";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export const BTC_EXECUTIVE_QUESTION_LANGUAGE_SCHEMA =
  "btc_executive_question_language_v0_1" as const;

const EXECUTIVE_FOCUS: Record<
  BtcPublicLocale,
  Record<BtcEnvelopeQuestionClass, string>
> = {
  en: {
    btc_gravity:
      "This read centers on BTC dominance and whether wider participation supports or diverges from that leadership.",
    market_structure:
      "This read checks whether regime, Field Score, market capitalization and liquidity describe the same structure.",
    liquidity:
      "This read tests whether stablecoin share, DeFi TVL and DEX activity support the current BTC context.",
    market_participation_rotation:
      "This read focuses on whether altcoin breadth and ETH rotation are broadening participation beyond BTC.",
    change_memory:
      "This read compares the current accepted snapshot with the previous compatible checkpoint.",
    temporal_pressure:
      "This read isolates the selected date's bounded temporal context while keeping market facts tied to the accepted snapshot.",
    general_btc_field:
      "This read combines BTC gravity, structure, liquidity, participation and accepted change memory into one bounded overview.",
  },
  ru: {
    btc_gravity:
      "Это чтение сосредоточено на доминировании BTC и на том, подтверждает ли более широкое участие его лидерство или расходится с ним.",
    market_structure:
      "Это чтение проверяет, описывают ли режим, Field Score, капитализация и ликвидность одну и ту же структуру.",
    liquidity:
      "Это чтение проверяет, поддерживают ли доля стейблкоинов, DeFi TVL и активность DEX текущий контекст BTC.",
    market_participation_rotation:
      "Это чтение показывает, расширяют ли ширина альткоинов и ротация ETH участие за пределами BTC.",
    change_memory:
      "Это чтение сравнивает текущий принятый снимок с предыдущей совместимой контрольной точкой.",
    temporal_pressure:
      "Это чтение отделяет ограниченный временной контекст выбранной даты, сохраняя рыночные факты привязанными к принятому снимку.",
    general_btc_field:
      "Это чтение объединяет гравитацию BTC, структуру, ликвидность, участие и принятую память изменений в один ограниченный обзор.",
  },
};

const SYNTHESIS_CLOSE: Record<
  BtcPublicLocale,
  Record<BtcSynthesisState, string>
> = {
  en: {
    CONFIRMATION:
      "The routed modules reinforce the same bounded interpretation.",
    DIVERGENCE:
      "The routed modules do not move as one field; that split is part of the result.",
    INSUFFICIENT_EVIDENCE:
      "The available evidence does not support a stronger conclusion.",
  },
  ru: {
    CONFIRMATION:
      "Маршрутизированные модули поддерживают одну ограниченную интерпретацию.",
    DIVERGENCE:
      "Маршрутизированные модули не движутся как единое поле; это расхождение является частью результата.",
    INSUFFICIENT_EVIDENCE:
      "Доступная доказательность не поддерживает более сильный вывод.",
  },
};

export function formatBtcQuestionExecutiveLead(
  locale: BtcPublicLocale,
  questionClass: BtcEnvelopeQuestionClass,
  state: BtcSynthesisState,
): string {
  return `${EXECUTIVE_FOCUS[locale][questionClass]} ${SYNTHESIS_CLOSE[locale][state]}`;
}

const WATCH_SUBJECT: Record<
  BtcPublicLocale,
  Record<BtcEnvelopeQuestionClass, string>
> = {
  en: {
    btc_gravity: "BTC dominance and alt-breadth changes",
    market_structure: "regime, Field Score, market-cap and liquidity changes",
    liquidity: "stablecoin-share, DeFi TVL and DEX-volume changes",
    market_participation_rotation: "alt-breadth and ETH-rotation changes",
    change_memory: "Snapshot Delta",
    temporal_pressure:
      "Snapshot Delta; the selected date does not create future market facts",
    general_btc_field: "changes in BTC gravity, liquidity and participation",
  },
  ru: {
    btc_gravity: "изменениями доминирования BTC и ширины альткоинов",
    market_structure:
      "изменениями режима, Field Score, капитализации и ликвидности",
    liquidity:
      "изменениями доли стейблкоинов, DeFi TVL и объёма DEX",
    market_participation_rotation:
      "изменениями ширины альткоинов и ротации ETH",
    change_memory: "Snapshot Delta",
    temporal_pressure:
      "Snapshot Delta; выбранная дата не создаёт будущие рыночные факты",
    general_btc_field:
      "изменениями гравитации BTC, ликвидности и участия",
  },
};

export function formatBtcQuestionWatchNext(
  locale: BtcPublicLocale,
  questionClass: BtcEnvelopeQuestionClass,
  timestamp: string,
): string {
  const subject = WATCH_SUBJECT[locale][questionClass];
  if (locale === "ru") {
    return `Наблюдайте за следующими принятыми ${subject} после ${timestamp}.`;
  }
  return `Watch the next accepted ${subject} after ${timestamp}.`;
}
