import Head from "next/head";
import { useState, type FormEvent } from "react";
import type { GetServerSideProps } from "next";

type Locale = "en" | "ru";
type Props = { locale: Locale };

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => ({
  props: { locale: query.lang === "ru" ? "ru" : "en" },
});

export default function PhiBtcTimingWindowsFoundingRequest({ locale }: Props) {
  const ru = locale === "ru";
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [requestId, setRequestId] = useState("");
  const t = ru ? {
    title: "Request a Founding Slot",
    lead: "Короткий non-payment запрос на 30-дневный Bitcoin research object.",
    name: "Имя или handle",
    contact: "Безопасный контакт",
    contactHint: "Email, Telegram, X или другой контакт, по которому можно ответить.",
    primary: "Основной интерес",
    primaryValue: "Bitcoin research",
    question: "Что вы больше всего хотите отслеживать в 30-дневном research object?",
    context: "Что вы сейчас наблюдаете в Bitcoin?",
    optional: "необязательно",
    willing: "Если scope подойдёт после ручного review, я готов(а) рассмотреть оплату 30-дневного объекта.",
    boundary: "Это founding request, не платёж. Доступ не гарантирован. Здесь нет trading signal и automated trading. Каждый запрос рассматривается вручную.",
    data: "Не отправляйте seed phrases, private keys, API keys, wallet credentials или платёжные данные.",
    submit: "REQUEST A FOUNDING SLOT",
    submitting: "SENDING REQUEST…",
    success: "Запрос сохранён для ручного review.",
    error: "Запрос не удалось сохранить. Попробуйте ещё раз.",
    back: "← Back to the 30-Day Bitcoin Cosmograph",
  } : {
    title: "Request a Founding Slot",
    lead: "A short non-payment request for the 30-day Bitcoin research object.",
    name: "Name or handle",
    contact: "Safe contact",
    contactHint: "Email, Telegram, X, or another contact where we can reply.",
    primary: "Primary interest",
    primaryValue: "Bitcoin research",
    question: "What would you most want the 30-day research object to track for you?",
    context: "What are you currently watching in Bitcoin?",
    optional: "optional",
    willing: "If the scope fits after manual review, I would be open to paying for the 30-day object.",
    boundary: "This is a founding request, not a payment. Access is not guaranteed. There is no trading signal or automated trading. Every request is reviewed manually.",
    data: "Do not submit seed phrases, private keys, API keys, wallet credentials, or payment data.",
    submit: "REQUEST A FOUNDING SLOT",
    submitting: "SENDING REQUEST…",
    success: "Request stored for manual review.",
    error: "The request could not be stored. Please try again.",
    back: "← Back to the 30-Day Bitcoin Cosmograph",
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const idempotencyKey = `founding-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    setState("submitting");
    setRequestId("");
    try {
      const response = await fetch("/api/founding/phi-btc-timing-windows/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          locale,
          nameOrHandle: String(data.get("nameOrHandle") ?? ""),
          contact: String(data.get("contact") ?? ""),
          trackingQuestion: String(data.get("trackingQuestion") ?? ""),
          currentBitcoinContext: String(data.get("currentBitcoinContext") ?? ""),
          willingToPayAfterScopeAcceptance:
            data.get("willingToPayAfterScopeAcceptance") === "yes",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.requestId) {
        throw new Error(result?.errorCode || "founding_request_failed");
      }
      setRequestId(String(result.requestId));
      setState("success");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return <>
    <Head>
      <title>{t.title} · BHRIGU</title>
      <meta name="robots" content="noindex,nofollow" />
    </Head>
    <main>
      <a className="back" href={`/founding/phi-btc-timing-windows?lang=${locale}`}>{t.back}</a>
      <header>
        <p className="eyebrow">BHRIGU · FOUNDING REQUEST · NON-PAYMENT</p>
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <form onSubmit={submit} aria-label={t.title}>
        <div className="pair">
          <label><span>{t.name}</span><input name="nameOrHandle" required minLength={2} maxLength={120} autoComplete="name" /></label>
          <label><span>{t.contact}</span><input name="contact" required minLength={3} maxLength={240} aria-describedby="contact-hint" /></label>
        </div>
        <small id="contact-hint" className="hint">{t.contactHint}</small>

        <div className="primary"><span>{t.primary}</span><strong>{t.primaryValue}</strong></div>

        <label><span>{t.question}</span><textarea name="trackingQuestion" required minLength={10} maxLength={1200} rows={5} /></label>
        <label><span>{t.context} <em>{t.optional}</em></span><textarea name="currentBitcoinContext" maxLength={1200} rows={4} /></label>

        <label className="willing"><input type="checkbox" name="willingToPayAfterScopeAcceptance" value="yes" /><span>{t.willing}</span></label>

        <div className="boundary"><strong>{t.boundary}</strong><small>{t.data}</small></div>

        <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? t.submitting : t.submit}</button>
        <p className={`status ${state}`} role="status" aria-live="polite">
          {state === "success" ? `${t.success} ${requestId}` : state === "error" ? t.error : ""}
        </p>
      </form>
    </main>

    <style jsx>{`
      :global(html){background:#efede6;color:#111}
      :global(body){margin:0;background:#efede6;color:#111;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      :global(*){box-sizing:border-box}
      main{max-width:900px;margin:0 auto;padding:52px 24px 80px}.back{display:inline-block;color:#57534c;text-decoration:none;font-size:12px;letter-spacing:.06em;margin-bottom:55px}.eyebrow{font-size:12px;letter-spacing:.16em;font-weight:800;color:#57534c;margin:0 0 14px}h1{font-family:Georgia,serif;font-size:clamp(43px,7vw,74px);font-weight:500;line-height:.96;letter-spacing:-.04em;margin:0 0 20px}.lead{font-size:20px;line-height:1.5;color:#39362f;max-width:680px;margin:0}header{margin-bottom:34px}
      form{background:#10110f;color:#f5f2e9;padding:34px;border:1px solid #10110f}.pair{display:grid;grid-template-columns:1fr 1fr;gap:13px}label{display:block;margin-top:21px}.pair label{margin-top:0}label>span,.primary span{display:block;font-size:12px;line-height:1.45;letter-spacing:.06em;color:#d0cbc1;margin-bottom:8px}label>span em{font-style:normal;color:#8f8a81}input:not([type=checkbox]),textarea{width:100%;border:1px solid #555149;background:#181916;color:#f5f2e9;padding:13px;font:inherit;font-size:14px;outline:none;border-radius:0}input:focus,textarea:focus{border-color:#d8ff72}.hint{display:block;color:#b7b2a8;font-size:12px;line-height:1.5;margin-top:8px}.primary{display:flex;justify-content:space-between;gap:13px;align-items:baseline;padding:15px 0;border-top:1px solid #34322d;border-bottom:1px solid #34322d;margin-top:26px}.primary span{margin:0}.primary strong{font-family:Georgia,serif;font-size:18px;font-weight:500}.willing{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start}.willing input{margin-top:3px}.willing span{font-size:14px;letter-spacing:0;margin:0;line-height:1.55}.boundary{margin:26px 0;border-left:2px solid #d8ff72;padding:3px 0 3px 13px}.boundary strong,.boundary small{display:block}.boundary strong{font-size:13px;line-height:1.55}.boundary small{font-size:12px;color:#b7b2a8;line-height:1.5;margin-top:8px}button{background:#d8ff72;color:#111;border:0;padding:15px 22px;font-size:12px;font-weight:800;letter-spacing:.08em;cursor:pointer}button:disabled{opacity:.6;cursor:wait}.status{min-height:22px;font-size:13px;line-height:1.5;margin:13px 0 0;color:#d0cbc1}.status.success{color:#d8ff72}.status.error{color:#f0b5aa}
      @media(max-width:680px){main{padding:36px 15px 56px}.back{margin-bottom:40px}.pair{grid-template-columns:1fr}.pair label+label{margin-top:21px}form{padding:24px 20px}h1{font-size:43px}.lead{font-size:18px}}
    `}</style>
  </>;
}
