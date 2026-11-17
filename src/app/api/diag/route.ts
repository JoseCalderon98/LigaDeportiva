import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const diag: Record<string, unknown> = {
    nodeVersion: process.version,
    hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
    hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
  };

  try {
    const appMod = await import("firebase-admin/app");
    diag.appModule = typeof appMod.initializeApp;
  } catch (err: unknown) {
    diag.appModuleError = err instanceof Error ? err.message : String(err);
  }

  try {
    const authMod = await import("firebase-admin/auth");
    diag.authModule = typeof authMod.getAuth;
  } catch (err: unknown) {
    diag.authModuleError = err instanceof Error ? err.message : String(err);
  }

  try {
    const firestoreMod = await import("firebase-admin/firestore");
    diag.firestoreModule = typeof firestoreMod.getFirestore;
  } catch (err: unknown) {
    diag.firestoreModuleError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(diag, { status: 200 });
}
