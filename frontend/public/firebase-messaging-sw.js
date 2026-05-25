// firebase-messaging-sw.js
// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker.
// Fallback local service workers run beautifully even with default placeholder credentials.
firebase.initializeApp({
  apiKey: "aiza-placeholder",
  authDomain: "codequest-gamified.firebaseapp.com",
  projectId: "codequest-gamified",
  storageBucket: "codequest-gamified.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:placeholder"
});

const messaging = firebase.messaging();

// Handle background push messages cleanly
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);
  
  const notificationTitle = payload.notification?.title || 'CodeQuest Alert ⚔️';
  const notificationOptions = {
    body: payload.notification?.body || 'New learning challenges are waiting for you!',
    icon: '/next.svg',
    badge: '/next.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
