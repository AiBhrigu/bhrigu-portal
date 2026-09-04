import { useMemo } from "react";

type Body = {
  key: string;
  longitude: number;
  retrograde?: boolean;
};

type Aspect = {
  a: string;
  b: string;
  phase: "APPLYING" | "SEPARATING";
  orb: number;
};

type Props = {
  bodies: Body[];
  aspects?: Aspect[];
  size?: number;
};

const PHI = (1 + Math.sqrt(5)) / 2;
const INV_PHI = 1 / PHI;
const INV_PHI2 = INV_PHI * INV_PHI;
const EARTH_AXIAL_TILT_DEG = 23.44;

const BODY_GLYPH: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

export const BHRIGU_PHI_COSMOGRAPH_LAW = {
  equalHouseDegrees: 30,
  houseCount: 12,
  axialTiltMetaphorDeg: EARTH_AXIAL_TILT_DEG,
  orientation: {
    zeroAries: "LEFT",
    ninetyCancer: "BOTTOM",
    oneEightyLibra: "RIGHT",
    twoSeventyCapricorn: "TOP",
  },
} as const;

export function normalizeCosmographLongitude(value: number) {
  return ((value % 360) + 360) % 360;
}

export function cosmographScreenAngleDeg(longitude: number) {
  return 180 - normalizeCosmographLongitude(longitude);
}

export function cosmographDegreeInSign(longitude: number) {
  return normalizeCosmographLongitude(longitude) % 30;
}

export function bhriguPhiGeometry(size: number) {
  const outer = size * 0.455;
  const aspect = outer * INV_PHI;
  const shell = outer - aspect;
  const houseWeight = INV_PHI;
  const zodiacWeight = 1;
  const scaleWeight = INV_PHI2;
  const planetWeight = PHI;
  const weightSum = houseWeight + zodiacWeight + scaleWeight + planetWeight;

  const houseWidth = shell * houseWeight / weightSum;
  const zodiacWidth = shell * zodiacWeight / weightSum;
  const scaleWidth = shell * scaleWeight / weightSum;
  const planetWidth = shell * planetWeight / weightSum;

  const houseOuter = outer;
  const houseInner = houseOuter - houseWidth;
  const zodiacOuter = houseInner;
  const zodiacInner = zodiacOuter - zodiacWidth;
  const scaleOuter = zodiacInner;
  const scaleInner = scaleOuter - scaleWidth;
  const planetOuter = scaleInner;
  const planetInner = planetOuter - planetWidth;

  return {
    outer,
    aspect,
    houseWidth,
    zodiacWidth,
    scaleWidth,
    planetWidth,
    houseOuter,
    houseInner,
    zodiacOuter,
    zodiacInner,
    scaleOuter,
    scaleInner,
    planetOuter,
    planetInner,
  };
}

const SIGNS = [
  ["♈", "Aries"], ["♉", "Taurus"], ["♊", "Gemini"], ["♋", "Cancer"],
  ["♌", "Leo"], ["♍", "Virgo"], ["♎", "Libra"], ["♏", "Scorpio"],
  ["♐", "Sagittarius"], ["♑", "Capricorn"], ["♒", "Aquarius"], ["♓", "Pisces"],
] as const;

/**
 * BHRIGU Φ COSMOGRAPH
 *
 * Fixed tropical orientation:
 * 0° Aries = LEFT, 90° Cancer = BOTTOM,
 * 180° Libra = RIGHT, 270° Capricorn = TOP.
 *
 * Outer → inner:
 * equal 30° cosmographic houses → zodiac → 360° scale →
 * planets → aspects → Φ observer-origin.
 *
 * The central Φ and its blue field arcs are a symbolic geocentric
 * Earth/observer origin. Their 23.44° tilt is an axial-tilt visual metaphor,
 * not a physical magnetic-field model and not a daily ephemeris datum.
 */
export default function BhriguPhiCosmograph({
  bodies,
  aspects = [],
  size = 1200,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;

  const palette = {
    field: "#07090C",
    gold: "#C8A45A",
    goldHigh: "#E0C47F",
    ivory: "#F1EFE9",
    blue: "#62A8D8",
    violet: "#9A89D1",
    muted: "rgba(241,239,233,.50)",
  };

  const polar = (longitude: number, r: number) => {
    const a = (cosmographScreenAngleDeg(longitude) * Math.PI) / 180;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  };

  const radialLine = (longitude: number, r1: number, r2: number) => {
    const p1 = polar(longitude, r1);
    const p2 = polar(longitude, r2);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  };

  const geometry = bhriguPhiGeometry(size);
  const R_OUTER = geometry.outer;
  const R_ASPECT = geometry.aspect;
  const SCALE_W = geometry.scaleWidth;
  const PLANET_W = geometry.planetWidth;
  const R_HOUSE_OUTER = geometry.houseOuter;
  const R_HOUSE_INNER = geometry.houseInner;
  const R_ZODIAC_OUTER = geometry.zodiacOuter;
  const R_ZODIAC_INNER = geometry.zodiacInner;
  const R_SCALE_OUTER = geometry.scaleOuter;
  const R_SCALE_INNER = geometry.scaleInner;
  const R_PLANET_OUTER = geometry.planetOuter;
  const R_PLANET_INNER = geometry.planetInner;

  const placedBodies = useMemo(() => {
    const normalized = bodies
      .map((body) => ({ ...body, longitude: normalizeCosmographLongitude(body.longitude) }))
      .sort((a, b) => a.longitude - b.longitude);

    if (!normalized.length) return [];

    let largestGap = -1;
    let cutAfter = 0;
    for (let i = 0; i < normalized.length; i += 1) {
      const current = normalized[i].longitude;
      const next = i === normalized.length - 1
        ? normalized[0].longitude + 360
        : normalized[i + 1].longitude;
      const gap = next - current;
      if (gap > largestGap) {
        largestGap = gap;
        cutAfter = i;
      }
    }

    const ordered = [
      ...normalized.slice(cutAfter + 1),
      ...normalized.slice(0, cutAfter + 1).map((body) => ({
        ...body,
        longitude: body.longitude + 360,
      })),
    ];

    const CLUSTER_GAP_DEG = 7.5;
    const clusters: typeof ordered[] = [];
    let cluster: typeof ordered = [];

    for (const body of ordered) {
      if (!cluster.length) {
        cluster = [body];
        continue;
      }
      const previous = cluster[cluster.length - 1];
      if (body.longitude - previous.longitude <= CLUSTER_GAP_DEG) {
        cluster.push(body);
      } else {
        clusters.push(cluster);
        cluster = [body];
      }
    }
    if (cluster.length) clusters.push(cluster);

    const placed: Array<Body & {
      exactLongitude: number;
      displayLongitude: number;
      r: number;
      fontSize: number;
    }> = [];

    for (const group of clusters) {
      const n = group.length;
      const usableOuter = R_PLANET_OUTER - PLANET_W * 0.13;
      const usableInner = R_PLANET_INNER + PLANET_W * 0.13;
      const radialSpan = Math.max(1, usableOuter - usableInner);
      const radialStep = n > 1 ? radialSpan / (n - 1) : 0;
      const angularStep = n <= 4 ? 0 : Math.min(1.25, 5 / n);

      group.forEach((body, index) => {
        const centeredIndex = index - (n - 1) / 2;
        const r = n === 1
          ? (R_PLANET_OUTER + R_PLANET_INNER) / 2
          : usableOuter - index * radialStep;

        const exactLongitude = normalizeCosmographLongitude(body.longitude);
        const displayLongitude = normalizeCosmographLongitude(
          exactLongitude + centeredIndex * angularStep
        );
        const fontSize = Math.max(
          size * 0.015,
          Math.min(size * 0.030, n <= 1 ? size * 0.030 : radialStep * 0.72)
        );

        placed.push({
          ...body,
          longitude: exactLongitude,
          exactLongitude,
          displayLongitude,
          r,
          fontSize,
        });
      });
    }

    return placed.sort((a, b) => a.exactLongitude - b.exactLongitude);
  }, [bodies, PLANET_W, R_PLANET_INNER, R_PLANET_OUTER, size]);

  const bodyMap = useMemo(
    () => new Map(placedBodies.map((body) => [body.key, body])),
    [placedBodies]
  );

  return (
    <svg
      data-phi-cosmograph="BHRIGU_PHI_COSMOGRAPH_V0_1"
      data-radial-order="houses-zodiac-degree-scale-planets-aspects-phi"
      data-zero-aries="left"
      data-ninety-cancer="bottom"
      data-one-eighty-libra="right"
      data-two-seventy-capricorn="top"
      width="100%"
      height="auto"
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="BHRIGU Phi cosmographic wheel"
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        maxWidth: `${size}px`,
        background: palette.field,
        fontFamily:
          '"Inter","Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",sans-serif',
      }}
    >
      <rect width={size} height={size} fill={palette.field} />

      {[0, 90, 180, 270].map((longitude) => {
        const line = radialLine(longitude, 0, R_OUTER);
        return <line key={`axis-${longitude}`} {...line} stroke={palette.ivory} strokeWidth={1} opacity={0.10} />;
      })}

      <circle cx={cx} cy={cy} r={R_HOUSE_OUTER} fill="none" stroke={palette.ivory} strokeWidth={1} opacity={0.28} />
      <circle cx={cx} cy={cy} r={R_HOUSE_INNER} fill="none" stroke={palette.ivory} strokeWidth={1} opacity={0.23} />
      <circle cx={cx} cy={cy} r={R_ZODIAC_INNER} fill="none" stroke={palette.gold} strokeWidth={1} opacity={0.46} />
      <circle cx={cx} cy={cy} r={R_SCALE_INNER} fill="none" stroke={palette.blue} strokeWidth={0.8} opacity={0.32} />
      <circle cx={cx} cy={cy} r={R_PLANET_INNER} fill="none" stroke={palette.ivory} strokeWidth={0.8} opacity={0.22} />

      {Array.from({ length: 12 }, (_, i) => i * 30).map((longitude) => {
        const line = radialLine(longitude, R_HOUSE_INNER, R_HOUSE_OUTER);
        return <line key={`house-boundary-${longitude}`} {...line} stroke={palette.ivory} strokeWidth={longitude % 90 === 0 ? 1 : 0.7} opacity={longitude % 90 === 0 ? 0.36 : 0.21} />;
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const point = polar(i * 30 + 15, (R_HOUSE_OUTER + R_HOUSE_INNER) / 2);
        return <text key={`house-${i + 1}`} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fill={palette.ivory} opacity={0.62} fontSize={size * 0.017} fontFamily='Georgia,"Times New Roman",serif'>{i + 1}</text>;
      })}

      {Array.from({ length: 12 }, (_, i) => i * 30).map((longitude) => {
        const line = radialLine(longitude, R_ZODIAC_INNER, R_ZODIAC_OUTER);
        return <line key={`zodiac-boundary-${longitude}`} {...line} stroke={palette.gold} strokeWidth={longitude % 90 === 0 ? 1.1 : 0.8} opacity={longitude % 90 === 0 ? 0.62 : 0.40} />;
      })}

      {SIGNS.map(([glyph, name], i) => {
        const point = polar(i * 30 + 15, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2);
        return <text key={name} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fill={palette.goldHigh} fontSize={size * 0.034} fontFamily='"Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",serif'>{glyph}</text>;
      })}

      {[0, 90, 180, 270].map((longitude) => {
        const line = radialLine(longitude, R_ZODIAC_INNER, R_HOUSE_OUTER);
        return <line key={`cardinal-cusp-${longitude}`} {...line} stroke={palette.goldHigh} strokeWidth={1.3} opacity={0.68} />;
      })}

      {Array.from({ length: 360 }, (_, degree) => {
        const major10 = degree % 10 === 0;
        const major5 = degree % 5 === 0;
        const tickLength = major10 ? SCALE_W * 0.86 : major5 ? SCALE_W * 0.60 : SCALE_W * 0.32;
        const outer = polar(degree, R_SCALE_OUTER);
        const inner = polar(degree, R_SCALE_OUTER - tickLength);
        return <line key={`degree-${degree}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={palette.blue} strokeWidth={major10 ? 1 : 0.55} opacity={major10 ? 0.68 : major5 ? 0.45 : 0.24} />;
      })}

      {placedBodies.map((body) => {
        const exact = polar(body.exactLongitude, R_SCALE_INNER);
        const display = polar(body.displayLongitude, body.r + body.fontSize * 0.60);
        return <line key={`locator-${body.key}`} data-exact-longitude={body.exactLongitude.toFixed(4)} x1={exact.x} y1={exact.y} x2={display.x} y2={display.y} stroke={palette.blue} strokeWidth={0.75} opacity={0.30} />;
      })}

      {placedBodies.map((body) => {
        const point = polar(body.displayLongitude, body.r);
        const degree = cosmographDegreeInSign(body.exactLongitude);
        const glyph = BODY_GLYPH[body.key] ?? "·";
        return <g key={body.key} data-planet-glyph={body.key}><text x={point.x} y={point.y - size * 0.003} textAnchor="middle" dominantBaseline="central" fill={palette.ivory} fontSize={body.fontSize} fontFamily='"Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",serif'>{glyph}</text><text x={point.x} y={point.y + body.fontSize * 0.72} textAnchor="middle" fill={palette.muted} fontSize={Math.max(size * 0.008, body.fontSize * 0.30)}>{degree.toFixed(2)}°{body.retrograde ? " R" : ""}</text></g>;
      })}

      {aspects.map((aspect, i) => {
        const a = bodyMap.get(aspect.a);
        const b = bodyMap.get(aspect.b);
        if (!a || !b) return null;
        const p1 = polar(a.exactLongitude, R_ASPECT * 0.985);
        const p2 = polar(b.exactLongitude, R_ASPECT * 0.985);
        const applying = aspect.phase === "APPLYING";
        return <line key={`${aspect.a}-${aspect.b}-${i}`} data-aspect-phase={aspect.phase} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={applying ? palette.blue : palette.violet} strokeWidth={applying ? 1.5 : 1.1} opacity={applying ? 0.72 : 0.50} strokeDasharray={applying ? undefined : `${size * 0.0055} ${size * 0.004}`} />;
      })}

      <g data-observer-origin="EARTH_PHI" data-axial-tilt-metaphor-deg={EARTH_AXIAL_TILT_DEG} data-magnetic-field-model="symbolic" transform={`rotate(${-EARTH_AXIAL_TILT_DEG} ${cx} ${cy})`}>
        <line x1={cx} y1={cy - size * 0.054} x2={cx} y2={cy + size * 0.054} stroke={palette.blue} strokeWidth={0.9} opacity={0.18} />
        {[0.036, 0.043].flatMap((height, index) => {
          const width = index === 0 ? 0.034 : 0.055;
          const opacity = index === 0 ? 0.17 : 0.23;
          return ([-1, 1] as const).map((side) => <path key={`field-${index}-${side}`} d={`M ${cx} ${cy - size * height} C ${cx + side * size * width} ${cy - size * 0.016}, ${cx + side * size * width} ${cy + size * 0.016}, ${cx} ${cy + size * height}`} fill="none" stroke={palette.blue} strokeWidth={index === 0 ? 0.8 : 1} opacity={opacity} />);
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={palette.ivory} fontSize={size * 0.028} fontFamily='Georgia,"Times New Roman",serif' opacity={0.94}>Φ</text>
      </g>
    </svg>
  );
}
