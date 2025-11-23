import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize Firestore with persistent cache (new method)
// Note: initializeFirestore must be called before getFirestore, and only once
let db: Firestore;
if (typeof window !== "undefined") {
  // Client-side: try to use persistent cache
  try {
    // Initialize with persistent cache (only works if Firestore hasn't been initialized yet)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });
  } catch (error: any) {
    // If initialization fails (e.g., already initialized in another tab or module),
    // fall back to default Firestore
    if (error.code === "failed-precondition" || error.message?.includes("already been initialized")) {
      // Already initialized, use existing instance
      db = getFirestore(app);
    } else {
      console.warn("Failed to initialize Firestore with persistent cache, using default:", error);
      db = getFirestore(app);
    }
  }
} else {
  // Server-side: use default Firestore
  db = getFirestore(app);
}

export { db };

export default app;

