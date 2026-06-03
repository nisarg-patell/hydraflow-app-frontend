const CACHE_NAME = 'hydroflow-v1';

let authToken = '';
let backendUrl = '';
let quickAddAmount1 = 250;
let quickAddAmount2 = 500;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch
});

self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'SET_CONFIG') {
      authToken = event.data.token;
      backendUrl = event.data.backendUrl;
      quickAddAmount1 = event.data.amount1 || 250;
      quickAddAmount2 = event.data.amount2 || 500;
    } else if (event.data.type === 'SHOW_NOTIFICATION' || event.data.type === 'UPDATE_NOTIFICATION') {
      refreshNotificationData();
    } else if (event.data.type === 'HIDE_NOTIFICATION') {
      self.registration.getNotifications().then(notifications => {
        notifications.forEach(n => n.close());
      });
    }
  }
});

async function showStickyNotification(title, body) {
  const options = {
    body: body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    requireInteraction: true, // Makes it sticky on supported Androids
    tag: 'hydroflow-sticky', // Ensures we overwrite the same notification
    renotify: true,
    actions: [
      { action: `add-${quickAddAmount1}`, title: `+${quickAddAmount1}ml` },
      { action: `add-${quickAddAmount2}`, title: `+${quickAddAmount2}ml` }
    ]
  };
  await self.registration.showNotification(title, options);
}

async function refreshNotificationData() {
  if (!authToken || !backendUrl) return;
  try {
    const todayRes = await fetch(`${backendUrl}/water/today`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const todayData = await todayRes.json();
    const total = todayData.total;
    const goal = todayData.dynamic_goal || 2000;
    showStickyNotification('HydroFlow Progress', `${total}ml / ${goal}ml logged today!`);
  } catch (err) {
    console.error('Failed to refresh notification data:', err);
  }
}

self.addEventListener('notificationclick', (event) => {
  // If the user clicks the notification itself (not an action), open the app
  if (!event.action) {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        if (windowClients.length > 0) {
          windowClients[0].focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
    return;
  }

  // Handle Action Buttons
  if (event.action.startsWith('add-')) {
    const amount = parseInt(event.action.split('-')[1]);
    
    // Don't close the notification, just update it if possible
    // event.notification.close();

    if (!authToken || !backendUrl) {
      console.error('Service worker missing auth token');
      return;
    }

    event.waitUntil(
      (async () => {
        try {
          // Log water
          await fetch(`${backendUrl}/water/log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              amount: amount,
              label: 'Notification Add',
              beverage_type: 'water',
              multiplier: 1.0
            })
          });

          // Fetch new today status to update notification
          await refreshNotificationData();
          
          // Also tell open clients to refresh their UI
          const allClients = await clients.matchAll();
          for (const client of allClients) {
            client.postMessage({ type: 'WATER_LOGGED_FROM_SW' });
          }
        } catch (err) {
          console.error('SW fetch error:', err);
        }
      })()
    );
  }
});
