import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import BtcDonationSessionPreview from "../components/btc/BtcDonationSessionPreview";
import {
  BTC_DONATION_SESSION_SAFETY_REPAIR_PREVIEW_BRANCH,
  getDonationSessionRuntimeConfig,
} from "../lib/btc-donation-session";

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
        <section className="panel" data-support-conversion="MOTIVATION_SATS_RECOVERY_V0_1">
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
        .wrap { max-width: 760px; margin: 0 auto; padding: 36px 18px 76px; }
        .panel {
          padding: 22px 20px 24px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.018);
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
        .impactItem { display: grid; gap: 4px; min-height: 66px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(222,194,125,.16); background: rgba(255,255,255,.018); }
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
        @media (max-width: 860px) {
          .title { font-size: 34px; }
        }
        @media (max-width: 560px) {
          .impactGrid { grid-template-columns: 1fr; }
          .directAsk { font-size: 17px; }
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  const config = getDonationSessionRuntimeConfig();
  const safetyRepairSyntheticPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === BTC_DONATION_SESSION_SAFETY_REPAIR_PREVIEW_BRANCH;
  return {
    props: {
      donationSurface: config.enabled ? config.surface : safetyRepairSyntheticPreview ? "preview" : null,
    },
  };
}
