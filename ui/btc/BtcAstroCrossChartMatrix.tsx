import { FieldAnchorGlyph, RelationGlyph, SealedBoundaryGlyph } from "../../components/btc/BtcSurfaceGlyphs";
import {
  MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_ID,
  MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256,
} from "../../lib/btc-existing-glyph-canon";
import type { BtcCleanLocale, BtcCleanSemanticNative } from "../../lib/btc-clean-chat-v1";

function shortUtc(value: string | null, locale: BtcCleanLocale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(date);
}

export default function BtcAstroCrossChartMatrix({ locale, native }: { locale: BtcCleanLocale; native: BtcCleanSemanticNative }) {
  const ru = locale === "ru";
  const computed = native.status === "COMPUTED";
  return <section
    className="astroMatrix"
    data-astro-cross-chart-matrix="CURRENT_TO_GENESIS_MATRIX"
    data-matrix-status={native.status}
    data-glyph-canon={MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_ID}
    data-glyph-canon-sha={MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256}
  >
    <header className="matrixHead">
      <FieldAnchorGlyph className="matrixAnchor"/>
      <div><b>{ru ? "Текущее небо × Bitcoin Genesis" : "Current sky × Bitcoin Genesis"}</b><span>{shortUtc(native.current_timestamp_utc, locale)} · Genesis {shortUtc(native.reference_timestamp_utc, locale)}</span></div>
      <small>{computed ? `${native.displayed_relations}/${native.total_relations}` : (ru ? "недостаточно данных" : "insufficient evidence")}</small>
    </header>
    {computed ? <div className="matrixRows">
      {native.rows.map((row, index) => <article className="matrixRow" data-matrix-relation={row.relation_id} data-route-role={index === 0 ? "PRIMARY_ROUTE" : "SUPPORT_ROUTE"} key={row.relation_id}>
        <span className={index === 0 ? "matrixRoute matrixRoutePrimary" : "matrixRoute matrixRouteSupport"}><RelationGlyph/></span>
        <span className="matrixBody"><small>{ru ? "сейчас" : "current"}</small><b>{row.transit_body}</b></span>
        <span className="matrixAspect"><b>{row.aspect}</b><small>{ru ? "орб" : "orb"} {row.orb_deg.toFixed(3)}° / {row.orb_limit_deg.toFixed(1)}°</small></span>
        <span className="matrixBody"><small>Genesis</small><b>{row.genesis_body}</b></span>
        <span className="matrixCloseness"><small>{ru ? "порядок" : "order"}</small><b>{row.normalized_closeness.toFixed(3)}</b></span>
        <span className="matrixWindow" data-glyph-class="TEMPORAL_INTERVAL"><small>{ru ? "окно" : "window"}</small><b>{shortUtc(row.window.start_utc, locale)} → {shortUtc(row.window.end_utc, locale)}</b><em>{ru ? "пик" : "peak"} {shortUtc(row.window.peak_utc, locale)}</em></span>
      </article>)}
    </div> : <div className="matrixInsufficient" data-glyph-class="INSUFFICIENT_EVIDENCE">
      <FieldAnchorGlyph/><span>{ru ? "Нельзя построить отношение без обеих canonical эпох." : "The relation cannot be built without both canonical epochs."}</span>
    </div>}
    <footer className="matrixBoundary"><SealedBoundaryGlyph/><span>{ru ? "Близость задаёт только порядок отображения. Не причинность, не сила влияния и не прогноз цены BTC." : "Closeness controls display order only. It is not causality, influence strength, or a BTC price forecast."}</span></footer>
    <style jsx>{`
      .astroMatrix{margin:0 0 16px;border:1px solid rgba(214,180,106,.16);border-radius:16px;background:rgba(10,13,18,.72);overflow:hidden;min-width:0}.matrixHead{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06)}.matrixHead>div{display:grid;gap:3px;min-width:0}.matrixHead b{font-size:12px;color:#e0d2ae}.matrixHead span,.matrixHead small{font-size:9px;color:#737e89}.matrixRows{display:grid}.matrixRow{display:grid;grid-template-columns:42px minmax(72px,.8fr) minmax(110px,1fr) minmax(72px,.8fr) 64px minmax(180px,1.35fr);gap:10px;align-items:center;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.045);min-width:0}.matrixRow:last-child{border-bottom:0}.matrixRoute{height:25px;min-width:0;overflow:hidden}.matrixRoute :global(.relationGlyph){width:100%;height:25px;display:block}.matrixRoutePrimary :global(.supportRoutePath){display:none}.matrixRouteSupport :global(.primaryRoutePath){display:none}.matrixRoute :global(.primaryRoutePath),.matrixRoute :global(.supportRoutePath){fill:none;stroke:#d6b46a;stroke-width:18;vector-effect:non-scaling-stroke;opacity:.68}.matrixRouteSupport :global(.supportRoutePath){opacity:.32}.matrixBody,.matrixAspect,.matrixCloseness,.matrixWindow{display:grid;gap:2px;min-width:0}.matrixBody small,.matrixAspect small,.matrixCloseness small,.matrixWindow small,.matrixWindow em{font-size:8px;color:#68737e;font-style:normal}.matrixBody b,.matrixAspect b,.matrixCloseness b{font-size:11px;color:#c5ccd3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.matrixAspect b{color:#d7c28f}.matrixWindow b{font-size:9px;color:#9ea8b2;line-height:1.35;overflow-wrap:anywhere}.matrixInsufficient{display:flex;align-items:center;gap:10px;padding:16px 14px;color:#9ba4ad;font-size:11px}.matrixBoundary{display:flex;align-items:center;gap:9px;padding:9px 14px;border-top:1px solid rgba(255,255,255,.05);color:#5f6973;font-size:8px;line-height:1.45}.matrixBoundary :global(.sealedBoundaryGlyph){width:14px;height:14px;border:1px solid rgba(214,180,106,.22);border-radius:50%;position:relative;flex:0 0 auto}.matrixBoundary :global(.sealedBoundaryGlyph):after{content:"";position:absolute;left:2px;right:2px;top:6px;border-top:1px solid rgba(214,180,106,.45);transform:rotate(-35deg)}
      @media(max-width:680px){.astroMatrix{border-radius:14px}.matrixHead{grid-template-columns:24px minmax(0,1fr);padding:11px}.matrixHead>small{grid-column:2}.matrixRow{grid-template-columns:34px minmax(0,1fr) minmax(0,1fr);gap:7px 9px;padding:10px}.matrixRoute{grid-row:1/3;height:34px}.matrixRoute :global(.relationGlyph){height:34px}.matrixAspect{grid-column:2}.matrixBody:nth-of-type(4){grid-column:3;grid-row:1}.matrixCloseness{grid-column:3;grid-row:2}.matrixWindow{grid-column:2/4;padding-top:5px;border-top:1px dotted rgba(255,255,255,.05)}.matrixWindow b{white-space:normal}.matrixBoundary{align-items:flex-start}.matrixInsufficient{font-size:10px}}
    `}</style>
  </section>;
}
