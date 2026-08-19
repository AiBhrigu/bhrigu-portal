import Link from "next/link";

type PublicSupportLocale = "en" | "ru";
type PublicSupportSurface = "home" | "btc";

type PublicSupportRouteProps = {
  locale?: PublicSupportLocale;
  surface?: PublicSupportSurface;
};

const COPY = {
  en: {
    home: {
      eyebrow: "KEEP BTC FIELD PUBLIC",
      title: "Support independent Bitcoin research.",
      body: "BHRIGU builds and maintains independent Bitcoin research and public infrastructure.",
      cta: "Support with Bitcoin",
    },
    btc: {
      eyebrow: "BTC FIELD IS PUBLIC",
      title: "If this work is useful to you, help keep it running.",
      body: "Support the research, evidence surface, and Bitcoin infrastructure behind BHRIGU.",
      cta: "Support BHRIGU with Bitcoin",
    },
    boundary: "Voluntary support only · no access, priority, ownership, or investment rights.",
  },  ru: {
    home: {
      eyebrow: "ПОМОГИТЕ BTC FIELD ОСТАВАТЬСЯ ПУБЛИЧНЫМ",
      title: "Поддержите независимые Bitcoin-исследования.",
      body: "BHRIGU развивает независимые Bitcoin-исследования и поддерживает публичную инфраструктуру.",
      cta: "Поддержать в Bitcoin",
    },
    btc: {
      eyebrow: "BTC FIELD ОСТАЁТСЯ ПУБЛИЧНЫМ",
      title: "Если эта работа полезна вам, помогите ей продолжаться.",
      body: "Поддержите исследования, доказательный публичный контур и Bitcoin-инфраструктуру BHRIGU.",
      cta: "Поддержать BHRIGU в Bitcoin",
    },
    boundary: "Добровольная поддержка · без доступа, приоритета, собственности или инвестиционных прав.",
  },
} as const;

export default function PublicSupportRoute({
  locale = "en",
  surface = "home",
}: PublicSupportRouteProps) {
  const lang: PublicSupportLocale = locale === "ru" ? "ru" : "en";
  const copy = COPY[lang];
  const surfaceCopy = copy[surface];
  const titleId = `public-support-${surface}-title`;
  return (
    <section
      className={`publicSupportRoute publicSupportRoute-${surface}`}
      data-public-support-route={surface}
      aria-labelledby={titleId}
    >
      <div className="publicSupportCopy">
        <p className="publicSupportEyebrow">{surfaceCopy.eyebrow}</p>
        <h2 id={titleId}>{surfaceCopy.title}</h2>
        <p className="publicSupportBody">{surfaceCopy.body}</p>
        <p className="publicSupportBoundary">{copy.boundary}</p>
      </div>
      <Link
        className="publicSupportCta"
        href={`/support?lang=${lang}`}
        data-public-support-cta={surface}
      >
        {surfaceCopy.cta}<span aria-hidden="true">→</span>
      </Link>
      <style jsx>{`
        .publicSupportRoute {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: clamp(24px, 4vw, 58px);
          align-items: center;
          margin: clamp(42px, 6vw, 76px) 0 0;
          padding: clamp(26px, 4vw, 42px) 0;
          border-top: 1px solid rgba(222,194,125,.2);
          border-bottom: 1px solid rgba(255,255,255,.07);        }
        .publicSupportCopy { max-width: 760px; }
        .publicSupportEyebrow {
          margin: 0 0 10px;
          color: #dec27d;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        h2 {
          margin: 0;
          color: rgba(255,255,255,.94);
          font-size: clamp(25px, 3.2vw, 38px);
          line-height: 1.08;
          letter-spacing: -.025em;
        }
        .publicSupportBody {
          max-width: 650px;
          margin: 12px 0 0;
          color: rgba(255,255,255,.7);
          font-size: 15px;
          line-height: 1.6;
        }
        .publicSupportBoundary {
          margin: 10px 0 0;
          color: rgba(255,255,255,.43);
          font-size: 11px;
          line-height: 1.5;
        }        .publicSupportCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 44px;
          padding: 0 18px;
          border: 1px solid rgba(222,194,125,.42);
          border-radius: 999px;
          color: #dec27d;
          background: rgba(222,194,125,.035);
          text-decoration: none;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: .07em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .publicSupportCta:hover,
        .publicSupportCta:focus-visible {
          border-color: rgba(222,194,125,.68);
          background: rgba(222,194,125,.075);
        }
        .publicSupportCta span { font-size: 16px; }
        .publicSupportRoute-btc {
          margin-top: clamp(48px, 6vw, 82px);
        }        @media (max-width: 760px) {
          .publicSupportRoute {
            grid-template-columns: 1fr;
            gap: 22px;
          }
          .publicSupportCta {
            width: fit-content;
            max-width: 100%;
            white-space: normal;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
