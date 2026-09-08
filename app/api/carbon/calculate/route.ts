import { NextRequest, NextResponse } from "next/server";
import { calculateCarbonImpact, calculateSCI, calculateTotalCost, secondsToHours } from "@/lib/carbon/engine";
import { PRICE_OF_CARBON_USD_PER_TONNE } from "@/lib/carbon/intensity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      power,
      runtimeHours,
      carbonIntensity,
      pue,
      embodiedGrams,
      functionalUnitR,
      electricityPricePerKwh,
    } = body ?? {};

    if (
      typeof power !== "number" ||
      typeof runtimeHours !== "number" ||
      typeof carbonIntensity !== "number"
    ) {
      return NextResponse.json(
        { error: "power, runtimeHours, and carbonIntensity (numbers) are required" },
        { status: 400 }
      );
    }

    const result = calculateCarbonImpact(power, runtimeHours, carbonIntensity, pue ?? 1.0);

    // SCI is optional: only computed when embodied emissions (M) are given.
    // R defaults to runtimeHours (SCI per compute-hour) if not supplied.
    let sci = null;
    if (typeof embodiedGrams === "number") {
      const r = typeof functionalUnitR === "number" && functionalUnitR > 0 ? functionalUnitR : runtimeHours || secondsToHours(3600);
      sci = calculateSCI(result.energyKwh, carbonIntensity, embodiedGrams, r);
    }

    // Total $ cost (electricity + carbon price) is optional: only computed
    // when a region electricity price is supplied.
    let totalCostUsd = null;
    if (typeof electricityPricePerKwh === "number") {
      totalCostUsd = calculateTotalCost(
        result.energyKwh,
        electricityPricePerKwh,
        result.carbonKg,
        PRICE_OF_CARBON_USD_PER_TONNE
      );
    }

    return NextResponse.json({ result, sci, totalCostUsd });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
