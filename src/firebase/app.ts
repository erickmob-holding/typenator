import { type FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

/**
 * Firebase web config for the "typenator" project. These values are public by
 * design — the client SDK ships them to the browser, and access is enforced by
 * Firestore security rules, not by secrecy. We still read them from the Vite env
 * so a fork can point at its own project without editing source.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDTK2PsNDnqxEUyf6iob2zYQlL1vRx0AkI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "typenator.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "typenator",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "typenator.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "74407560119",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:74407560119:web:60651214884dba3d8dde32",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-ELC2XTF0BG",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

/**
 * Firestore with offline persistence enabled (IndexedDB, multi-tab safe) so the
 * app keeps working without a connection and syncs when it reconnects.
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/** Analytics is best-effort: it is unavailable in some environments (SSR, tests). */
export let analytics: Analytics | null = null;
isSupported()
  .then((ok) => {
    if (ok) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {
    analytics = null;
  });
