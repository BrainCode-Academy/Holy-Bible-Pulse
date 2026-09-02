// Holy Bible+ Service Worker for Notification & Offline Support
const CACHE_NAME = 'holy-bible-plus-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for push notifications (for future remote push notifications)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Holy Bible+';
    const options = {
      body: payload.body || 'Your daily Scripture is ready.',
      icon: payload.icon || '/assets/holy-bible-plus-logo.png',
      badge: payload.badge || '/assets/holy-bible-plus-logo.png',
      data: payload.data || { tab: 'home' },
      tag: payload.tag || 'holy-bible-plus-daily',
      renotify: true,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Push error in SW:', err);
  }
});

// Handle notification click to focus or deep link to appropriate tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetTab = data.tab || 'home';
  const targetUrl = new URL(`/?tab=${targetTab}`, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing Holy Bible+ window is already open, focus it and post a message
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'HB_NOTIFICATION_CLICK',
            tab: targetTab,
            data: data,
          });
          return client.focus();
        }
      }

      // 2. Otherwise open a new window with the deep link tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
