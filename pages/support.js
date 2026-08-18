import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import BtcDonationSessionPreview from "../components/btc/BtcDonationSessionPreview";
import {
  BTC_DONATION_SESSION_SAFETY_REPAIR_PREVIEW_BRANCH,
  getDonationSessionRuntimeConfig,
} from "../lib/btc-donation-session";

const BTC_SUPPORT_CONVERSION_PREVIEW_BRANCHES = new Set([
  "feature/btc-support-conversion-atom1-v1",
  "feature/btc-support-conversion-atom2-v1",
  "feature/btc-support-conversion-atom3-v1",
  "feature/btc-support-conversion-atom4-v1",
]);

const PAGE_COPY = {
  en: {
    kicker: "Bitcoin-native public support",
    title: "Help keep BHRIGU public.",
    lead: "Independent Bitcoin research, systems architecture, and public infrastructure.",
    ask: "If this work is useful to you, support its continuation with Bitcoin.",
    keepsTitle: "Your support helps keep",
    keeps: [
      ["BTC Field", "public"],
      ["Independent research", "running"],
      ["BHRIGU infrastructure", "online"],
      ["Market Cosmographer", "developing"],
    ],
    boundary: "Support does not buy access, priority, ownership, investment rights, or private-engine access.",
    access: "For reviewed analytical work, go to",
    investors: "For capital or partner context, use",
    closed: "Support the public surface",
    footer: "Public support does not alter the system boundary.",
  },
  ru: {
    kicker: "Bitcoin-native публичная поддержка",
    title: "Помогите BHRIGU оставаться публичным.",
    lead: "Независимые Bitcoin-исследования, системная архитектура и публичная инфраструктура.",
    ask: "Если эта работа полезна вам, поддержите её продолжение в Bitcoin.",
    keepsTitle: "Ваша поддержка помогает сохранять",
    keeps: [
      ["BTC Field", "публичным"],
      ["Независимые исследования", "работающими"],
      ["Инфраструктуру BHRIGU", "онлайн"],
      ["Market Cosmographer", "в развитии"],
    ],
    boundary: "Поддержка не покупает доступ, приоритет, собственность, инвестиционные права или доступ к приватному движку.",
    access: "Для аналитической работы с review перейдите в",
    investors: "Для капитала или партнёрского контекста используйте",
    closed: "Поддержать публичный контур",
    footer: "Публичная поддержка не меняет границы системы.",
  },
};

export default function Support({ donationSurface = null }) {
  const router = useRouter();
  const locale = (Array.isArray(router.query.lang) ? router.query.lang[0] : router.query.lang) === "ru" ? "ru" : "en";
  const copy = PAGE_COPY[locale];
  const donationEnabled = donationSurface === "preview" || donationSurface === "production";
  return (
    <>
      <Head>
        <title>Support · BHRIGU</title>
        <meta
          name="description"
          content="Support independent Bitcoin research, systems architecture, infrastructure, and the public continuity of BHRIGU."
        />
        <meta property="og:title" content="Support · BHRIGU" />
        <meta
          property="og:description"
          content="Support independent Bitcoin research, systems architecture, infrastructure, and the public continuity of BHRIGU."
        />
        <meta property="og:url" content="https://www.bhrigu.io/support" />
        <meta name="twitter:title" content="Support · BHRIGU" />
        <meta
          name="twitter:description"
          content="Support independent Bitcoin research, systems architecture, infrastructure, and the public continuity of BHRIGU."
        />
        {donationSurface === "preview" && <meta name="robots" content="noindex,nofollow,noarchive" />}
      </Head>

      <main className="wrap" data-support-surface="SUPPORT_SURFACE_V0_1" data-donation-enabled={donationEnabled ? "yes" : "no"} data-donation-surface={donationSurface ?? "closed"}>
        <div className="supportField" data-support-field="golden-symmetry-cyberpunk-v0-1" aria-hidden="true">
          <span className="fieldAxis fieldAxisLeft">BTC FIELD</span>
          <span className="fieldAxis fieldAxisRight">INFRASTRUCTURE</span>
          <span className="fieldAxis fieldAxisTop">PUBLIC RESEARCH</span>
          <span className="fieldAxis fieldAxisBottom">CONTINUITY</span>
          <span className="fieldCore" />
        </div>
        <section className="panel" data-support-conversion="MOTIVATION_SATS_RECOVERY_V0_1" data-support-visual-canon="golden-symmetry-restrained-cyberpunk-v0-1">
          <div className="kicker">{copy.kicker}</div>
          <h1 className="title">{copy.title}</h1>
          <p className="role">{copy.lead}</p>
          <p className="directAsk"><strong>{copy.ask}</strong></p>

          <section className="impact" aria-labelledby="support-impact-title">
            <div className="line" id="support-impact-title">{copy.keepsTitle}</div>
            <div className="impactGrid">
              {copy.keeps.map(([name, state]) => (
                <div className="impactItem" key={name}>
                  <strong>{name}</strong>
                  <span>{state}</span>
                </div>
              ))}
            </div>
          </section>

          {donationEnabled ? (
            <BtcDonationSessionPreview surface={donationSurface} />
          ) : (
            <div className="action" aria-hidden="true">{copy.closed}</div>
          )}

          <p className="boundary">{copy.boundary}</p>
          <div className="routes">
            <p>{copy.access} <Link href="/access">/access</Link>.</p>
            <p>{copy.investors} <Link href="/investors">/investors</Link>.</p>
          </div>
          <p className="footer">{copy.footer}</p>
        </section>
      </main>

      <style jsx>{`
        .wrap {
          position: relative;
          isolation: isolate;
          max-width: 1080px;
          margin: 0 auto;
          padding: 36px 18px 76px;
        }
        .supportField {
          position: absolute;
          z-index: 0;
          inset: 18px 18px 56px;
          overflow: hidden;
          pointer-events: none;
          border-radius: 42px;
          opacity: .88;
          background:
            radial-gradient(circle at 50% 18%, rgba(222,194,125,.09), transparent 30%),
            radial-gradient(circle at 15% 44%, rgba(83,201,230,.035), transparent 24%),
            radial-gradient(circle at 86% 62%, rgba(111,82,190,.028), transparent 26%),
            linear-gradient(90deg, transparent 49.82%, rgba(222,194,125,.09) 50%, transparent 50.18%),
            linear-gradient(0deg, transparent 49.86%, rgba(222,194,125,.045) 50%, transparent 50.14%);
        }
        .supportField::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: .18;
          background-image:
            linear-gradient(rgba(222,194,125,.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(83,201,230,.055) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(circle at 50% 42%, #000 0, rgba(0,0,0,.8) 34%, transparent 78%);
        }
        .supportField::after {
          content: "";
          position: absolute;
          inset: 13% 18%;
          border: 1px solid rgba(222,194,125,.075);
          border-radius: 50%;
          transform: rotate(-7deg);
          box-shadow:
            0 0 0 34px rgba(222,194,125,.006),
            0 0 0 76px rgba(83,201,230,.005),
            0 0 90px rgba(222,194,125,.025);
        }
        .fieldAxis {
          position: absolute;
          z-index: 2;
          color: rgba(222,194,125,.24);
          font-size: 9px;
          letter-spacing: .22em;
          text-transform: uppercase;
          text-shadow: 0 0 18px rgba(222,194,125,.08);
        }
        .fieldAxisLeft { left: 18px; top: 43%; transform: rotate(-90deg); transform-origin: left top; }
        .fieldAxisRight { right: 18px; top: 57%; transform: rotate(90deg); transform-origin: right top; }
        .fieldAxisTop { top: 18px; left: 50%; transform: translateX(-50%); }
        .fieldAxisBottom { bottom: 18px; left: 50%; transform: translateX(-50%); }
        .fieldCore {
          position: absolute;
          left: 50%;
          top: 45%;
          width: 7px;
          height: 7px;
          border: 1px solid rgba(222,194,125,.38);
          border-radius: 50%;
          transform: translate(-50%,-50%);
          box-shadow: 0 0 22px rgba(222,194,125,.12), 0 0 42px rgba(83,201,230,.05);
        }
        .panel {
          position: relative;
          z-index: 1;
          overflow: hidden;
          max-width: 760px;
          margin: 0 auto;
          padding: 22px 20px 24px;
          border-radius: 18px;
          border: 1px solid rgba(222,194,125,.12);
          background: linear-gradient(180deg, rgba(255,255,255,.026), rgba(255,255,255,.014)), rgba(5,6,8,.91);
          box-shadow: 0 30px 90px rgba(0,0,0,.44), inset 0 1px 0 rgba(255,255,255,.035), 0 0 0 1px rgba(222,194,125,.018);
        }
        .panel::before {
          content: "";
          position: absolute;
          left: 14%;
          right: 14%;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(222,194,125,.34), rgba(83,201,230,.11), rgba(222,194,125,.34), transparent);
        }
        .panel::after {
          content: "";
          position: absolute;
          top: 0;
          left: 18%;
          width: 22%;
          height: 1px;
          opacity: .2;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
          animation: supportSignalDrift 12s ease-in-out infinite;
        }
        @keyframes supportSignalDrift {
          0%,100% { transform: translateX(-22%); opacity: .12; }
          50% { transform: translateX(300%); opacity: .28; }
        }
        .kicker {
          font-size: 12px;
          letter-spacing: .12em;
          text-transform: uppercase;
          opacity: .72;
          margin-bottom: 10px;
        }
        .title {
          margin: 0 0 12px;
          font-size: 40px;
          line-height: 1.08;
        }
        .role, .directAsk, .footer, .routes p {
          margin: 0 0 12px;
          line-height: 1.6;
          opacity: .88;
        }
        .directAsk { max-width: 620px; margin-top: 18px; font-size: 18px; opacity: .98; }
        .impact { margin: 22px 0 6px; }
        .impactGrid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
        .impactItem { position: relative; overflow: hidden; display: grid; gap: 4px; min-height: 66px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(222,194,125,.16); background: linear-gradient(135deg, rgba(222,194,125,.018), rgba(255,255,255,.014)); transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
        .impactItem::after { content: ""; position: absolute; left: 12px; right: 52%; bottom: 0; height: 1px; background: linear-gradient(90deg, rgba(222,194,125,.28), transparent); opacity: .55; }
        .impactItem:hover { border-color: rgba(222,194,125,.28); transform: translateY(-1px); box-shadow: 0 10px 28px rgba(0,0,0,.16), 0 0 24px rgba(83,201,230,.018); }
        .impactItem strong { font-size: 14px; }
        .impactItem span { font-size: 12px; opacity: .62; text-transform: uppercase; letter-spacing: .08em; }
        .line {
          margin: 4px 0 14px;
          font-size: 13px;
          letter-spacing: .08em;
          text-transform: uppercase;
          opacity: .78;
        }
        .boundary {
          margin: 14px 0 14px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.02);
          line-height: 1.55;
        }
        .routes {
          margin-top: 8px;
          padding-top: 8px;
        }
        .action {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.02);
          opacity: .88;
        }
        .footer {
          margin-top: 14px;
          opacity: .72;
        }
        :global(main[data-support-surface] ~ nav[data-prevnext]) {
          position: static !important;
          margin: 18px auto 8px;
        }
        @media (max-width: 900px) {
          .supportField { inset: 22px 10px 58px; opacity: .68; }
          .fieldAxis { display: none; }
          .title { font-size: 34px; }
        }
        @media (max-width: 560px) {
          .wrap { padding: 20px 10px 60px; }
          .supportField { inset: 8px 4px 42px; border-radius: 28px; opacity: .52; }
          .supportField::before { background-size: 38px 38px; opacity: .12; }
          .supportField::after { inset: 10% 8%; opacity: .7; }
          .panel { padding: 18px 12px 20px; border-radius: 16px; }
          .impactGrid { grid-template-columns: 1fr; gap: 8px; }
          .impactItem { min-height: 58px; padding: 10px 12px; }
          .directAsk { font-size: 17px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .panel::after, .impactItem { animation: none; transition: none; }
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  const config = getDonationSessionRuntimeConfig();
  const syntheticPreviewBranch =
    process.env.VERCEL_ENV === "preview" &&
    (process.env.VERCEL_GIT_COMMIT_REF === BTC_DONATION_SESSION_SAFETY_REPAIR_PREVIEW_BRANCH ||
      BTC_SUPPORT_CONVERSION_PREVIEW_BRANCHES.has(process.env.VERCEL_GIT_COMMIT_REF));
  return {
    props: {
      donationSurface: config.enabled ? config.surface : syntheticPreviewBranch ? "preview" : null,
    },
  };
}
