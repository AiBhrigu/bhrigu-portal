import { useRouter } from 'next/router'

export default function Reading() {
  const router = useRouter()
  const { q } = router.query

  const isDemo = !q
  const signal = q || "Early-stage AI infrastructure startup"

  return (
    <div className="phiPageFrame freyRoot heroScene">
      <div className="freyShell">

        <div className="freySignalHeader">
          <div className="freyMode">Mode: project</div>
          <div className="freySignal">Signal: {signal}</div>
          {isDemo && (
            <div className="freyDemoLabel">Demonstration Example</div>
          )}
        </div>

        <div className="freyFrame">
          {isDemo ? (
            <>
              <div><strong>Objective Layer</strong><br/>
              Building distributed inference infrastructure optimized for modular AI workloads.</div>

              <div><strong>Timeline Layer</strong><br/>
              Transition window between prototype validation and first enterprise deployment.</div>

              <div><strong>Execution Layer</strong><br/>
              Bottleneck in orchestration scalability vs deployment maturity.</div>

              <div><strong>Risk Node</strong><br/>
              Capital runway misaligned with infrastructure expansion rate.</div>
            </>
          ) : (
            <>
              <div><strong>Objective Layer</strong></div>
              <div><strong>Timeline Layer</strong></div>
              <div><strong>Execution Layer</strong></div>
              <div><strong>Risk Node</strong></div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
