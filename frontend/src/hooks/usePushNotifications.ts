"use client";

import { useState, useEffect } from "react";
import { requestFcmToken, getFcmMessaging } from "@/lib/firebase";
import { fetchWithAuth } from "@/lib/api";
import { onMessage } from "firebase/messaging";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen to foreground FCM alerts dynamically
  useEffect(() => {
    let unsubscribe = () => {};

    const setupForegroundListener = async () => {
      const messaging = await getFcmMessaging();
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          console.log("[usePushNotifications] Foreground push alert received:", payload);
          
          // Trigger dynamic local browser notification alert instantly
          if (Notification.permission === "granted") {
            new Notification(payload.notification?.title || "CodeQuest ⚔️", {
              body: payload.notification?.body || "New activity detected.",
              icon: "/next.svg"
            });
          }
        });
      }
    };

    setupForegroundListener();
    return () => unsubscribe();
  }, []);

  /**
   * Request browser notifications permission and register token in backend
   */
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support desktop notifications.");
      return false;
    }

    setLoading(true);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === "granted") {
        console.log("Browser notification permission granted! Initializing FCM token registration...");
        
        // 1. Fetch token from Firebase Cloud Messaging
        const fcmToken = await requestFcmToken();
        
        if (fcmToken) {
          setToken(fcmToken);
          // 2. Upload and save the token securely in the user's DB profile
          await fetchWithAuth("/auth/fcm-token", {
            method: "POST",
            body: JSON.stringify({ token: fcmToken }),
          });
          console.log("FCM registration token synchronized securely with CodeQuest servers.");
        } else {
          console.log(
            "FCM credentials not loaded. local simulation fallback active. Native notifications will trigger!"
          );
        }

        // Display a delightful initial confirmation alert
        new Notification("Notifications Enabled! 🔔", {
          body: "You're all set! We will notify you here for daily study reminders and account updates.",
          icon: "/next.svg",
        });

        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Error setting up browser push notifications:", error);
    }
    setLoading(false);
    return false;
  };

  /**
   * Simulate a quick notification for developer testing immediately!
   */
  const triggerSimulation = () => {
    if (Notification.permission === "granted") {
      new Notification("Study Reminder ⏰", {
        body: "Ready for your daily CodeQuest? Jump in to maintain your active learning streak!",
        icon: "/next.svg",
      });
    } else {
      alert("Please enable notification permissions first using the settings panel.");
    }
  };

  return {
    permission,
    token,
    loading,
    requestNotificationPermission,
    triggerSimulation,
  };
}
