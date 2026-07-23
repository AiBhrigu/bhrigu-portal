import { BTC_EXISTING_PRIMARY_ROUTE_PATH, BTC_EXISTING_SUPPORT_ROUTE_PATH } from "../../lib/btc-existing-glyph-canon";

export function FieldAnchorGlyph({ className = "" }: { className?: string }) {
  return <span className={`fieldAnchorGlyph ${className}`} data-glyph-class="FIELD_ANCHOR" aria-hidden="true"><b>Φ</b></span>;
}

export function RelationGlyph({ className = "" }: { className?: string }) {
  return (
    <svg className={`relationGlyph ${className}`} viewBox="0 0 1000 560" preserveAspectRatio="none" data-glyph-class="PRIMARY_ROUTE SUPPORT_ROUTE" aria-hidden="true">
      <path className="primaryRoutePath" d={BTC_EXISTING_PRIMARY_ROUTE_PATH} />
      <path className="supportRoutePath" d={BTC_EXISTING_SUPPORT_ROUTE_PATH} />
    </svg>
  );
}

export function SealedBoundaryGlyph() {
  return <span className="sealedBoundaryGlyph" data-glyph-class="SEALED_BOUNDARY" aria-hidden="true" />;
}
