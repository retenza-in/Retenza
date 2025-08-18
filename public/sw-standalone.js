// Standalone Service Worker for Retenza PWA
// This handles both caching and push notifications

const CACHE_NAME = 'retenza-v1';
const STATIC_CACHE = 'retenza-static-v1';
const DYNAMIC_CACHE = 'retenza-dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll([
        '/',
        '/icon-192.png',
        '/icon-512.png',
        '/manifest.json'
      ]);
    }).then(() => {
      console.log('Static assets cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle caching strategy
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    // Network first for dynamic content
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else if (url.pathname === '/' || url.pathname.startsWith('/static/')) {
    // Cache first for static content
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request);
      })
    );
  } else {
    // Default: network first
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
  }
});

// Push event handling for notifications
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      const options = {
        body: data.body || 'New notification from Retenza',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'default',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        renotify: data.renotify || false,
        actions: data.actions || [],
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        silent: false,
        sound: '/notification-sound.mp3', // Optional: add a notification sound
      };

      // Show notification
      const notificationPromise = self.registration.showNotification(
        data.title || 'Retenza',
        options
      );

      event.waitUntil(notificationPromise);
      
    } catch (error) {
      console.error('Error processing push event:', error);
      
      // Fallback notification
      const fallbackOptions = {
        body: 'You have a new notification from Retenza',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'fallback',
        vibrate: [200, 100, 200],
      };

      event.waitUntil(
        self.registration.showNotification('Retenza', fallbackOptions)
      );
    }
  } else {
    // No data, show default notification
    const defaultOptions = {
      body: 'You have a new notification from Retenza',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'default',
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification('Retenza', defaultOptions)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle notification click
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions if needed
    switch (event.action) {
      case 'view':
        // Open the app
        event.waitUntil(
          clients.openWindow('/')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Default behavior
        event.waitUntil(
          clients.openWindow('/')
        );
    }
  } else {
    // Default behavior: focus/open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  // You can track notification engagement here
});

// Background sync for offline notifications
self.addEventListener('sync', function(event) {
  console.log('Background sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Processing background sync...')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', function(event) {
  console.log('Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

console.log('Retenza Standalone Service Worker loaded successfully'); 