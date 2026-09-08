import { NextResponse } from "next/server";
import { firebaseConfigured } from "@/lib/firebase/admin";
import { nvidiaConfigured } from "@/lib/ai/nvidia";
import { SystemStatus } from "@/types";

export async function GET() {
  const status: SystemStatus = {
    telemetry: "demo", // demo simulator is always the active source in this prototype
    database: firebaseConfigured() ? "connected" : "demo",
    ai: nvidiaConfigured() ? "nvidia" : "fallback",
  };
  return NextResponse.json({ status });
}
