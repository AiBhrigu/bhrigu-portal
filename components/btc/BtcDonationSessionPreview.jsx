import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import QRCode from "qrcode";

const SYNTHETIC_STATES = new Set(["awaiting_payment", "mempool_seen", "confirmed", "confirmation_lost", "retired"]);

export default function BtcDonationSessionPreview() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const syntheticState = useMemo(() => {
    const raw = Array.isArray(router.query.syntheticReceipt) ? router.query.syntheticReceipt[0] : router.query.syntheticReceipt;
    return SYNTHETIC_STATES.has(raw) ? raw : null;
  }, [router.query.syntheticReceipt]);

  useEffect(() => {
    let cancelled = false;
    setQrDataUrl("");
    if (!session?.bip321Uri) return undefined;
    QRCode.toDataURL(session.bip321Uri, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 288,
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    }).catch(() => {
      if (!cancelled) setError("Local QR generation failed.");
    });
    return () => { cancelled = true; };
  }, [session?.bip321Uri]);

  useEffect(() => {
    if (!session?.sessionId || session.state === "retired") return undefined;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/donation/session/${encodeURIComponent(session.sessionId)}`, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled && body?.ok && body.session) setSession(body.session);
      } catch {
        // Polling is best-effort; the durable server state remains authoritative.
      }
    };
    const timer = window.setInterval(refresh, 8000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session?.sessionId, session?.state]);

  async function startSession() {
    if (busy) return;
    setBusy(true);
    setError("");
    setCopied(false);
    const sessionId = `don_session_${window.crypto.randomUUID()}`;
    try {
      const response = await fetch("/api/donation/session", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok || !body.session) {
        throw new Error(body?.errorCode === "address_unavailable" ? "No fresh donation address is available in this preview." : "Donation session is unavailable.");
      }
      setSession(body.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Donation session is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function retireSession() {
    if (!session?.sessionId || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/donation/session/${encodeURIComponent(session.sessionId)}/retire`, {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const body = await response.json().catch(() => null);
      if (body?.session) setSession(body.session);
      if (!response.ok) throw new Error(body?.errorCode === "receipt_already_observed" ? "This session already has receipt evidence and cannot be retired as abandoned." : "Session retirement is unavailable.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session retirement is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress() {
    if (!session?.receiveAddress) return;
    try {
      await navigator.clipboard.writeText(session.receiveAddress);
      setCopied(true);
    } catch {
      setError("Address copy is unavailable in this browser.");
    }
  }

  const stateCopy = donationSessionStateCopy(session?.state ?? "awaiting_payment");
  const syntheticCopy = syntheticState ? donationSessionStateCopy(syntheticState) : null;

  return (
    <section className="donation" data-donation-preview="exact-branch-only">
      <div className="previewFlag">Protected Preview · No real BTC</div>
      <h2>Donate Bitcoin</h2>
      <p className="intro">
        A voluntary support signal for BHRIGU research and public infrastructure. It does not purchase a service, access, priority, or entitlement.
      </p>

      {!session && (
        <button className="primary" type="button" onClick={startSession} disabled={busy} data-donation-start>
          {busy ? "Opening session…" : "Donate Bitcoin"}
        </button>
      )}

      {session && (
        <div className="session" data-donation-session-state={session.state}>
          <div className="stateRow">
            <span className={`state state-${session.state}`}>{stateCopy.label}</span>
            <span className="expiry">Session expires {formatTime(session.expiresAt)}</span>
          </div>
          <p className="stateDetail">{stateCopy.detail}</p>

          {session.receiveAddress && session.bip321Uri && (
            <>
              <div className="qrShell" data-local-qr>
                {qrDataUrl ? <img src={qrDataUrl} width="288" height="288" alt="Bitcoin donation QR generated locally in this browser" /> : <div className="qrLoading">Generating QR locally…</div>}
              </div>
              <div className="addressBlock">
                <div className="micro">Fresh address · one session only</div>
                <code>{session.receiveAddress}</code>
                <div className="addressActions">
                  <button type="button" className="secondary" onClick={copyAddress}>{copied ? "Copied" : "Copy address"}</button>
                  <a className="secondary" href={session.bip321Uri}>Open Bitcoin wallet</a>
                </div>
              </div>
              <p className="amountNote">
                Choose the amount in your wallet. The BIP321 URI and QR contain only <code>bitcoin:&lt;address&gt;</code> — no amount, label, or message.
              </p>
              <p className="stopNote"><strong>Preview boundary:</strong> do not send real BTC to this address.</p>
            </>
          )}

          {session.observedSats && (
            <p className="receiptEvidence">Observed receipt: {session.observedSats} sats · confirmations: {session.confirmations ?? 0}</p>
          )}

          {session.state === "awaiting_payment" && (
            <button className="retire" type="button" onClick={retireSession} disabled={busy} data-donation-retire>
              End unused session
            </button>
          )}
        </div>
      )}

      {syntheticCopy && (
        <div className="synthetic" data-synthetic-receipt-state={syntheticState}>
          <div className="micro">Synthetic receipt evidence · UI only</div>
          <strong>{syntheticCopy.label}</strong>
          <p>{syntheticCopy.detail}</p>
          <p>No chain observation was performed. This panel exists only for protected Preview rendering acceptance.</p>
        </div>
      )}

      {error && <p className="error" role="status">{error}</p>}

      <style jsx>{`
        .donation { margin-top: 22px; padding: 20px; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: rgba(255,255,255,.025); }
        .previewFlag, .micro { font-size: 11px; letter-spacing: .11em; text-transform: uppercase; opacity: .68; }
        h2 { margin: 8px 0 10px; font-size: 27px; }
        .intro, .stateDetail, .amountNote, .stopNote, .receiptEvidence, .synthetic p { line-height: 1.55; opacity: .86; }
        .primary, .secondary, .retire { appearance: none; font: inherit; cursor: pointer; }
        .primary { min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.09); color: inherit; font-weight: 650; }
        .primary:disabled, .retire:disabled { opacity: .55; cursor: wait; }
        .session { margin-top: 16px; }
        .stateRow { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .state { display: inline-flex; min-height: 30px; align-items: center; padding: 0 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,.13); font-size: 13px; }
        .expiry { font-size: 12px; opacity: .66; }
        .qrShell { width: min(100%, 320px); min-height: 320px; margin: 18px auto; display: grid; place-items: center; padding: 16px; border-radius: 18px; background: #fff; }
        .qrShell img { display: block; width: 100%; height: auto; max-width: 288px; }
        .qrLoading { color: #111; font-size: 13px; }
        .addressBlock { margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.12); }
        .addressBlock code { display: block; margin-top: 8px; overflow-wrap: anywhere; font-size: 13px; line-height: 1.5; }
        .addressActions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .secondary { min-height: 36px; display: inline-flex; align-items: center; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: transparent; color: inherit; text-decoration: none; }
        .retire { margin-top: 8px; padding: 0; border: 0; background: transparent; color: inherit; text-decoration: underline; text-underline-offset: 3px; opacity: .72; }
        .stopNote { padding: 11px 13px; border-radius: 12px; border: 1px solid rgba(255,255,255,.09); }
        .synthetic { margin-top: 18px; padding: 14px; border-radius: 14px; border: 1px dashed rgba(255,255,255,.18); }
        .synthetic strong { display: block; margin-top: 7px; }
        .synthetic p { margin: 6px 0 0; }
        .error { margin: 14px 0 0; line-height: 1.5; }
        @media (max-width: 560px) {
          .donation { padding: 16px; }
          .qrShell { min-height: 0; padding: 12px; }
          .primary { width: 100%; justify-content: center; }
        }
      `}</style>
    </section>
  );
}

function formatTime(value) {
  try { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return "soon"; }
}

function donationSessionStateCopy(state) {
  const copy = {
    awaiting_payment: ["Awaiting payment", "No Bitcoin receipt has been observed for this session."],
    mempool_seen: ["Seen on network", "A matching transaction output has been observed but is not yet confirmed."],
    confirmed: ["Confirmed", "A matching output has at least one SPV-verified confirmation."],
    confirmation_lost: ["Confirmation changed", "A previously confirmed output lost its confirmed state and requires observation."],
    retired: ["Session retired", "This receive address will never be issued to another donation session."],
  };
  const [label, detail] = copy[state] ?? copy.awaiting_payment;
  return { label, detail };
}
