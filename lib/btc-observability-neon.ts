import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { BtcObservabilityRecord } from "./btc-observability-server";

export type BtcObservabilitySummary = {
  anonymousBrowsers: number;
  visitSessions: number;
  repeatBrowsers: number;
  chatTurns: number;
  answersCompleted: number;
  answersFailed: number;
  inputTokens: number;
  outputTokens: number;
  webSearchCalls: number;
  nominalCostMicros: number;
  supportClicks: number;
  supportReaches: number;
  supportSessions: number;
  receiptSessions: number;
};

export function createNeonBtcObservabilityStore(databaseUrl: string) {
  const sql = neon(databaseUrl);

  async function recordEvent(event: BtcObservabilityRecord, at = new Date()): Promise<void> {
    const occurredAt = at.toISOString();
    const expiresAt = new Date(at.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await sql`DELETE FROM btc_observability_events WHERE expires_at <= ${occurredAt}`;
    await sql`
      INSERT INTO btc_observability_events (
        event_id,occurred_at,event_type,anon_browser_key,visit_session_id,locale,surface,
        chat_turn_id,donation_session_id,model,input_tokens,output_tokens,web_search_calls,
        nominal_cost_micros,price_policy,completion_status,error_class,
        traffic_source,traffic_medium,traffic_campaign,expires_at
      ) VALUES (
        ${randomUUID()},${occurredAt},${event.eventType},${event.anonBrowserKey},${event.visitSessionId},${event.locale},${event.surface},
        ${event.chatTurnId},${event.donationSessionId},${event.model},${event.inputTokens},${event.outputTokens},${event.webSearchCalls},
        ${event.nominalCostMicros},${event.pricePolicy},${event.completionStatus},${event.errorClass},
        ${event.trafficSource},${event.trafficMedium},${event.trafficCampaign},${expiresAt}
      ) ON CONFLICT DO NOTHING
    `;
  }

  async function summary(since: Date, until: Date): Promise<BtcObservabilitySummary> {
    const rows = await sql`
      WITH scoped AS (
        SELECT * FROM btc_observability_events WHERE occurred_at >= ${since.toISOString()} AND occurred_at < ${until.toISOString()}
      ), browser_sessions AS (
        SELECT anon_browser_key,count(DISTINCT visit_session_id)::int AS sessions FROM scoped GROUP BY anon_browser_key
      ), support_started AS (
        SELECT DISTINCT donation_session_id FROM scoped WHERE event_type='BTC_SUPPORT_SESSION_STARTED' AND donation_session_id IS NOT NULL
      )
      SELECT
        (SELECT count(DISTINCT anon_browser_key)::int FROM scoped) AS anonymous_browsers,
        (SELECT count(DISTINCT visit_session_id)::int FROM scoped) AS visit_sessions,
        (SELECT count(*)::int FROM browser_sessions WHERE sessions > 1) AS repeat_browsers,
        (SELECT count(DISTINCT chat_turn_id)::int FROM scoped WHERE event_type='BTC_CHAT_QUESTION_SENT') AS chat_turns,
        (SELECT count(DISTINCT chat_turn_id)::int FROM scoped WHERE event_type='BTC_CHAT_ANSWER_COMPLETED') AS answers_completed,
        (SELECT count(DISTINCT chat_turn_id)::int FROM scoped WHERE event_type='BTC_CHAT_ANSWER_FAILED') AS answers_failed,
        (SELECT COALESCE(sum(input_tokens),0)::bigint FROM scoped WHERE event_type='BTC_CHAT_ANSWER_COMPLETED') AS input_tokens,
        (SELECT COALESCE(sum(output_tokens),0)::bigint FROM scoped WHERE event_type='BTC_CHAT_ANSWER_COMPLETED') AS output_tokens,
        (SELECT COALESCE(sum(web_search_calls),0)::bigint FROM scoped WHERE event_type='BTC_CHAT_ANSWER_COMPLETED') AS web_search_calls,
        (SELECT COALESCE(sum(nominal_cost_micros),0)::bigint FROM scoped WHERE event_type='BTC_CHAT_ANSWER_COMPLETED') AS nominal_cost_micros,
        (SELECT count(DISTINCT visit_session_id)::int FROM scoped WHERE event_type='BTC_SUPPORT_GLYPH_CLICKED') AS support_clicks,
        (SELECT count(DISTINCT visit_session_id)::int FROM scoped WHERE event_type='BTC_SUPPORT_PAGE_REACHED') AS support_reaches,
        (SELECT count(*)::int FROM support_started) AS support_sessions,
        (SELECT count(*)::int FROM support_started s WHERE EXISTS (SELECT 1 FROM btc_donation_receipts r WHERE r.session_id=s.donation_session_id)) AS receipt_sessions
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    const n = (key: string) => Number(row?.[key] ?? 0);
    return {
      anonymousBrowsers: n("anonymous_browsers"), visitSessions: n("visit_sessions"), repeatBrowsers: n("repeat_browsers"),
      chatTurns: n("chat_turns"), answersCompleted: n("answers_completed"), answersFailed: n("answers_failed"),
      inputTokens: n("input_tokens"), outputTokens: n("output_tokens"), webSearchCalls: n("web_search_calls"), nominalCostMicros: n("nominal_cost_micros"),
      supportClicks: n("support_clicks"), supportReaches: n("support_reaches"), supportSessions: n("support_sessions"), receiptSessions: n("receipt_sessions"),
    };
  }

  async function sourceSummary(since: Date, until: Date) {
    return sql`
      SELECT traffic_source,
        count(DISTINCT anon_browser_key)::int AS anonymous_browsers,
        count(DISTINCT visit_session_id)::int AS visit_sessions,
        count(DISTINCT chat_turn_id) FILTER (WHERE event_type='BTC_CHAT_QUESTION_SENT')::int AS chat_turns,
        count(DISTINCT visit_session_id) FILTER (WHERE event_type='BTC_SUPPORT_GLYPH_CLICKED')::int AS support_clicks,
        count(DISTINCT donation_session_id) FILTER (WHERE event_type='BTC_SUPPORT_SESSION_STARTED')::int AS support_sessions
      FROM btc_observability_events
      WHERE occurred_at >= ${since.toISOString()} AND occurred_at < ${until.toISOString()}
      GROUP BY traffic_source ORDER BY anonymous_browsers DESC,traffic_source
    `;
  }

  return { recordEvent, summary, sourceSummary };
}
