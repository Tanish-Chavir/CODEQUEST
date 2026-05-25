import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let isFirebaseInitialized = false;

try {
  // Check for firebase credential configuration in .env
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (serviceAccountPath) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    isFirebaseInitialized = true;
    console.log("[FirebaseService] Firebase Admin SDK initialized successfully via JSON certificate.");
  } else if (privateKey && clientEmail && projectId) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped newline characters if loaded via inline environment variables
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    isFirebaseInitialized = true;
    console.log("[FirebaseService] Firebase Admin SDK initialized successfully via inline config.");
  } else {
    console.warn(
      "\n⚠️ [FirebaseService] FCM keys are not configured in your .env file.\n" +
      "👉 Push notifications will run in LOCAL SIMULATOR mode (logs in server console).\n" +
      "👉 Fallback Web Notification API will operate on your frontend dynamically for easy testing!\n"
    );
  }
} catch (error) {
  console.error("Critical: Firebase Admin SDK initialization failed:", error.message);
}

export const firebaseService = {
  /**
   * Send Firebase Cloud Messaging push notification to multiple device tokens
   * @param {string[]} tokens - Array of active FCM registration tokens
   * @param {string} title - Heading alert text
   * @param {string} body - Subtext message body
   * @param {object} data - Optional payload dictionary
   */
  async sendPushNotification(tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0) return;

    // Filter out invalid/empty tokens
    const validTokens = tokens.filter(Boolean);
    if (validTokens.length === 0) return;

    if (!isFirebaseInitialized) {
      console.log(
        `\n🔔 [FCM SIMULATOR - PUSH SENT]` +
        `\n👥 Target Devices (Tokens count): ${validTokens.length}` +
        `\n🏷️ Title: "${title}"` +
        `\n📝 Body: "${body}"` +
        `\n📦 Data Payload: ${JSON.stringify(data)}\n`
      );
      return { success: true, simulated: true };
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          click_action: "/dashboard", // Direct click redirect on browser
        },
        tokens: validTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(
        `[FCM Service] Sent push alert. Success: ${response.successCount}, Failures: ${response.failureCount}`
      );

      // Clean up stale or invalid tokens dynamically to save Mongoose size!
      const staleTokens = [];
      response.responses.forEach((res, index) => {
        if (!res.success) {
          const error = res.error;
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            staleTokens.push(validTokens[index]);
          }
        }
      });

      return { 
        success: true, 
        successCount: response.successCount, 
        staleTokens 
      };

    } catch (error) {
      console.error("[FCM Service] Push delivery failed:", error.message);
      return { success: false, error: error.message };
    }
  },
};
