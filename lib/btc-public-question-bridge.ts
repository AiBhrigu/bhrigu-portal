import { normalizeBtcDisplayQuestion, type BtcExampleRouteId } from "./btc-public-language-contract";

const CYRILLIC=/[\u0400-\u04ff]/;
const RU_UNSAFE=/(купить|продать|покупать|продавать|вход|выход|лонг|шорт|плеч[оа]|ценов\w*\s+цел|торгов\w*\s+(сигнал|стратег)|какую\s+сделк|точк\w*\s+(вход|выход))/i;

export function classifyRussianBtcQuestion(question:string):BtcExampleRouteId|"gravity"|"participation"|"general"{
  const q=question.toLowerCase();
  if(/(доминир|гравитац|лидерств|доля\s+btc)/i.test(q))return"gravity";
  if(/(ликвид|tvl|стейблкоин|dex|объ[её]м)/i.test(q))return"liquidity";
  if(/(ширин|ротац|альткоин|участи|eth)/i.test(q))return"participation";
  if(/(структур|режим|field score|капитализац)/i.test(q))return"structure_confirmation";
  if(/(времен|давлен|дата|даты|дате|дату|датой|фаз|напряж|тайминг|цикл|окн|контекст\s+наблюден)/i.test(q))return"temporal_context";
  if(/(измен|памят|предыдущ|дельт|снимок|сравнен)/i.test(q))return"accepted_memory";
  return"general";
}

export function canonicalizeBtcQuestionForRouter(question:string):string{
  const q=normalizeBtcDisplayQuestion(question);
  if(!CYRILLIC.test(q))return q;
  if(RU_UNSAFE.test(q))return"Should I buy or sell BTC now, and what price target should I use?";
  switch(classifyRussianBtcQuestion(q)){
    case"gravity":return"What does BTC dominance mean for the wider market gravity?";
    case"liquidity":return"What do stablecoin share, DeFi TVL and DEX volume show about current BTC liquidity?";
    case"participation":return"What do altcoin breadth, rotation and wider market participation show around BTC?";
    case"structure_confirmation":return"Do regime, Market Field Score and market cap confirm the current BTC structure?";
    case"temporal_context":return"How does the selected date change the BTC observation context and temporal pressure?";
    case"accepted_memory":return"What changed in accepted Snapshot Memory since the previous verified snapshot?";
    default:return"What is the current BTC field overview and why does it matter?";
  }
}
