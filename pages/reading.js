import { useRouter } from 'next/router'

export default function Reading() {
  const router = useRouter()
  const { q } = router.query
  const signal = q || "Signal not provided"

  const getVariant = (text) => {
    if (!text) return "default"
    if (text.includes("AI")) return "ai"
    if (text.includes("Renewable")) return "dao"
    if (text.includes("burnout")) return "human"
    if (text.includes("Web3")) return "web3"
    if (text.includes("Illiquid")) return "asset"
    return "default"
  }

  const variant = getVariant(signal)

  return (
    <div className={`phiReadingRoot variant-${variant}`}>
      <div className="phiAxis" />
      <div className="phiMembrane">
        <div className="phiContent">
          <div className="phiHeader">Mode: project</div>
          <div className="phiSignal">Signal: {signal}</div>

          <div className="phiBlock block-objective">Objective Layer</div>
          <div className="phiBlock block-timeline">Timeline Layer</div>
          <div className="phiBlock block-execution">Execution Layer</div>
          <div className="phiBlock block-risk">Risk Node</div>
        </div>
      </div>

      <style jsx>{`
        .phiReadingRoot {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #05070c;
        }

        .phiAxis {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255,200,120,0.08);
        }

        .phiMembrane {
          width: 640px;
          padding: 44px;
          border-radius: 18px;
          border: 1px solid rgba(255,200,120,0.25);
          background: rgba(10,14,20,0.88);
          backdrop-filter: blur(10px);
          box-shadow: 0 0 70px rgba(255,200,120,0.12);
          transition: all 0.4s ease;
        }

        .phiContent {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .phiHeader {
          opacity: 0.65;
          font-size: 14px;
        }

        .phiSignal {
          font-size: 20px;
          margin-bottom: 6px;
        }

        .phiBlock {
          padding: 10px 0;
          opacity: 0.9;
        }

        /* AI variant */
        .variant-ai .phiBlock {
          border-bottom: 1px solid rgba(120,160,255,0.25);
        }
        .variant-ai .block-risk {
          border-bottom: none;
        }

        /* DAO variant */
        .variant-dao .phiMembrane {
          padding: 52px;
          line-height: 1.8;
        }

        /* HUMAN variant */
        .variant-human .block-risk {
          font-weight: 600;
          color: rgba(255,120,120,0.85);
        }

        /* WEB3 variant */
        .variant-web3 .phiBlock {
          border-top: 1px solid rgba(180,120,255,0.25);
        }
        .variant-web3 .phiHeader {
          letter-spacing: 1px;
        }

        /* ASSET variant */
        .variant-asset .phiMembrane {
          padding: 36px;
          border-radius: 12px;
        }

        @media (max-width: 768px) {
          .phiMembrane {
            width: 94%;
            padding: 28px;
          }
        }
      `}</style>
    </div>
  )
}
