import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getDatabase, Database } from "firebase-admin/database";

let app: App | null = null;
let db: Database | null = null;

export function firebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_DATABASE_URL &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Returns a Firebase Realtime Database handle, or null if credentials are
 * missing/invalid. Every caller MUST handle null and fall back to the
 * in-memory demo store (see lib/telemetry/store.ts) — missing Firebase
 * credentials must never crash the app.
 */
export function getDb(): Database | null {
  if (!firebaseConfigured()) return null;

  try {
    if (!app) {
      if (getApps().length === 0) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
          }),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
      } else {
        app = getApps()[0]!;
      }
    }
    if (!db) db = getDatabase(app);
    return db;
  } catch {
    return null;
  }
}
