import { neon } from "@neondatabase/serverless";
import {
  BTC_RESEARCH_FIELD_MAX_TURNS,
  BTC_RESEARCH_FIELD_SERVICE_MS,
  BTC_RESEARCH_FIELD_TURN_CLAIM_MS,
  newBtcResearchFieldIdentity,
  type BtcResearchFieldCheckpoint,
  type BtcResearchFieldConfigInput,
  type BtcResearchFieldRecord,
} from "./btc-research-field-v1";

const arrayOfStrings = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : [];
const nullableIso = (value: unknown): string | null => value ? new Date(String(value)).toISOString() : null;

function mapField(row: any): BtcResearchFieldRecord {
  return {
    fieldId: String(row.field_id),
    secretHash: String(row.secret_hash),
    status: row.status,
    locale: row.locale,
    title: String(row.title),
    primaryQuestion: String(row.primary_question),
    timeHorizon: row.time_horizon ? String(row.time_horizon) : null,
    evidencePreferences: arrayOfStrings(row.evidence_preferences),
    watchConditions: arrayOfStrings(row.watch_conditions),
    exactPolymarketContracts: arrayOfStrings(row.exact_polymarket_contracts),
    serviceStart: nullableIso(row.service_start),
    serviceEnd: nullableIso(row.service_end),
    completedTurns: Number(row.completed_turns),
    activeTurnId: row.active_turn_id ? String(row.active_turn_id) : null,
    activeTurnClaimedAt: nullableIso(row.active_turn_claimed_at),
  };
}

function mapCheckpoint(row: any): BtcResearchFieldCheckpoint {
  return {
    checkpointId: String(row.checkpoint_id),
    fieldId: String(row.field_id),
    role: row.role,
    acceptedAt: new Date(String(row.accepted_at)).toISOString(),
    question: String(row.question),
    answer: String(row.answer),
    topic: String(row.topic),
    asOf: new Date(String(row.as_of)).toISOString(),
    sources: row.sources,
    evidenceState: row.evidence_state,
    boundaryState: row.boundary_state,
    continuityDigest: String(row.continuity_digest),
  };
}

export function createNeonBtcResearchFieldStore(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return {
    async createPendingField(config: BtcResearchFieldConfigInput) {
      const identity = newBtcResearchFieldIdentity();
      const at = new Date().toISOString();
      const rows = await sql`
        INSERT INTO btc_research_fields (
          field_id,secret_hash,status,locale,title,primary_question,time_horizon,
          evidence_preferences,watch_conditions,exact_polymarket_contracts,
          service_start,service_end,completed_turns,created_at,updated_at
        ) VALUES (
          ${identity.fieldId},${identity.secretHash},'PENDING_PAYMENT',${config.locale},${config.title},${config.primaryQuestion},${config.timeHorizon},
          ${JSON.stringify(config.evidencePreferences)}::jsonb,${JSON.stringify(config.watchConditions)}::jsonb,${JSON.stringify(config.exactPolymarketContracts)}::jsonb,
          NULL,NULL,0,${at},${at}
        ) RETURNING *
      `;
      return { field: mapField(rows[0]), secret: identity.secret };
    },

    async findField(fieldId: string) {
      const rows = await sql`SELECT * FROM btc_research_fields WHERE field_id=${fieldId} LIMIT 1`;
      return rows[0] ? mapField(rows[0]) : null;
    },

    async activatePreview(fieldId: string, now = new Date()) {
      const start = now.toISOString();
      const end = new Date(now.getTime() + BTC_RESEARCH_FIELD_SERVICE_MS).toISOString();
      const rows = await sql`
        UPDATE btc_research_fields
        SET status='ACTIVE',service_start=${start},service_end=${end},updated_at=${start}
        WHERE field_id=${fieldId} AND status='PENDING_PAYMENT'
        RETURNING *
      `;
      return rows[0] ? mapField(rows[0]) : null;
    },

    async checkpoints(fieldId: string) {
      const rows = await sql`
        SELECT * FROM btc_research_field_checkpoints
        WHERE field_id=${fieldId}
        ORDER BY accepted_at ASC,checkpoint_id ASC
      `;
      return rows.map(mapCheckpoint);
    },

    async completedTurnMatches(fieldId: string, turnId: string, resultHash: string) {
      const rows = await sql`
        SELECT 1 FROM btc_research_field_usage
        WHERE field_id=${fieldId} AND turn_id=${turnId} AND state='COMPLETED' AND result_hash=${resultHash}
        LIMIT 1
      `;
      return rows.length === 1;
    },

    async insertCheckpoint(input: any) {
      const rows = await sql`
        INSERT INTO btc_research_field_checkpoints (
          checkpoint_id,field_id,role,accepted_at,question,answer,topic,as_of,
          sources,evidence_state,boundary_state,continuity_digest
        ) VALUES (
          ${input.checkpointId},${input.fieldId},${input.role},${input.acceptedAt},${input.question},${input.answer},${input.topic},${input.asOf},
          ${JSON.stringify(input.sources)}::jsonb,${JSON.stringify(input.evidenceState)}::jsonb,${JSON.stringify(input.boundaryState)}::jsonb,${input.continuityDigest}
        ) RETURNING *
      `;
      return mapCheckpoint(rows[0]);
    },

    async claimTurn(fieldId: string, turnId: string, now = new Date()) {
      const at = now.toISOString();
      const staleBefore = new Date(now.getTime() - BTC_RESEARCH_FIELD_TURN_CLAIM_MS).toISOString();
      const rows = await sql`
        WITH stale_usage AS (
          UPDATE btc_research_field_usage
          SET state='FAILED'
          WHERE field_id=${fieldId} AND state='STARTED' AND claimed_at<${staleBefore}
        ), field_guard AS (
          UPDATE btc_research_fields
          SET active_turn_id=${turnId},active_turn_claimed_at=${at},updated_at=${at}
          WHERE field_id=${fieldId}
            AND status='ACTIVE'
            AND service_start<=${at}
            AND service_end>${at}
            AND completed_turns<${BTC_RESEARCH_FIELD_MAX_TURNS}
            AND (active_turn_id IS NULL OR active_turn_claimed_at<${staleBefore})
          RETURNING field_id
        )
        INSERT INTO btc_research_field_usage(turn_id,field_id,state,claimed_at)
        SELECT ${turnId},field_id,'STARTED',${at} FROM field_guard
        RETURNING turn_id
      `;
      return rows.length === 1;
    },

    async completeTurn(fieldId: string, turnId: string, usage: { input_tokens: number; output_tokens: number; web_search_calls: number }, resultHash: string, now = new Date()) {
      const at = now.toISOString();
      const cost = usage.input_tokens * 5 + usage.output_tokens * 30 + usage.web_search_calls * 10_000;
      const rows = await sql`
        WITH usage_done AS (
          UPDATE btc_research_field_usage
          SET state='COMPLETED',completed_at=${at},input_tokens=${usage.input_tokens},output_tokens=${usage.output_tokens},
              web_search_calls=${usage.web_search_calls},nominal_cost_micros=${cost},result_hash=${resultHash}
          WHERE turn_id=${turnId} AND field_id=${fieldId} AND state='STARTED'
            AND EXISTS (SELECT 1 FROM btc_research_fields WHERE field_id=${fieldId} AND active_turn_id=${turnId})
          RETURNING turn_id
        ), field_done AS (
          UPDATE btc_research_fields
          SET completed_turns=completed_turns+1,active_turn_id=NULL,active_turn_claimed_at=NULL,updated_at=${at}
          WHERE field_id=${fieldId} AND active_turn_id=${turnId} AND EXISTS(SELECT 1 FROM usage_done)
          RETURNING completed_turns
        )
        SELECT completed_turns FROM field_done
      `;
      if (!rows[0]) throw new Error("research_field_turn_complete_conflict");
      return Number(rows[0].completed_turns);
    },

    async failTurn(fieldId: string, turnId: string) {
      await sql`
        WITH field_failed AS (
          UPDATE btc_research_fields
          SET active_turn_id=NULL,active_turn_claimed_at=NULL,updated_at=NOW()
          WHERE field_id=${fieldId} AND active_turn_id=${turnId}
          RETURNING field_id
        )
        UPDATE btc_research_field_usage
        SET state='FAILED'
        WHERE turn_id=${turnId} AND field_id=${fieldId} AND state='STARTED' AND EXISTS(SELECT 1 FROM field_failed)
      `;
    },
  };
}
