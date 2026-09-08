import { NextResponse } from "next/server";
import { REGIONS } from "@/lib/carbon/intensity";

export async function GET() {
  return NextResponse.json({ regions: REGIONS });
}
