# CarbonLens AI

"See the carbon. Predict the impact. Optimize the compute."

Carbon-aware compute monitoring and optimization prototype. Next.js (App
Router) + TypeScript + Tailwind frontend, Node.js API routes, Firebase
Realtime Database (optional), NVIDIA AI / NIM (optional) — all with a
working DEMO MODE fallback so the app runs with zero external credentials.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to /dashboard.

## Demo mode (default, no keys needed)

- Telemetry: an in-process simulator ticks every 2s, mutating GPU/CPU/RAM/
  power/energy/carbon for 4 seed workloads (`lib/telemetry/store.ts`).
- Database: Firebase is optional. Without `FIREBASE_*` env vars, state
  lives in memory for the running server process.
- AI: without `NVIDIA_API_KEY`, `/api/ai/recommend` and the Optimization
  page use a deterministic recommendation engine
  (`lib/ai/fallback.ts`) instead of calling NVIDIA — same shape of
  response, no external call.

Sidebar and Settings reflect the *real* state of each dependency, not a
hardcoded value.

## Going from demo to real

Copy `.env.example` to `.env.local` and fill in:

- `NVIDIA_API_KEY`, `NVIDIA_MODEL` — switches `/api/ai/recommend` to call
  the NVIDIA chat completions endpoint (`lib/ai/nvidia.ts`), with the
  fallback still guarding every network failure.
- `FIREBASE_*` — switches the app to a real Firebase Admin connection
  (`lib/firebase/admin.ts`). The telemetry store itself still needs to be
  pointed at Firebase writes/listeners if you want persistence beyond the
  demo simulator — `lib/telemetry/service.ts` is the seam to do that
  without touching any UI code.
- Real GPU telemetry: implement `lib/telemetry/service.ts` against
  NVIDIA DCGM / `nvidia-smi` output instead of `lib/telemetry/store.ts`'s
  simulator. Every API route and page consumes the service module only.

## Deploy to Vercel (via GitHub)

1. Push this repo to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```
2. On vercel.com: **New Project → Import Git Repository** → select the repo.
   Vercel auto-detects Next.js from `vercel.json`; no build settings to change.
3. (Optional) Add `NVIDIA_API_KEY`, `NVIDIA_MODEL`, `FIREBASE_*` under
   **Project Settings → Environment Variables** — copy the names from
   `.env.example`. Skip this entirely and the app runs in demo mode.
4. Click **Deploy**.

**One architecture note:** the live telemetry simulator (`lib/telemetry/store.ts`)
uses a `setInterval` inside a long-lived Node process, which is how
`next dev` / `next start` run it. Vercel's API routes are serverless
functions — they don't keep a background timer ticking between requests
the same way a persistent server does. Every API call still returns
correct, freshly-computed numbers either way; what may differ is the
"ticks every 2s in the background regardless of traffic" feel from local
dev. If you need that exact behavior in production, the numbers should
be computed per-request from elapsed wall-clock time instead of a
running interval — happy to make that change if it matters for your demo.

## Core calculation

```
Energy (kWh) = Power (kW) x Runtime (hours) x PUE
CO2e         = Energy (kWh) x Carbon Intensity (gCO2e/kWh)
```

Implemented once, for real, in `lib/carbon/engine.ts`
(`calculateCarbonImpact`) — the API and UI both read from it, nothing is
faked in the components.

## Structure

```
app/            routes: dashboard, workloads, workloads/[id], carbon,
                optimization, ai-assistant, settings, api/*
components/     dashboard, charts, workload, ai, layout
lib/            carbon (calc + regional intensity), telemetry (simulator +
                service seam), ai (nvidia client + fallback), optimization,
                firebase (admin init)
types/          shared TS types
```

## Product principle

This prototype is carbon-aware decision support and workload optimization
guidance — it does not claim to physically control any real data center.
Telemetry shown in demo mode is clearly simulated.
