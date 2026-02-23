import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Frey() {
  const [signal, setSignal] = useState("")
  const router = useRouter()

  const examples = [
    "Early-stage AI infrastructure startup",
    "Renewable energy DAO",
    "Founder facing burnout"
  ]

  const goReading = (value) => {
    const q = value || signal
    if (!q) return
    router.push(`/reading?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="phiPageFrame freyRoot heroScene">
      <div className="freyShell">

        <div className="freyModes">
          <button>PROJECT</button>
          <button>ASSET</button>
          <button>HUMAN</button>
        </div>

        <input
          value={signal}
          onChange={(e) => setSignal(e.target.value)}
          placeholder="Enter signal..."
        />

        <div className="exampleLayer">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="exampleItem"
              onClick={() => goReading(ex)}
            >
              {ex}
            </div>
          ))}
        </div>

        <div className="freyNav">
          <button onClick={() => goReading()}>Next</button>
        </div>

        <style jsx>{`
          .exampleLayer {
            margin-top: 20px;
            font-size: 13px;
            opacity: 0.8;
          }

          .exampleItem {
            margin-bottom: 6px;
            cursor: pointer;
            color: rgba(255,200,120,0.85);
          }

          .exampleItem:hover {
            opacity: 1;
          }
        `}</style>

      </div>
    </div>
  )
}
