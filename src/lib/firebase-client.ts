import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;

/**
 * Inicialización segura de Firebase en el cliente (navegador).
 *
 * REGLAS DE SEGURIDAD (AGENTS.md):
 * - Inicializa ÚNICAMENTE Firebase Authentication (`firebase/auth`).
 * - PROHIBIDO importar `firebase/firestore` en el cliente.
 * - Utiliza exclusivamente variables públicas NEXT_PUBLIC_FIREBASE_*.
 */
export function getClientAuth(): Auth {
  if (clientAuth) {
    return clientAuth;
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/["',]/g, "").trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/["',]/g, "").trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/["',]/g, "").trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/["',]/g, "").trim(),
  };

  clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  clientAuth = getAuth(clientApp);
  return clientAuth;
}
