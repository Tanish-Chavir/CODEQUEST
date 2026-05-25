import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, Messaging } from "firebase/messaging";

// Standard Firebase Client configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "aiza-placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "codequest-gamified.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codequest-gamified",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "codequest-gamified.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "987654321012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:987654321012:web:placeholder"
};

// Safe variables to prevent server-side crashes during Next.js hydration
let app: FirebaseApp | undefined;
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.error("Firebase App initialization failed on client:", error);
  }
}

/**
 * Safe client helper to fetch the FCM messaging instance if browser compatible
 */
export const getFcmMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") return null;
  if (messaging) return messaging;

  try {
    const supported = await isSupported();
    if (supported && app) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (error) {
    console.warn("FCM Messaging is not supported or failed to initialize in this browser:", error);
  }
  return null;
};

/**
 * Retrieve active registration device token from FCM
 */
export const requestFcmToken = async (): Promise<string | null> => {
  try {
    const messagingInstance = await getFcmMessaging();
    if (!messagingInstance) return null;

    // Use standard VAPID key from environment variables or safe public key placeholder
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(messagingInstance, {
      vapidKey,
    });

    return token;
  } catch (error) {
    console.warn("FCM registration token retrieval skipped/failed:", error);
    return null;
  }
};
