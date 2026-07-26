import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import React from "react";

import { getAuthorizedPrivateAccessSubmission } from "../lib/access-private-intake";
import { sanitizeReviewRecord } from "../lib/access-review-read.js";

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
  record: ReviewRecord;
};

const COOKIE_NAME = "__Host-bhrigu-access-review";
const COOKIE_MAX_AGE_SECONDS = 1800;

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
  req,
  res,
}) => {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");

  const requestId = first(query.id).trim();
  const queryToken = first(query.token).trim();
  const cookieToken = readReviewCookie(req.headers.cookie, requestId);
  const reviewToken = queryToken || cookieToken;

  if (!requestId || !reviewToken) return { notFound: true };

  try {
    const envelope = await getAuthorizedPrivateAccessSubmission(
      requestId,
      reviewToken
    );
    if (!envelope) return { notFound: true };

    if (queryToken) {
      res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${encodeURIComponent(
          `${requestId}.${queryToken}`
        )}; Path=/access-review; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Strict`
      );
      return {
        redirect: {
          destination: `/access-review?id=${encodeURIComponent(requestId)}`,
          permanent: false,
        },
      };
    }

    const record = sanitizeReviewRecord(envelope.record) as ReviewRecord | null;
    if (!record) return { notFound: true };

    return {
      props: {
        generatedAt: new Date().toISOString(),
        record,
      },
    };
  } catch {
    return { notFound: true };
  }
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function readReviewCookie(
  rawCookie: string | undefined,
  requestId: string
): string {
  if (!rawCookie || !requestId) return "";
  const item = rawCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!item) return "";
  const decoded = decodeURIComponent(item.slice(COOKIE_NAME.length + 1));
  const prefix = `${requestId}.`;
  return decoded.startsWith(prefix) ? decoded.slice(prefix.length) : "";
}

function MonoBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="monoBlock">{children}</pre>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

export default function AccessReviewPage({
  generatedAt,
  record,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Private Access Review · BHRIGU</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main>
        <div className="shell">
          <header>
            <p>OPERATOR-ONLY · PRIVATE INTAKE</p>
            <h1>{record.requestId}</h1>
            <span>
              status: {record.status || "unknown"} · submitted: {record.submittedAt || "n/a"}
            </span>
            <small>rendered {generatedAt}</small>
          </header>

          <section className="metrics">
            <Metric label="intake score" value={record.intake_score ?? "n/a"} />
            <Metric label="priority band" value={record.priority_band || "n/a"} />
            <Metric label="route hint" value={record.route_hint || "n/a"} />
            <Metric
              label="signal class"
              value={record.triage?.signal_class || record.freyPreview?.signal_class || "n/a"}
            />
          </section>

          <section className="card">
            <h2>Client request</h2>
            <dl>
              <div><dt>Name</dt><dd>{record.request.name}</dd></div>
              <div><dt>Email</dt><dd>{record.request.email}</dd></div>
              <div><dt>Subject</dt><dd>{record.request.subjectType}</dd></div>
            </dl>
            <h3>Main question</h3>
            <p>{record.request.mainQuestion}</p>
            <h3>Short description</h3>
            <p>{record.request.shortDescription}</p>
          </section>

          <section className="card">
            <h2>Operator packet</h2>
            <MonoBlock>{JSON.stringify(record.operatorPacket ?? null, null, 2)}</MonoBlock>
          </section>

          <section className="boundary">
            This capability is private, non-indexed, non-cacheable, and bound to one immutable request. Close the tab when review is complete.
          </section>
        </div>
      </main>
      <style jsx>{`
        :global(html) { background:#070b12; }
        :global(body) { margin:0; background:#070b12; color:#e7edf5; font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif; }
        main { min-height:100vh; padding:32px 18px 80px; background:radial-gradient(circle at top,rgba(215,182,111,.08),transparent 28%),linear-gradient(180deg,#07111b,#080b12); }
        .shell { max-width:1080px; margin:0 auto; display:grid; gap:18px; }
        header,.card,.boundary { border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.035); border-radius:18px; padding:20px; }
        header { display:grid; gap:8px; }
        header p { margin:0; color:#d7b66f; font-size:12px; font-weight:800; letter-spacing:.15em; }
        header h1 { margin:0; font-size:clamp(24px,4vw,38px); }
        header span,header small { color:#94a3b8; }
        .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
        .metric { border:1px solid rgba(255,255,255,.11); background:rgba(255,255,255,.03); border-radius:14px; padding:14px; display:grid; gap:7px; }
        .metric span { color:#94a3b8; font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
        .metric strong { color:#fff; overflow-wrap:anywhere; }
        h2 { margin:0 0 16px; color:#fff; }
        h3 { margin:18px 0 6px; color:#d7b66f; font-size:13px; text-transform:uppercase; letter-spacing:.08em; }
        p { overflow-wrap:anywhere; line-height:1.65; }
        dl { margin:0; display:grid; gap:8px; }
        dl div { display:grid; grid-template-columns:minmax(100px,160px) 1fr; gap:12px; }
        dt { color:#94a3b8; }
        dd { margin:0; overflow-wrap:anywhere; }
        .monoBlock { margin:0; padding:15px; overflow:auto; border-radius:14px; border:1px solid rgba(255,255,255,.1); background:#05080d; color:#d9e2ec; white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.55; }
        .boundary { color:#94a3b8; line-height:1.6; }
        @media(max-width:560px){ dl div{grid-template-columns:1fr;} main{padding-inline:12px;} }
      `}</style>
    </>
  );
}
