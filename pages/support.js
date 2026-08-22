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
  "feature/btc-support-capacity-admission-v1",
  "feature/btc-support-phi-structured-cyberpunk-v0-1",
]);

const PAGE_COPY = {
  en: {
    kicker: "BHRIGU · Public continuity",
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
    kicker: "BHRIGU · Публичная непрерывность",
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

      <main
        className="wrap"
        data-support-surface="SUPPORT_SURFACE_V0_1"
        data-donation-enabled={donationEnabled ? "yes" : "no"}
        data-donation-surface={donationSurface ?? "closed"}
      >
        <section
          className="phiSurface"
          data-support-conversion="MOTIVATION_SATS_RECOVERY_V0_1"
          data-support-visual-canon="bhrigu-phi-structured-cyberpunk-v0-1"
          data-phi-primary-regions="2"
          data-phi-ratio="61.803398875:38.196601125"
        >
          <div className="phiPrimary">
            <section className="meaningRegion" data-phi-region="meaning-trust-61_8">
              <div className="kicker">{copy.kicker}</div>
              <h1 className="title">{copy.title}</h1>
              <p className="role">{copy.lead}</p>

              <section className="impact" aria-labelledby="support-impact-title">
                <div className="line" id="support-impact-title">{copy.keepsTitle}</div>
                <div className="impactFlow">
                  {copy.keeps.map(([name, state]) => (
                    <div className="impactLine" key={name}>
                      <span className="impactGlyph" aria-hidden="true">Φ</span>
                      <strong>{name}</strong>
                      <span>{state}</span>
                    </div>
                  ))}
                </div>
              </section>

              <p className="boundary">{copy.boundary}</p>
            </section>

            <section className="actionRegion" data-phi-region="bitcoin-action-38_2">
              {donationEnabled ? (
                <BtcDonationSessionPreview surface={donationSurface} />
              ) : (
                <div className="action" aria-hidden="true">{copy.closed}</div>
              )}
            </section>
          </div>

          <section className="supportingZone" data-phi-supporting-zone="safety-route-distinction">
            <p className="directAsk"><strong>{copy.ask}</strong></p>
            <div className="routes">
              <p>{copy.access} <Link href="/access">/access</Link>.</p>
              <p>{copy.investors} <Link href="/investors">/investors</Link>.</p>
            </div>
            <p className="footer">{copy.footer}</p>
          </section>
        </section>
      </main>

      <style jsx>{`
        .wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 36px 18px 76px;
        }
        .phiSurface {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(222,194,125,.14);
          border-radius: 24px;
          background:
            radial-gradient(circle at 14% 12%, rgba(222,194,125,.075), transparent 34%),
            radial-gradient(circle at 92% 18%, rgba(83,201,230,.055), transparent 30%),
            linear-gradient(148deg, rgba(9,10,13,.98), rgba(4,6,9,.985));
          box-shadow: 0 30px 90px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.025);
        }
        .phiSurface::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(112deg, rgba(222,194,125,.025), transparent 48%, rgba(83,201,230,.018));
        }
        .phiPrimary {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0,61.803398875fr) minmax(0,38.196601125fr);
          align-items: stretch;
        }
        .meaningRegion { padding: 38px 42px 34px; }
        .actionRegion {
          min-width: 0;
          padding: 30px 28px 30px 30px;
          border-left: 1px solid transparent;
          border-image: linear-gradient(180deg, transparent 4%, rgba(222,194,125,.28) 30%, rgba(83,201,230,.22) 72%, transparent 96%) 1;
          background: linear-gradient(180deg, rgba(83,201,230,.018), rgba(222,194,125,.012));
        }
        .kicker {
          margin-bottom: 13px;
          color: rgba(222,194,125,.84);
          font-size: 11px;
          letter-spacing: .16em;
          text-transform: uppercase;
        }
        .title { max-width: 560px; margin: 0 0 15px; font-size: clamp(38px,5vw,58px); line-height: .98; letter-spacing: -.035em; }
        .role, .directAsk, .footer, .routes p { margin: 0 0 12px; line-height: 1.62; }
        .role { max-width: 580px; font-size: 17px; opacity: .82; }
        .impact { margin: 34px 0 28px; }
        .line { margin-bottom: 13px; color: rgba(222,194,125,.72); font-size: 11px; letter-spacing: .13em; text-transform: uppercase; }
        .impactFlow { display: grid; gap: 0; }
        .impactLine {
          display: grid;
          grid-template-columns: 18px minmax(0,1fr) auto;
          gap: 10px;
          align-items: baseline;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,.055);
        }
        .impactLine:first-child { border-top: 1px solid rgba(255,255,255,.055); }
        .impactGlyph { color: rgba(222,194,125,.6); font-size: 11px; }
        .impactLine strong { font-size: 14px; font-weight: 620; }
        .impactLine span:last-child { color: rgba(83,201,230,.68); font-size: 10px; letter-spacing: .09em; text-transform: uppercase; }
        .boundary {
          max-width: 600px;
          margin: 0;
          padding: 14px 0 0 18px;
          border-left: 1px solid rgba(222,194,125,.38);
          line-height: 1.58;
          opacity: .82;
        }
        .supportingZone {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(260px,.7fr);
          gap: 24px;
          align-items: start;
          padding: 22px 42px 26px;
          border-top: 1px solid rgba(255,255,255,.065);
          background: rgba(0,0,0,.12);
        }
        .directAsk { color: rgba(222,194,125,.88); font-size: 15px; }
        .routes { grid-column: 2; grid-row: 1 / span 2; }
        .routes a { color: rgba(83,201,230,.88); text-underline-offset: 3px; }
        .footer { opacity: .58; font-size: 12px; }
        .action {
          min-height: 44px;
          display: flex;
          align-items: center;
          padding: 0 15px;
          border-left: 1px solid rgba(222,194,125,.4);
          color: rgba(222,194,125,.82);
        }
        :global(main[data-support-surface] ~ nav[data-prevnext]) { position: static !important; margin: 18px auto 8px; }
        @media (max-width: 959px) {
          .wrap { padding: 24px 14px 68px; }
          .phiPrimary { grid-template-columns: 1fr; }
          .meaningRegion { padding: 34px 30px 26px; }
          .actionRegion { padding: 26px 30px 30px; border-left: 0; border-top: 1px solid rgba(222,194,125,.16); border-image: none; }
          .supportingZone { grid-template-columns: 1fr; padding: 21px 30px 25px; }
          .routes { grid-column: 1; grid-row: auto; }
        }
        @media (max-width: 560px) {
          .wrap { padding: 13px 8px 56px; }
          .phiSurface { border-radius: 18px; }
          .meaningRegion { padding: 34px 21px 21px; }
          .actionRegion { padding: 21px; }
          .supportingZone { gap: 13px; padding: 21px; }
          .title { font-size: 40px; }
          .role { font-size: 16px; }
          .impact { margin: 21px 0; }
          .impactLine { grid-template-columns: 16px minmax(0,1fr); gap: 8px; padding: 8px 0; }
          .impactLine span:last-child { grid-column: 2; }
          .boundary { padding-left: 13px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .phiSurface, .phiSurface * { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
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
