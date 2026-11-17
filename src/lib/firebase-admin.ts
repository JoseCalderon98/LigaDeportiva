import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

/**
 * Inicialización perezosa (lazy singleton) de Firebase Admin.
 * Se ejecuta exclusivamente en el servidor Node.js.
 */
function getFirebaseAdminApp(): App {
  if (typeof window !== "undefined") {
    throw new Error(
      "Seguridad: firebase-admin solo puede ejecutarse en el entorno del servidor."
    );
  }

  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/["',]/g, "").trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/["',]/g, "").trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (privateKey) {
    const beginTag = "-----BEGIN PRIVATE KEY-----";
    const endTag = "-----END PRIVATE KEY-----";

    const beginIdx = privateKey.indexOf(beginTag);
    const endIdx = privateKey.indexOf(endTag);

    if (beginIdx !== -1 && endIdx !== -1) {
      privateKey = privateKey.substring(beginIdx, endIdx + endTag.length);
    } else {
      if (
        (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))
      ) {
        privateKey = privateKey.slice(1, -1);
      }
    }

    // Reemplaza los saltos de línea literales "\\n" comunes en variables de entorno
    privateKey = privateKey.replace(/\\n/g, "\n").trim() + "\n";
  }

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Inicialización por defecto (útil para emuladores, tests o GCP environments)
    adminApp = initializeApp({
      projectId: projectId || "demo-liga-deportiva",
    });
  }

  return adminApp;
}

/**
 * Retorna la instancia de Firebase Admin Auth.
 */
export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

/**
 * Retorna la instancia de Firebase Admin Firestore.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
