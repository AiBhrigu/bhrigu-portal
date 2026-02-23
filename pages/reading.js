import { useRouter } from 'next/router'

export default function Reading() {
  const router = useRouter()
  const { q } = router.query

  const signal = q || "Signal not provided"

  const data = {
    objective: "Distributed intelligence infrastructure buildout",
    scale: 180,
    phase: 2,
    horizon: "9–18 months",
    readiness: 0.62,
    riskWeight: 0.71,
    riskVector: "Capital alignment"
  }

  return (
    <div className="phiReadingRoot">
      <div className="phiAxis" />

      <div className="phiMembrane">
        <div className="phiHeader">Mode: project</div>
        <div className="phiSignal">Signal: {signal}</div>

        <div className="phiLayer">
          <div className="phiTitle">Objective Layer</div>
          <div className="phiText">{data.objective}</div>
          <div className="phiMetric">Scale Index: {data.scale}</div>
        </div>

        <div className="phiLayer">
          <div className="phiTitle">Timeline Layer</div>
          <div className="phiMetric">Phase: {data.phase} / 5</div>
          <div className="phiMetric">Horizon: {data.horizon}</div>
        </div>

        <div className="phiLayer">
          <div className="phiTitle">Execution Layer</div>
          <div className="phiMetric">Readiness: {data.readiness}</div>
        </div>

        <div className="phiLayer phiRisk">
          <div className="phiTitle">Risk Node</div>
          <div className="phiMetric">Risk Weight: {data.riskWeight}</div>
          <div className="phiMetric">Vector: {data.riskVector}</div>
        </div>
      </div>

      <style jsx>{`
        .phiReadingRoot {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05070c;
          position: relative;
        }

        .phiAxis {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255,200,120,0.2);
        }

        .phiMembrane {
          width: 640px;
          padding: 44px;
          border-radius: 18px;
          border: 1px solid rgba(255,200,120,0.3);
          background: rgba(10,14,20,0.9);
          backdrop-filter: blur(12px);
          box-shadow: 0 0 70px rgba(255,200,120,0.15);
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        .phiHeader {
          font-size: 14px;
          opacity: 0.65;
        }

        .phiSignal {
          font-size: 20px;
        }

        .phiLayer {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .phiTitle {
          font-weight: 600;
        }

        .phiText {
          opacity: 0.85;
        }

        .phiMetric {
          font-family: monospace;
          font-size: 14px;
          color: rgba(255,220,160,0.9);
        }

        .phiRisk {
          color: rgba(255,120,120,0.85);
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
