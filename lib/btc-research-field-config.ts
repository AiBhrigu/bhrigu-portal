export type BtcResearchFieldConfig={enabled:true;databaseUrl:string}|{enabled:false};
export function getBtcResearchFieldConfig(env:Partial<NodeJS.ProcessEnv>=process.env):BtcResearchFieldConfig{
  const mode=env.BTC_RESEARCH_FIELD_MODE?.trim(); const databaseUrl=env.BTC_RESEARCH_FIELD_DATABASE_URL?.trim();
  if(mode!=="preview_v1"||!databaseUrl||env.VERCEL_ENV==="production") return {enabled:false};
  return {enabled:true,databaseUrl};
}
