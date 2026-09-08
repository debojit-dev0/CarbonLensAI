import { CarbonIntensityPoint, Region, RegionIntensity } from "@/types";

// 24h carbon-intensity curves per region (gCO2e/kWh), demo grid-mix data.
// Region B leans renewable-heavy in the evening; Region C stays coal-heavy.
const CURVE_A: CarbonIntensityPoint[] = [
  { hour: "00:00", value: 390 },
  { hour: "04:00", value: 350 },
  { hour: "08:00", value: 440 },
  { hour: "12:00", value: 510 },
  { hour: "16:00", value: 380 },
  { hour: "20:00", value: 250 },
  { hour: "24:00", value: 300 },
];

const CURVE_B: CarbonIntensityPoint[] = [
  { hour: "00:00", value: 300 },
  { hour: "04:00", value: 260 },
  { hour: "08:00", value: 320 },
  { hour: "12:00", value: 340 },
  { hour: "16:00", value: 290 },
  { hour: "20:00", value: 250 },
  { hour: "24:00", value: 270 },
];

const CURVE_C: CarbonIntensityPoint[] = [
  { hour: "00:00", value: 480 },
  { hour: "04:00", value: 460 },
  { hour: "08:00", value: 520 },
  { hour: "12:00", value: 560 },
  { hour: "16:00", value: 510 },
  { hour: "20:00", value: 470 },
  { hour: "24:00", value: 490 },
];

export const REGIONS: RegionIntensity[] = [
  { region: "Region A", gPerKwh: 510, curve: CURVE_A, electricityPricePerKwh: 0.15 },
  { region: "Region B", gPerKwh: 250, curve: CURVE_B, electricityPricePerKwh: 0.19 },
  { region: "Region C", gPerKwh: 420, curve: CURVE_C, electricityPricePerKwh: 0.11 },
];

// Demo shadow price of carbon used in $ cost and MAC calculations.
export const PRICE_OF_CARBON_USD_PER_TONNE = 50;

// Embodied (manufacturing/hardware) emissions, amortized per compute-hour,
// used as the "M" term in the SCI formula. Training workloads run on more
// GPU silicon per hour than inference/batch, so they carry a heavier
// embodied share.
export const EMBODIED_GRAMS_PER_HOUR: Record<string, number> = {
  Training: 850,
  Inference: 320,
  Batch: 180,
};

export function getRegion(region: Region): RegionIntensity {
  const found = REGIONS.find((r) => r.region === region);
  if (!found) throw new Error(`Unknown region: ${region}`);
  return found;
}

export function coalBaselineRegion(): RegionIntensity {
  // "Coal baseline" = the dirtiest region on the grid today — the
  // reference point MAC is measured against.
  return REGIONS.reduce((a, b) => (b.gPerKwh > a.gPerKwh ? b : a));
}

export function bestWindow(region: RegionIntensity): {
  window: string;
  value: number;
  reductionPct: number;
} {
  const min = region.curve.reduce((a, b) => (b.value < a.value ? b : a));
  const peak = region.curve.reduce((a, b) => (b.value > a.value ? b : a));
  const reductionPct = ((peak.value - min.value) / peak.value) * 100;
  return { window: `${min.hour}`, value: min.value, reductionPct };
}

export function lowestCarbonRegion(): RegionIntensity {
  return REGIONS.reduce((a, b) => (b.gPerKwh < a.gPerKwh ? b : a));
}

/**
 * Interpolates a region's carbon intensity at an arbitrary hour (0-24),
 * linearly between the two nearest points on its 7-point demo curve.
 * The curve wraps midnight-to-midnight (00:00 and 24:00 are the same
 * moment), so hour 23 interpolates between the 20:00 and 24:00 points.
 */
export function intensityAtHour(region: RegionIntensity, hour: number): number {
  const h = ((hour % 24) + 24) % 24; // normalize to [0, 24)
  const points = region.curve;

  const toHourNum = (label: string) => parseInt(label.split(":")[0], 10);

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const aHour = toHourNum(a.hour);
    const bHour = toHourNum(b.hour) === 0 ? 24 : toHourNum(b.hour);
    if (h >= aHour && h <= bHour) {
      const t = bHour === aHour ? 0 : (h - aHour) / (bHour - aHour);
      return Math.round(a.value + (b.value - a.value) * t);
    }
  }
  return points[points.length - 1].value;
}

/**
 * Best-effort natural-language time parser for chat questions like
 * "6 pm", "18:00", "6:30pm", "noon", "midnight", or a bare "6". Returns
 * the parsed hour in [0, 24), plus whether the meridiem (am/pm) was
 * ambiguous — a bare "6" with no am/pm, colon, or 24h marker could mean
 * 06:00 or 18:00, and callers should say so rather than silently picking
 * one. Returns null if no time expression is found at all.
 */
export function parseHourFromText(text: string): { hour: number; ambiguous: boolean } | null {
  const lower = text.toLowerCase();

  if (/\bnoon\b/.test(lower)) return { hour: 12, ambiguous: false };
  if (/\bmidnight\b/.test(lower)) return { hour: 0, ambiguous: false };

  // 12h form with explicit am/pm: "6pm", "6 pm", "6:30 pm" — unambiguous.
  const h12 = lower.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/);
  if (h12) {
    let hour = parseInt(h12[1], 10) % 12;
    if (h12[3] === "pm") hour += 12;
    return { hour, ambiguous: false };
  }

  // Explicit 24h form: "18:00", "18h", "18 hrs" — unambiguous whenever the
  // hour is >12, or a colon/"h"/"hrs" marker signals a 24h clock read.
  const h24 = lower.match(/\b([01]?\d|2[0-3])(:([0-5]\d))?\s*(h|hrs|hours)?\b(?!\s*(am|pm))/);
  if (h24 && /\d/.test(h24[0])) {
    const hour = parseInt(h24[1], 10);
    if (hour >= 0 && hour <= 23) {
      const hasExplicit24hMarker = Boolean(h24[2]) || Boolean(h24[4]) || hour > 12;
      return { hour, ambiguous: !hasExplicit24hMarker };
    }
  }
  return null;
}
