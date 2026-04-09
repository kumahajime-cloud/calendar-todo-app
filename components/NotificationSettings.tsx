'use client'

import { useState, useEffect } from 'react'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notificationTime, setNotificationTime] = useState('30') // minutes before event
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check if service worker is registered and push subscription exists
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setMessage({ type: 'error', text: 'このブラウザは通知をサポートしていません' })
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        setMessage({ type: 'success', text: '通知が許可されました！' })
        await registerServiceWorker()
      } else if (result === 'denied') {
        setMessage({ type: 'error', text: '通知が拒否されました。ブラウザの設定から許可してください。' })
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      setMessage({ type: 'error', text: '通知の許可リクエストに失敗しました' })
    }
  }

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)

      // Subscribe to push notifications
      await subscribeToPush(registration)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      setMessage({ type: 'error', text: 'Service Workerの登録に失敗しました' })
    }
  }

  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
    setLoading(true)
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      })

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          notificationTime: parseInt(notificationTime)
        }),
      })

      setIsSubscribed(true)
      setMessage({ type: 'success', text: 'プッシュ通知を有効にしました' })
    } catch (error) {
      console.error('Push subscription failed:', error)
      setMessage({ type: 'error', text: 'プッシュ通知の登録に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Remove subscription from server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        setIsSubscribed(false)
        setMessage({ type: 'success', text: 'プッシュ通知を無効にしました' })
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error)
      setMessage({ type: 'error', text: '通知の無効化に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      setMessage({ type: 'error', text: '先に通知を許可してください' })
      return
    }

    try {
      new Notification('ベアカレンダー - テスト通知', {
        body: 'これはテスト通知です。通知設定が正しく動作しています！',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
      setMessage({ type: 'success', text: 'テスト通知を送信しました' })
    } catch (error) {
      console.error('Test notification failed:', error)
      setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">通知設定</h2>

      <div className="space-y-6">
        {/* Permission Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">通知の許可状態</h3>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              permission === 'granted'
                ? 'bg-green-100 text-green-800'
                : permission === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {permission === 'granted' ? '✓ 許可済み' : permission === 'denied' ? '✗ 拒否済み' : '未設定'}
            </span>
          </div>
        </div>

        {/* Request Permission Button */}
        {permission !== 'granted' && (
          <div>
            <button
              onClick={requestPermission}
              className="w-full px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#1e40af] transition-colors"
            >
              通知を許可する
            </button>
            <p className="mt-2 text-xs text-gray-500">
              予定の通知を受け取るには、ブラウザの通知を許可してください
            </p>
          </div>
        )}

        {/* Notification Time */}
        {permission === 'granted' && (
          <>
            <div>
              <label htmlFor="notification-time" className="block text-sm font-medium text-gray-700 mb-2">
                通知タイミング
              </label>
              <select
                id="notification-time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              >
                <option value="5">5分前</option>
                <option value="10">10分前</option>
                <option value="15">15分前</option>
                <option value="30">30分前</option>
                <option value="60">1時間前</option>
                <option value="1440">1日前</option>
              </select>
            </div>

            {/* Push Notification Toggle */}
            <div>
              <label className="flex items-center justify-between p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">プッシュ通知</div>
                  <div className="text-sm text-gray-500">
                    アプリを開いていない時でも通知を受け取る
                  </div>
                </div>
                <button
                  onClick={isSubscribed ? unsubscribeFromPush : () => registerServiceWorker()}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isSubscribed
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {loading ? '処理中...' : isSubscribed ? 'ON' : 'OFF'}
                </button>
              </label>
            </div>

            {/* Test Notification */}
            <div>
              <button
                onClick={sendTestNotification}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                テスト通知を送信
              </button>
            </div>
          </>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
          <h3 className="font-medium mb-2">ℹ️ 通知について</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>予定やTodoの時間になると通知が届きます</li>
            <li>PWAとしてホーム画面に追加すると、より確実に通知が届きます</li>
            <li>iOSの場合、ホーム画面に追加した後に通知設定をしてください</li>
            <li>通知は設定した時間前に送信されます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as BufferSource
}
