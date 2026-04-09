// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)

  const data = event.data ? event.data.json() : {}
  const title = data.title || 'ベアカレンダー'
  const options = {
    body: data.body || '通知があります',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification)
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})

// Handle background sync (for scheduling notifications)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)

  if (event.tag === 'check-notifications') {
    event.waitUntil(checkAndSendNotifications())
  }
})

async function checkAndSendNotifications() {
  try {
    // Check for upcoming events and send notifications
    const response = await fetch('/api/notifications/check')
    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      for (const notification of data.notifications) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: notification.tag,
          data: notification.data,
        })
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error)
  }
}
