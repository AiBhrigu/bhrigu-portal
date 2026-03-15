import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import React from "react";

import {
  getAccessReviewRecordById,
  getAccessReviewStorageMeta,
  listAccessReviewRecords,
} from "../lib/access-review-read.js";

type ReviewRecord = {
  requestId: string;
  submittedAt: string;
  updatedAt: string;
  status: string;
  request: {
    name: string;
    email: string;
    subjectType: string;
    mainQuestion: string;
    shortDescription: string;
  };
  freyCtx: string;
  freyPreview: Record<string, string> | null;
  triage: {
    intake_score: number | null;
    priority_band: string;
    route_hint: string;
    signal_class: string;
    operational_vector: string;
  } | null;
  intake_score: number | null;
  priority_band: string;
  route_hint: string;
  operatorPacket: unknown;
};

type Props = {
  generatedAt: string;
  mode: "list" | "single";
  queryId: string;
  record: ReviewRecord | null;
  records: ReviewRecord[];
  storageMeta: {
    version: string;
    rootDir: string;
    recordsDir: string;
    indexFile: string;
  };
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const queryId = typeof query.id === "string" ? query.id.trim() : "";
  const mode = queryId ? "single" : "list";

  const record = queryId ? await getAccessReviewRecordById(queryId) : null;
  const records = queryId ? [] : await listAccessReviewRecords(10);
  const storageMeta = getAccessReviewStorageMeta();

  return {
    props: {
      generatedAt: new Date().toISOString(),
      mode,
      queryId,
      record,
      records,
      storageMeta,
    },
  };
};

function MonoBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "14px 16px",
        overflowX: "auto",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "#d6d6d6",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontSize: 12,
        lineHeight: 1.55,
      }}
    >
      {children}
    </pre>
  );
}

function ReviewCard({ record }: { record: ReviewRecord }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        padding: 18,
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 18 }}>{record.requestId || "unknown"}</div>
        <div style={{ color: "#a3a3a3", fontSize: 13 }}>
          status: {record.status || "unknown"} · submitted: {record.submittedAt || "n/a"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <Metric label="intake_score" value={record.intake_score ?? "n/a"} />
        <Metric label="priority_band" value={record.priority_band || "n/a"} />
        <Metric label="route_hint" value={record.route_hint || "n/a"} />
        <Metric label="signal_class" value={record.triage?.signal_class || record.freyPreview?.signal_class || "n/a"} />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: "#ffffff", fontWeight: 600 }}>request</div>
        <MonoBlock>
{JSON.stringify(record.request, null, 2)}
        </MonoBlock>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: "#ffffff", fontWeight: 600 }}>frey_ctx</div>
        <MonoBlock>{record.freyCtx || "EMPTY"}</MonoBlock>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: "#ffffff", fontWeight: 600 }}>decoded_frey_preview</div>
        <MonoBlock>{JSON.stringify(record.freyPreview ?? null, null, 2)}</MonoBlock>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: "#ffffff", fontWeight: 600 }}>operator_packet</div>
        <MonoBlock>{JSON.stringify(record.operatorPacket ?? null, null, 2)}</MonoBlock>
      </div>

      <div>
        <a
          href={`/access-review?id=${encodeURIComponent(record.requestId)}`}
          style={{ color: "#d7b66f", textDecoration: "none", fontWeight: 600 }}
        >
          open single view
        </a>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        padding: "12px 14px",
      }}
    >
      <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>{String(value)}</div>
    </div>
  );
}

export default function AccessReviewPage({
  generatedAt,
  mode,
  queryId,
  record,
  records,
  storageMeta,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e5e5e5",
        padding: "32px 20px 80px",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 18,
            padding: 20,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ color: "#d7b66f", fontWeight: 700, fontSize: 13 }}>
            __OPERATOR_REVIEW_SURFACE_V0_1__
          </div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15, color: "#ffffff" }}>Access Review</h1>
          <div style={{ color: "#a3a3a3", fontSize: 14 }}>
            generatedAt: {generatedAt} · mode: {mode}
            {queryId ? ` · id: ${queryId}` : ""}
          </div>
          <div>
            <a href="/access-review" style={{ color: "#d7b66f", textDecoration: "none", fontWeight: 600 }}>
              latest view
            </a>
          </div>
        </header>

        <section style={{ display: "grid", gap: 8 }}>
          <div style={{ color: "#ffffff", fontWeight: 600 }}>storage_meta</div>
          <MonoBlock>{JSON.stringify(storageMeta, null, 2)}</MonoBlock>
        </section>

        {mode === "single" ? (
          record ? (
            <ReviewCard record={record} />
          ) : (
            <section
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 16,
                padding: 18,
                color: "#a3a3a3",
              }}
            >
              record not found
            </section>
          )
        ) : records.length > 0 ? (
          <div style={{ display: "grid", gap: 16 }}>
            {records.map((item) => (
              <ReviewCard key={item.requestId || item.submittedAt} record={item} />
            ))}
          </div>
        ) : (
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 18,
              color: "#a3a3a3",
            }}
          >
            no stored submissions found
          </section>
        )}
      </div>
    </main>
  );
}
