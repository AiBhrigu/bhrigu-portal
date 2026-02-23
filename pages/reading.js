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
          <div className="phiHeader">
            Mode: project
          </div>
          <div className="phiSignal">
            Signal: {signal}
          </div>

          <div className="phiBlock">
            Objective Layer
          </div>
          <div className="phiBlock">
            Timeline Layer
          </div>
          <div className="phiBlock">
            Execution Layer
          </div>
          <div className="phiBlock">
            Risk Node
          </div>
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
          width: 620px;
          padding: 40px;
          border-radius: 16px;
          border: 1px solid rgba(255,200,120,0.25);
          background: rgba(10,14,20,0.85);
          backdrop-filter: blur(8px);
          box-shadow: 0 0 60px rgba(255,200,120,0.12);
        }

        .phiContent {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .phiHeader {
          opacity: 0.7;
        }

        .phiSignal {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .phiBlock {
          padding: 8px 0;
          opacity: 0.85;
        }

        .variant-ai .phiMembrane {
          box-shadow: 0 0 70px rgba(120,160,255,0.25);
          border-color: rgba(120,160,255,0.4);
        }

        .variant-dao .phiMembrane {
          box-shadow: 0 0 70px rgba(120,255,160,0.25);
          border-color: rgba(120,255,160,0.4);
        }

        .variant-human .phiMembrane {
          box-shadow: 0 0 50px rgba(255,120,120,0.25);
          border-color: rgba(255,120,120,0.4);
        }

        .variant-web3 .phiMembrane {
          box-shadow: 0 0 80px rgba(180,120,255,0.3);
          border-color: rgba(180,120,255,0.5);
        }

        .variant-asset .phiMembrane {
          box-shadow: 0 0 40px rgba(255,200,120,0.18);
          border-color: rgba(255,200,120,0.5);
        }

        @media (max-width: 768px) {
          .phiMembrane {
            width: 92%;
            padding: 28px;
          }
        }
      `}</style>
    </div>
  )
}
