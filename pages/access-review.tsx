import Head from "next/head";
import type { GetServerSideProps } from "next";

import {
  getAccessReviewRuntimeConfig,
} from "../lib/access-intake-config";
import {
  createNeonAccessIntakeStore,
  type AccessReviewRequest,
} from "../lib/access-intake-neon";
import {
  getAccessReviewAuth0Client,
  isAuthorizedAccessOperator,
} from "../lib/access-review-auth0";

interface AccessReviewProps {
  requests: AccessReviewRequest[];
}

export const getServerSideProps: GetServerSideProps<AccessReviewProps> = async ({
  req,
  res,
}) => {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  const runtime = getAccessReviewRuntimeConfig();
  if (!runtime.enabled) return { notFound: true };

  try {
    const session = await getAccessReviewAuth0Client().getSession(req as any);
    if (!isAuthorizedAccessOperator(session, runtime.operatorEmail)) {
      return { notFound: true };
    }

    const requests = await createNeonAccessIntakeStore(
      runtime.databaseUrl
    ).listForReview(20);
    return { props: { requests } };
  } catch {
    return { notFound: true };
  }
};

export default function AccessReviewPage({ requests }: AccessReviewProps) {
  return (
    <>
      <Head>
        <title>Private Access Review · BHRIGU</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>
      <main style={styles.main}>
        <div style={styles.shell}>
          <p style={styles.eyebrow}>Private operator surface</p>
          <h1 style={styles.title}>Access review</h1>
          <p style={styles.lead}>
            Durable requests visible only to the authorized BHRIGU operator.
          </p>

          {requests.length === 0 ? (
            <p style={styles.empty}>No durable requests.</p>
          ) : (
            requests.map(({ record, deliveries }) => {
              if (record.schema === "founding_v0_1") {
                const founding = record.data;
                return (
                  <article key={founding.requestId} style={styles.card}>
                    <div style={styles.metaRow}>
                      <strong>{founding.requestId}</strong>
                      <span>{founding.createdAt}</span>
                    </div>
                    <h2 style={styles.question}>{founding.trackingQuestion}</h2>
                    <p style={styles.copy}>
                      {founding.currentBitcoinContext ??
                        "No current Bitcoin context supplied."}
                    </p>
                    <dl style={styles.grid}>
                      <div>
                        <dt style={styles.label}>Name / handle</dt>
                        <dd style={styles.value}>{founding.nameOrHandle}</dd>
                      </div>
                      <div>
                        <dt style={styles.label}>Contact</dt>
                        <dd style={styles.value}>{founding.contact}</dd>
                      </div>
                      <div>
                        <dt style={styles.label}>Primary interest</dt>
                        <dd style={styles.value}>{founding.primaryInterest}</dd>
                      </div>
                      <div>
                        <dt style={styles.label}>Status</dt>
                        <dd style={styles.value}>{founding.status}</dd>
                      </div>
                      <div>
                        <dt style={styles.label}>Locale</dt>
                        <dd style={styles.value}>{founding.locale}</dd>
                      </div>
                      <div>
                        <dt style={styles.label}>Open to paying after scope</dt>
                        <dd style={styles.value}>
                          {founding.willingToPayAfterScopeAcceptance ? "YES" : "NO / NOT STATED"}
                        </dd>
                      </div>
                    </dl>
                    <DeliveryBadges deliveries={deliveries} />
                  </article>
                );
              }

              const access = record.data;
              return (
                <article key={access.requestId} style={styles.card}>
                  <div style={styles.metaRow}>
                    <strong>{access.requestId}</strong>
                    <span>{access.createdAt}</span>
                  </div>
                  <h2 style={styles.question}>{access.request.mainQuestion}</h2>
                  <p style={styles.copy}>{access.request.shortDescription}</p>
                  <dl style={styles.grid}>
                    <div>
                      <dt style={styles.label}>Name</dt>
                      <dd style={styles.value}>{access.request.name}</dd>
                    </div>
                    <div>
                      <dt style={styles.label}>Email</dt>
                      <dd style={styles.value}>{access.request.email}</dd>
                    </div>
                    <div>
                      <dt style={styles.label}>Subject</dt>
                      <dd style={styles.value}>{access.request.subjectType}</dd>
                    </div>
                    <div>
                      <dt style={styles.label}>Likely level</dt>
                      <dd style={styles.value}>{access.derived.likelyLevel}</dd>
                    </div>
                  </dl>
                  <DeliveryBadges deliveries={deliveries} />
                </article>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}

function DeliveryBadges({
  deliveries,
}: Pick<AccessReviewRequest, "deliveries">) {
  return (
    <div style={styles.deliveryRow}>
      {deliveries.map((delivery) => (
        <span key={delivery.kind} style={styles.badge}>
          {delivery.kind}: {delivery.state} ({delivery.attempts})
        </span>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#07111b",
    color: "#eaf1f7",
    padding: "36px 18px 72px",
  },
  shell: { maxWidth: 920, margin: "0 auto" },
  eyebrow: {
    color: "#8da0b3",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: 12,
  },
  title: { fontSize: 38, margin: "10px 0" },
  lead: { color: "#b7c5d1", lineHeight: 1.6, marginBottom: 28 },
  empty: { border: "1px solid #263747", borderRadius: 14, padding: 20 },
  card: {
    border: "1px solid #263747",
    borderRadius: 16,
    background: "#0c1825",
    padding: 22,
    marginBottom: 16,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    color: "#8da0b3",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 13,
  },
  question: { fontSize: 22, margin: "18px 0 10px" },
  copy: { color: "#c9d5df", lineHeight: 1.65 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    margin: "20px 0",
  },
  label: { color: "#8da0b3", fontSize: 12, marginBottom: 4 },
  value: { margin: 0, overflowWrap: "anywhere" },
  deliveryRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  badge: {
    border: "1px solid #31475a",
    borderRadius: 999,
    padding: "6px 10px",
    color: "#b7c5d1",
    fontSize: 12,
  },
};
