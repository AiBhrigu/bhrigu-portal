import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import QRCode from "qrcode";

const SYNTHETIC_STATES = new Set(["awaiting_payment", "mempool_seen", "confirmed", "confirmation_lost", "retired"]);
const RECEIPT_LOCKED_STATES = new Set(["mempool_seen", "confirmed", "confirmation_lost", "retired"]);
const SESSION_STORAGE_KEY = "bhrigu_btc_donation_session_v1";
const SYNTHETIC_ADDRESS = "synthetic-preview-address-not-for-payment";
const SUPPORT_COPY = {
  en: {
    title: "Support BHRIGU with Bitcoin",
    lines: [
      "This is voluntary support for BHRIGU research, architecture, infrastructure, and public continuity.",
      "It is not a payment for goods or services and does not provide access, priority, ownership, investment rights, tokens, or any other entitlement.",
      "BHRIGU does not present this support as a charitable or tax-deductible contribution.",
      "Send only BTC on the Bitcoin mainnet to the address shown for this session.",
      "No automatic refund mechanism is provided.",
    ],
    donate: "Donate Bitcoin",
    opening: "Opening session…",
    directAsk: "Support the work with Bitcoin.",
    suggestedTitle: "Suggested support",
    suggestedHint: "Suggestions only — choose any amount in your wallet. The QR remains amount-free.",
    suggestedAmounts: [
      ["10,000 sats", "Quiet support"],
      ["25,000 sats", "Keep the corridor live"],
      ["50,000 sats", "Infrastructure continuity"],
      ["100,000 sats", "Strong support"],
      ["Custom", "Choose freely"],
    ],
    restart: "Start new support session",
    activeSession: "Active support session",
    freshReceiverSignal: "Fresh receiver",
    safetyTitle: "Safety checks",
    safetySignals: ["Bitcoin mainnet", "One session · one address", "Send exactly once", "Never share seed / private keys"],
    oneTime: "THIS IS A NEW ONE-TIME BITCOIN ADDRESS.",
    freshAddress: "Fresh address · one session only",
    fingerprint: "Destination fingerprint",
    fingerprintHint: "Visual check only — do not type this fingerprint.",
    copy: "Copy raw BTC address",
    copied: "Raw BTC address copied",
    openWallet: "Open Bitcoin wallet",
    chooseAmount: "Choose the amount in your wallet. The BIP321 URI and QR contain only",
    noUriExtras: "no amount, label, or message.",
    mainnetOnly: "Bitcoin mainnet only. Do not use Lightning or another withdrawal network. Send exactly once.",
    seed: "BHRIGU WILL NEVER ASK FOR YOUR SEED PHRASE.",
    secrets: "BHRIGU never requests private keys or your wallet password.",
    walletTitle: "If your wallet still shows a previous BHRIGU address",
    walletSteps: [
      "WALLET APP: Close the previous BHRIGU send screen.",
      "BROWSER: Return to this current /support session.",
      "CURRENT SESSION: Scan the current QR again or copy the current raw Bitcoin address.",
      "WALLET APP: Verify the destination fingerprint matches this current BHRIGU session.",
      "WALLET APP: Enter the intended BTC amount and verify destination, amount, network fee, and network = Bitcoin mainnet.",
      "SEND ONCE. If the destination fingerprint does not match, DO NOT SEND; close that send screen and return to this current /support session.",
    ],
    noviceTitle: "New to Bitcoin?",
    noviceSteps: [
      "You need a Bitcoin wallet capable of sending BTC on Bitcoin mainnet.",
      "BHRIGU creates one fresh address for this support session.",
      "For a Bitcoin wallet, use the QR or Open Bitcoin wallet. For an exchange withdrawal form, use Copy raw BTC address.",
      "The QR and Open Bitcoin wallet use the BIP321 bitcoin:<address> format for compatible Bitcoin wallets. Exchange withdrawal forms may reject that format.",
      "Choose the amount in your wallet.",
      "Review destination, amount, network fee, and network = Bitcoin mainnet.",
      "Send exactly once.",
      "BHRIGU detects the transaction, retires the address from further use, and waits for confirmation.",
    ],
    exchangeTitle: "Sending from a centralized exchange?",
    exchangeBody: "Withdraw asset = BTC and network = Bitcoin mainnet. Use Copy raw BTC address and paste only the raw address into the exchange withdrawal field. Do not paste the bitcoin: prefix and do not use this BIP321 QR for an exchange withdrawal form. Do not use Lightning or another withdrawal network.",
    unavailable: "No fresh one-time Bitcoin address is available right now. No support session was created. Please try again after fresh-address capacity is restored.",
    endUnused: "End unused session",
    previewBoundary: "Preview boundary: do not send real BTC to this address.",
    synthetic: "Synthetic receipt evidence · UI only",
  },
  ru: {
    title: "Поддержать BHRIGU в Bitcoin",
    lines: [
      "Это добровольная поддержка исследований, архитектуры, инфраструктуры и публичного контура BHRIGU.",
      "Это не оплата товаров или услуг и не даёт доступа, приоритета, права собственности, инвестиционных прав, токенов или иных прав.",
      "BHRIGU не заявляет эту поддержку как благотворительное или налогово-вычитаемое пожертвование.",
      "Отправляйте только BTC в сети Bitcoin mainnet на адрес, показанный для этой сессии.",
      "Автоматический механизм возврата не предоставляется.",
    ],
    donate: "Отправить Bitcoin",
    opening: "Открываем сессию…",
    directAsk: "Поддержите работу в Bitcoin.",
    suggestedTitle: "Рекомендуемые суммы поддержки",
    suggestedHint: "Это только подсказки — выберите любую сумму в кошельке. QR не содержит сумму.",
    suggestedAmounts: [
      ["10 000 sats", "Тихая поддержка"],
      ["25 000 sats", "Поддержать работу коридора"],
      ["50 000 sats", "Непрерывность инфраструктуры"],
      ["100 000 sats", "Сильная поддержка"],
      ["Своя сумма", "Выберите свободно"],
    ],
    restart: "Начать новую сессию поддержки",
    activeSession: "Активная сессия поддержки",
    freshReceiverSignal: "Новый адрес",
    safetyTitle: "Проверки безопасности",
    safetySignals: ["Bitcoin mainnet", "Одна сессия · один адрес", "Отправьте ровно один раз", "Не передавайте seed / приватные ключи"],
    oneTime: "ЭТО НОВЫЙ ОДНОРАЗОВЫЙ BITCOIN-АДРЕС.",
    freshAddress: "Новый адрес · только для одной сессии",
    fingerprint: "Отпечаток адреса назначения",
    fingerprintHint: "Только для визуальной сверки — не вводите этот отпечаток вручную.",
    copy: "Копировать обычный BTC-адрес",
    copied: "Обычный BTC-адрес скопирован",
    openWallet: "Открыть Bitcoin-кошелёк",
    chooseAmount: "Выберите сумму в кошельке. BIP321 URI и QR содержат только",
    noUriExtras: "без суммы, label или message.",
    mainnetOnly: "Только Bitcoin mainnet. Не используйте Lightning или другую сеть вывода. Отправьте ровно один раз.",
    seed: "BHRIGU НИКОГДА НЕ ПОПРОСИТ ВАШУ SEED-ФРАЗУ.",
    secrets: "BHRIGU никогда не запрашивает приватные ключи или пароль кошелька.",
    walletTitle: "Если кошелёк всё ещё показывает предыдущий адрес BHRIGU",
    walletSteps: [
      "КОШЕЛЁК: Закройте предыдущий экран отправки BHRIGU.",
      "БРАУЗЕР: Вернитесь в эту текущую сессию /support.",
      "ТЕКУЩАЯ СЕССИЯ: Снова отсканируйте текущий QR или скопируйте текущий обычный Bitcoin-адрес.",
      "КОШЕЛЁК: Проверьте, что отпечаток адреса назначения совпадает с текущей сессией BHRIGU.",
      "КОШЕЛЁК: Введите сумму BTC и проверьте адрес назначения, сумму, комиссию сети и сеть = Bitcoin mainnet.",
      "ОТПРАВЬТЕ ОДИН РАЗ. Если отпечаток не совпадает, НЕ ОТПРАВЛЯЙТЕ; закройте этот экран отправки и вернитесь в текущую сессию /support.",
    ],
    noviceTitle: "Впервые отправляете Bitcoin?",
    noviceSteps: [
      "Нужен Bitcoin-кошелёк, который умеет отправлять BTC через Bitcoin mainnet.",
      "BHRIGU создаёт один новый адрес для текущей сессии поддержки.",
      "Для Bitcoin-кошелька используйте QR или Открыть Bitcoin-кошелёк. Для формы вывода биржи используйте Копировать обычный BTC-адрес.",
      "QR и Открыть Bitcoin-кошелёк используют формат BIP321 bitcoin:<address> для совместимых Bitcoin-кошельков. Формы вывода бирж могут отклонять этот формат.",
      "Выберите сумму в кошельке.",
      "Проверьте адрес назначения, сумму, комиссию сети и сеть = Bitcoin mainnet.",
      "Отправьте ровно один раз.",
      "BHRIGU обнаруживает транзакцию, выводит адрес из дальнейшего использования и ожидает подтверждение.",
    ],
    exchangeTitle: "Отправляете BTC с централизованной биржи?",
    exchangeBody: "Выберите актив = BTC и сеть = Bitcoin mainnet. Используйте Копировать обычный BTC-адрес и вставляйте в поле вывода биржи только обычный адрес. Не вставляйте префикс bitcoin: и не используйте этот BIP321 QR для формы вывода биржи. Не используйте Lightning или другую сеть вывода.",
    unavailable: "Сейчас нет свободного нового одноразового Bitcoin-адреса. Сессия поддержки не создана. Попробуйте снова после восстановления запаса свежих адресов.",
    endUnused: "Закрыть неиспользованную сессию",
    previewBoundary: "Граница Preview: не отправляйте реальные BTC на этот адрес.",
    synthetic: "Synthetic receipt evidence · UI only",
  },
};

export default function BtcDonationSessionPreview({ surface = "preview" }) {
  const router = useRouter();
  const locale = (Array.isArray(router.query.lang) ? router.query.lang[0] : router.query.lang) === "ru" ? "ru" : "en";
  const supportCopy = SUPPORT_COPY[locale];
  const isProduction = surface === "production";
  const [session, setSession] = useState(null);
  const [receiptLocked, setReceiptLocked] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const syntheticState = useMemo(() => {
    if (isProduction) return null;
    const raw = Array.isArray(router.query.syntheticReceipt) ? router.query.syntheticReceipt[0] : router.query.syntheticReceipt;
    return SYNTHETIC_STATES.has(raw) ? raw : null;
  }, [isProduction, router.query.syntheticReceipt]);

  const syntheticSession = useMemo(
    () => syntheticState ? buildSyntheticDonationSession(syntheticState) : null,
    [syntheticState],
  );
  const viewSession = syntheticSession ?? session;
  const syntheticMode = Boolean(syntheticSession);
  const receiptObserved = Boolean(viewSession && hasReceiptEvidence(viewSession));
  const sendSurfaceOpen = Boolean(
    viewSession &&
    viewSession.state === "awaiting_payment" &&
    !receiptObserved &&
    (syntheticMode || !receiptLocked),
  );

  useEffect(() => {
    if (syntheticMode) return undefined;
    let cancelled = false;
    const storedSessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSessionId) return () => { cancelled = true; };
    fetch(`/api/donation/session/${encodeURIComponent(storedSessionId)}`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (cancelled) return;
      if (response.ok && body?.ok && body.session) {
        setSession(body.session);
        if (hasReceiptEvidence(body.session)) setReceiptLocked(true);
      } else if (response.status === 404) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }).catch(() => {
      // Restore is best-effort; durable server state remains authoritative.
    });
    return () => { cancelled = true; };
  }, [syntheticMode]);

  useEffect(() => {
    if (session && hasReceiptEvidence(session)) setReceiptLocked(true);
  }, [session?.state, session?.observedSats]);

  useEffect(() => {
    let cancelled = false;
    setQrDataUrl("");
    if (!sendSurfaceOpen || !viewSession?.bip321Uri) return undefined;
    QRCode.toDataURL(viewSession.bip321Uri, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 288,
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    }).catch(() => {
      if (!cancelled) setError("Local QR generation failed.");
    });
    return () => { cancelled = true; };
  }, [sendSurfaceOpen, viewSession?.bip321Uri]);

  useEffect(() => {
    if (syntheticMode || !session?.sessionId || session.state === "retired") return undefined;
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
        if (!cancelled && body?.ok && body.session) {
          if (hasReceiptEvidence(body.session)) setReceiptLocked(true);
          setSession(body.session);
        }
      } catch {
        // Polling is best-effort; the durable server state remains authoritative.
      }
    };
    const timer = window.setInterval(refresh, 8000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [syntheticMode, session?.sessionId, session?.state]);

  async function startSession() {
    if (busy || syntheticMode) return;
    setBusy(true);
    setError("");
    setCopied(false);
    setReceiptLocked(false);
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
        throw new Error(body?.errorCode === "address_unavailable" ? supportCopy.unavailable : "Donation session is unavailable.");
      }
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, body.session.sessionId);
      if (hasReceiptEvidence(body.session)) setReceiptLocked(true);
      setSession(body.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Donation session is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function retireSession() {
    if (syntheticMode || !session?.sessionId || busy || !sendSurfaceOpen) return;
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
    if (!viewSession?.receiveAddress || !sendSurfaceOpen) return;
    if (syntheticMode) {
      setCopied(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(viewSession.receiveAddress);
      setCopied(true);
    } catch {
      setError("Address copy is unavailable in this browser.");
    }
  }

  const stateCopy = donationSessionStateCopy(viewSession?.state ?? "awaiting_payment", locale);
  const terminalCopy = viewSession && !sendSurfaceOpen ? donationTerminalCopy(viewSession, locale) : null;

  return (
    <section className="donation" data-donation-surface={surface}>
      <div className="previewFlag">{isProduction ? "Bitcoin mainnet · voluntary support" : "Protected Preview · No real BTC"}</div>
      <h2>{supportCopy.title}</h2>
      {(!viewSession || sendSurfaceOpen) && (
        <div className="decision" data-support-amount-suggestions data-support-amount-binding="none">
          <p className="directAsk"><strong>{supportCopy.directAsk}</strong></p>
          <div className="micro">{supportCopy.suggestedTitle}</div>
          <div className="amountGrid">
            {supportCopy.suggestedAmounts.map(([amount, meaning]) => (
              <div className="amountChip" key={amount}>
                <strong>{amount}</strong>
                <span>{meaning}</span>
              </div>
            ))}
          </div>
          <p className="suggestedHint">{supportCopy.suggestedHint}</p>
        </div>
      )}
      <div className="approvedCopy" data-approved-support-copy={locale}>
        {supportCopy.lines.map((line) => <p className="intro" key={line}>{line}</p>)}
      </div>

      {!viewSession && (
        <button className="primary" type="button" onClick={startSession} disabled={busy} data-donation-start>
          {busy ? supportCopy.opening : supportCopy.donate}
        </button>
      )}

      {viewSession && (
        <div
          className={`session ${sendSurfaceOpen ? "sessionActive" : ""}`}
          data-donation-session-state={viewSession.state}
          data-send-surface={sendSurfaceOpen ? "open" : "terminalized"}
          data-synthetic-source-has-address={syntheticMode && viewSession.receiveAddress ? "yes" : "no"}
        >
          {syntheticMode && (
            <div className="synthetic" data-synthetic-receipt-state={syntheticState}>
              <div className="micro">{supportCopy.synthetic}</div>
              <p>No chain observation was performed and no donation session was created. This fixture exists only for protected Preview rendering acceptance.</p>
            </div>
          )}

          {sendSurfaceOpen ? (
            <div className="activeHeader" data-active-session-hierarchy="golden-signal-v0-1">
              <div className="activeSignal">
                <span className="activePulse" aria-hidden="true" />
                <div>
                  <div className="micro">{supportCopy.activeSession}</div>
                  <strong>{stateCopy.label}</strong>
                </div>
              </div>
              <span className="expiry">{syntheticMode ? "Synthetic fixture" : `Session expires ${formatTime(viewSession.expiresAt)}`}</span>
            </div>
          ) : (
            <div className="stateRow">
              <span className={`state state-${viewSession.state}`}>{stateCopy.label}</span>
              <span className="expiry">{syntheticMode ? "Synthetic fixture" : `Session expires ${formatTime(viewSession.expiresAt)}`}</span>
            </div>
          )}
          <p className="stateDetail">{stateCopy.detail}</p>

          {sendSurfaceOpen && viewSession.receiveAddress && viewSession.bip321Uri && (
            <div data-send-affordances>
              <div className="safetyRail" data-primary-safety-rail>
                {supportCopy.safetySignals.map((signal) => <span key={signal}>{signal}</span>)}
              </div>

              <div className="qrCore" data-qr-core="golden-symmetry-v0-1">
                <div className="qrCoreHead">
                  <span className="micro">{supportCopy.freshReceiverSignal}</span>
                  <span className="qrNetwork">BTC / MAINNET</span>
                </div>
                <p className="oneTime"><strong>{supportCopy.oneTime}</strong></p>
                <div className="qrFrame">
                  <span className="corner cornerTl" aria-hidden="true" />
                  <span className="corner cornerTr" aria-hidden="true" />
                  <span className="corner cornerBl" aria-hidden="true" />
                  <span className="corner cornerBr" aria-hidden="true" />
                  <div className="qrShell" data-local-qr>
                    {qrDataUrl ? <img src={qrDataUrl} width="288" height="288" alt="Bitcoin support QR generated locally in this browser" /> : <div className="qrLoading">Generating QR locally…</div>}
                  </div>
                </div>
              </div>

              <div className="addressBlock">
                <div className="micro">{supportCopy.freshAddress}</div>
                <code data-receive-address>{viewSession.receiveAddress}</code>
                <div className="fingerprint" data-address-fingerprint>
                  <span>{supportCopy.fingerprint}: <strong>{addressFingerprint(viewSession.receiveAddress)}</strong></span>
                  <small>{supportCopy.fingerprintHint}</small>
                </div>
                <div className="addressActions">
                  <button type="button" className="secondary" onClick={copyAddress}>{copied ? supportCopy.copied : supportCopy.copy}</button>
                  {syntheticMode ? (
                    <button type="button" className="secondary" disabled>{supportCopy.openWallet}</button>
                  ) : (
                    <a className="secondary" href={viewSession.bip321Uri}>{supportCopy.openWallet}</a>
                  )}
                </div>
              </div>

              <p className="amountNote">
                {supportCopy.chooseAmount} <code>bitcoin:&lt;address&gt;</code> — {supportCopy.noUriExtras}
              </p>
              <details className="guidance safetyDetails" data-safety-details>
                <summary>{supportCopy.safetyTitle}</summary>
                <p className="guard"><strong>{supportCopy.mainnetOnly}</strong></p>
                <p className="seedGuard"><strong>{supportCopy.seed}</strong><br />{supportCopy.secrets}</p>
              </details>

              <details className="guidance handoff" data-wallet-handoff>
                <summary>{supportCopy.walletTitle}</summary>
                <ol>{supportCopy.walletSteps.map((step) => <li key={step}>{step}</li>)}</ol>
              </details>

              <details className="guidance">
                <summary>{supportCopy.noviceTitle}</summary>
                <ol>{supportCopy.noviceSteps.map((step) => <li key={step}>{step}</li>)}</ol>
              </details>

              <details className="guidance">
                <summary>{supportCopy.exchangeTitle}</summary>
                <p>{supportCopy.exchangeBody}</p>
              </details>

              {!isProduction && <p className="stopNote"><strong>{supportCopy.previewBoundary}</strong></p>}
            </div>
          )}

          {!sendSurfaceOpen && terminalCopy && (
            <div className="terminal" data-post-receipt-terminal>
              <h3>{terminalCopy.title}</h3>
              {viewSession.observedSats && <p>{terminalCopy.observed}: <strong>{viewSession.observedSats} sats</strong></p>}
              {viewSession.observedSats && <p>{terminalCopy.confirmations}: <strong>{viewSession.confirmations ?? 0}</strong></p>}
              <p>{terminalCopy.detail}</p>
              <p className="terminalStop"><strong>{terminalCopy.stop}</strong></p>
            </div>
          )}

          {!syntheticMode && sendSurfaceOpen && (
            <button className="retire" type="button" onClick={retireSession} disabled={busy} data-donation-retire>
              {supportCopy.endUnused}
            </button>
          )}

          {viewSession.state === "retired" && !viewSession.observedSats && (
            <button
              className="primary restart"
              type="button"
              onClick={startSession}
              disabled={busy || syntheticMode}
              data-donation-restart
              data-donation-restart-preview={syntheticMode ? "visual-only" : undefined}
            >
              {busy ? supportCopy.opening : supportCopy.restart}
            </button>
          )}
        </div>
      )}

      {error && <p className="error" role="status">{error}</p>}

      <style jsx>{`
        .donation { margin-top: 22px; padding: 20px; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: rgba(255,255,255,.025); }
        .previewFlag, .micro { font-size: 11px; letter-spacing: .11em; text-transform: uppercase; opacity: .68; }
        .decision { margin: 14px 0 16px; }
        .directAsk { margin: 0 0 12px; line-height: 1.5; }
        .amountGrid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 9px; }
        .amountChip { display: grid; gap: 3px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(222,194,125,.16); background: rgba(255,255,255,.018); }
        .amountChip strong { font-size: 13px; }
        .amountChip span { font-size: 11px; opacity: .65; }
        .suggestedHint { margin: 9px 0 0; font-size: 12px; line-height: 1.5; opacity: .68; }
        h2 { margin: 8px 0 10px; font-size: 27px; }
        h3 { margin: 0 0 9px; font-size: 18px; }
        .intro, .stateDetail, .amountNote, .stopNote, .guard, .seedGuard, .terminal p, .synthetic p, .guidance p, .handoff li, .guidance li { line-height: 1.55; opacity: .86; }
        .primary, .secondary, .retire { appearance: none; font: inherit; cursor: pointer; }
        .primary { min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.09); color: inherit; font-weight: 650; }
        .primary:disabled, .secondary:disabled, .retire:disabled { opacity: .55; cursor: default; }
        .restart { margin-top: 14px; }
        .session { margin-top: 16px; }
        .sessionActive { position: relative; }
        .activeHeader { display: flex; gap: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 14px; padding: 11px 13px; border: 1px solid rgba(222,194,125,.28); border-radius: 14px; background: linear-gradient(90deg, rgba(222,194,125,.055), rgba(83,201,230,.018) 62%, rgba(255,255,255,.012)); box-shadow: inset 0 1px 0 rgba(255,255,255,.035); }
        .activeSignal { display: flex; gap: 10px; align-items: center; }
        .activeSignal strong { display: block; margin-top: 2px; font-size: 14px; }
        .activePulse { width: 8px; height: 8px; border-radius: 50%; background: #dec27d; box-shadow: 0 0 0 4px rgba(222,194,125,.08), 0 0 18px rgba(83,201,230,.16); }
        .stateRow { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 14px; }
        .state { display: inline-flex; min-height: 30px; align-items: center; padding: 0 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,.13); font-size: 13px; }
        .expiry { font-size: 12px; opacity: .66; }
        .safetyRail { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; margin: 14px 0; }
        .safetyRail span { min-height: 34px; display: flex; align-items: center; padding: 7px 10px; border: 1px solid rgba(222,194,125,.15); border-radius: 10px; background: rgba(255,255,255,.014); font-size: 10px; letter-spacing: .065em; text-transform: uppercase; opacity: .8; }
        .qrCore { position: relative; overflow: hidden; margin: 14px 0 18px; padding: 14px; border: 1px solid rgba(222,194,125,.28); border-radius: 18px; background: radial-gradient(circle at 50% 28%, rgba(222,194,125,.07), transparent 36%), linear-gradient(180deg, rgba(222,194,125,.025), rgba(3,5,8,.42)); }
        .qrCore::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .12; background-image: linear-gradient(rgba(222,194,125,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(222,194,125,.12) 1px, transparent 1px); background-size: 34px 34px; }
        .qrCoreHead { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .qrNetwork { font-size: 10px; letter-spacing: .1em; color: rgba(222,194,125,.82); }
        .oneTime { position: relative; z-index: 1; margin: 12px 0 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(222,194,125,.18); line-height: 1.45; background: rgba(0,0,0,.16); }
        .qrFrame { position: relative; z-index: 1; width: min(100%, 352px); margin: 12px auto 2px; padding: 14px; box-sizing: border-box; }
        .corner { position: absolute; width: 22px; height: 22px; border-color: rgba(222,194,125,.72); pointer-events: none; }
        .cornerTl { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
        .cornerTr { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
        .cornerBl { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
        .cornerBr { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }
        .qrShell { width: min(100%, 320px); min-height: 320px; margin: 0 auto; display: grid; place-items: center; padding: 16px; box-sizing: border-box; border-radius: 18px; background: #fff; box-shadow: 0 0 0 1px rgba(222,194,125,.55), 0 0 34px rgba(222,194,125,.075), 0 0 56px rgba(83,201,230,.035); }
        .qrShell img { display: block; width: 100%; height: auto; max-width: 288px; }
        .qrLoading { color: #111; font-size: 13px; }
        .addressBlock, .terminal, .synthetic { margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.12); }
        .addressBlock code { display: block; margin-top: 8px; overflow-wrap: anywhere; font-size: 13px; line-height: 1.5; }
        .fingerprint { display: grid; gap: 4px; margin-top: 12px; font-size: 13px; }
        .fingerprint small { opacity: .66; line-height: 1.45; }
        .addressActions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .secondary { min-height: 36px; display: inline-flex; align-items: center; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: transparent; color: inherit; text-decoration: none; }
        .retire { margin-top: 12px; padding: 0; border: 0; background: transparent; color: inherit; text-decoration: underline; text-underline-offset: 3px; opacity: .72; }
        .guard, .seedGuard, .stopNote, .terminalStop { padding: 10px 11px; border-radius: 10px; border: 1px solid rgba(255,255,255,.075); }
        .seedGuard { margin-top: 8px; }
        .handoff ol, .guidance ol { margin: 8px 0 0; padding-left: 20px; }
        .handoff li, .guidance li { margin: 6px 0; }
        .guidance { margin-top: 9px; padding: 10px 12px; border-radius: 11px; border: 1px solid rgba(255,255,255,.075); background: rgba(0,0,0,.08); }
        .guidance summary { cursor: pointer; font-weight: 650; line-height: 1.4; }
        .safetyDetails[open] { border-color: rgba(222,194,125,.15); }
        .terminal { border-style: solid; }
        .terminal h3 { margin-top: 0; }
        .synthetic { border-style: dashed; }
        .synthetic p { margin: 7px 0 0; }
        .error { margin: 14px 0 0; line-height: 1.5; }
        @media (max-width: 560px) {
          .donation { padding: 16px; }
          h2 { font-size: 24px; }
          .safetyRail { grid-template-columns: 1fr; }
          .qrCore { padding: 12px 10px; }
          .qrFrame { padding: 11px; }
          .qrShell { min-height: 0; padding: 12px; }
          .primary { width: 100%; justify-content: center; }
          .amountGrid { grid-template-columns: 1fr; }
          .addressActions { display: grid; grid-template-columns: 1fr; }
          .secondary { justify-content: center; width: 100%; box-sizing: border-box; }
        }
      `}</style>
    </section>
  );
}

function hasReceiptEvidence(value) {
  if (!value) return false;
  if (RECEIPT_LOCKED_STATES.has(value.state)) return true;
  if (value.observedSats === null || value.observedSats === undefined || value.observedSats === "") return false;
  try { return BigInt(value.observedSats) > 0n; }
  catch { return true; }
}

function buildSyntheticDonationSession(state) {
  const receipt = state === "mempool_seen" || state === "confirmed" || state === "confirmation_lost";
  const addressVisibleInSource = state !== "retired";
  return {
    sessionId: "synthetic_preview_only",
    state,
    expiresAt: "2099-01-01T00:00:00.000Z",
    receiveAddress: addressVisibleInSource ? SYNTHETIC_ADDRESS : null,
    bip321Uri: addressVisibleInSource ? `bitcoin:${SYNTHETIC_ADDRESS}` : null,
    observedSats: receipt ? "10000" : null,
    confirmations: state === "confirmed" ? 2 : receipt ? 0 : null,
  };
}

function addressFingerprint(address) {
  if (!address) return "—";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function formatTime(value) {
  try { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return "soon"; }
}

function donationSessionStateCopy(state, locale) {
  const copy = locale === "ru" ? {
    awaiting_payment: ["Ожидаем платёж", "Для этой сессии ещё не обнаружено поступление Bitcoin."],
    mempool_seen: ["Получено в сети", "Транзакция обнаружена и ожидает подтверждение Bitcoin."],
    confirmed: ["Подтверждено", "Поступление имеет SPV-проверенное подтверждение."],
    confirmation_lost: ["Статус подтверждения изменился", "Поступление остаётся обнаруженным; BHRIGU снова ожидает подтверждение."],
    retired: ["Сессия закрыта", "Этот адрес больше не должен использоваться и никогда не будет назначен другой сессии."],
  } : {
    awaiting_payment: ["Awaiting payment", "No Bitcoin receipt has been observed for this session."],
    mempool_seen: ["Bitcoin received", "The transaction has been observed and is waiting for Bitcoin confirmation."],
    confirmed: ["Bitcoin confirmed", "The matching output has an SPV-verified confirmation."],
    confirmation_lost: ["Confirmation status changed", "The receipt remains observed; BHRIGU is waiting for confirmation again."],
    retired: ["Session closed", "This address must not be reused and will never be assigned to another session."],
  };
  const [label, detail] = copy[state] ?? copy.awaiting_payment;
  return { label, detail };
}

function donationTerminalCopy(value, locale) {
  if (locale === "ru") {
    if (value.state === "confirmed") return {
      title: "Bitcoin подтверждён",
      observed: "Получено",
      confirmations: "Подтверждения",
      detail: "Проверка BHRIGU завершена. Спасибо за поддержку BHRIGU.",
      stop: "Этот одноразовый адрес закрыт. Не используйте его повторно и не отправляйте второй платёж.",
    };
    if (value.state === "retired" && !value.observedSats) return {
      title: "Сессия закрыта",
      observed: "Получено",
      confirmations: "Подтверждения",
      detail: "Неиспользованная сессия завершена.",
      stop: "Не используйте этот адрес повторно.",
    };
    return {
      title: "Bitcoin получен",
      observed: "Получено",
      confirmations: "Подтверждения",
      detail: value.state === "confirmation_lost" ? "Статус подтверждения изменился. BHRIGU снова ожидает подтверждение сети." : "Ожидаем подтверждение Bitcoin.",
      stop: "Не отправляйте повторный платёж на этот адрес.",
    };
  }
  if (value.state === "confirmed") return {
    title: "Bitcoin confirmed",
    observed: "Observed",
    confirmations: "Confirmations",
    detail: "BHRIGU verification complete. Thank you for supporting BHRIGU.",
    stop: "This one-time address is closed. Do not reuse it and do not send a second payment.",
  };
  if (value.state === "retired" && !value.observedSats) return {
    title: "Session closed",
    observed: "Observed",
    confirmations: "Confirmations",
    detail: "The unused support session has ended.",
    stop: "Do not reuse this address.",
  };
  return {
    title: "Bitcoin received",
    observed: "Observed",
    confirmations: "Confirmations",
    detail: value.state === "confirmation_lost" ? "Confirmation status has changed. BHRIGU is waiting for confirmation again." : "Waiting for Bitcoin confirmation.",
    stop: "Do not send another payment to this address.",
  };
}
