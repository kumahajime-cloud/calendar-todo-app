'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY_URL = 'klms_calendar_url'
const STORAGE_KEY_SAVE = 'klms_save_url'
const STORAGE_KEY_LAST_SYNC = 'klms_last_sync'

interface KLMSSettingsProps {
  userId?: string
}

export function KLMSSettings({ userId }: KLMSSettingsProps) {
  const [calendarUrl, setCalendarUrl] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [saveUrl, setSaveUrl] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [lastApiSync, setLastApiSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [apiMessage, setApiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // localStorageから保存済みの値を読み込み
  useEffect(() => {
    const savedSave = localStorage.getItem(STORAGE_KEY_SAVE)
    const shouldSave = savedSave !== 'false'
    setSaveUrl(shouldSave)

    if (shouldSave) {
      const savedUrl = localStorage.getItem(STORAGE_KEY_URL)
      if (savedUrl) setCalendarUrl(savedUrl)
    }

    const savedLastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC)
    if (savedLastSync) setLastSync(savedLastSync)

    // APIトークンと最終同期時刻を読み込み
    const tokenKey = userId ? `klms_api_token_${userId}` : 'klms_api_token'
    const savedToken = localStorage.getItem(tokenKey)
    if (savedToken) setApiToken(savedToken)

    const savedApiSync = localStorage.getItem('klms_last_api_sync')
    if (savedApiSync) setLastApiSync(savedApiSync)
  }, [])

  // URL保存設定の変更時
  const handleSaveUrlChange = (checked: boolean) => {
    setSaveUrl(checked)
    localStorage.setItem(STORAGE_KEY_SAVE, String(checked))
    if (checked) {
      localStorage.setItem(STORAGE_KEY_URL, calendarUrl)
    } else {
      localStorage.removeItem(STORAGE_KEY_URL)
    }
  }

  const handleSync = async () => {
    if (!calendarUrl.trim()) {
      setMessage({ type: 'error', text: 'カレンダーURLを入力してください' })
      return
    }

    // URL保存が有効ならlocalStorageに保存
    if (saveUrl) {
      localStorage.setItem(STORAGE_KEY_URL, calendarUrl)
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/klms/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendarUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '同期に失敗しました')
      }

      const now = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, now)
      setLastSync(now)

      setMessage({
        type: 'success',
        text: `同期完了！ イベント追加: ${data.results.added}件、スキップ: ${data.results.skipped}件、TODO追加: ${data.results.todos_added}件（全${data.results.total}件）`
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `エラー: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApiSync = async () => {
    if (!apiToken.trim()) {
      setApiMessage({ type: 'error', text: 'APIトークンを入力してください' })
      return
    }

    setApiLoading(true)
    setApiMessage(null)

    try {
      const res = await fetch('/api/klms/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken: apiToken.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Save token and sync time
      const tokenKey = userId ? `klms_api_token_${userId}` : 'klms_api_token'
      localStorage.setItem(tokenKey, apiToken.trim())
      const now = new Date().toISOString()
      localStorage.setItem('klms_last_api_sync', now)
      setLastApiSync(now)

      setApiMessage({
        type: 'success',
        text: `同期完了！ ${data.results.courses}コースから課題を取得\nTodo追加: ${data.results.todos_added}件、予定追加: ${data.results.events_added}件、スキップ: ${data.results.skipped}件（全${data.results.total}件）`
      })
    } catch (error: any) {
      setApiMessage({ type: 'error', text: error.message })
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Canvas API 同期（推奨） */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">課題の自動取得</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">推奨</span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Canvas APIを使って全コースの課題を正確な締切時刻付きで取得します。Todoリストとカレンダーの両方に自動追加されます。
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              K-LMS APIトークン
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="APIトークンを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-medium text-blue-900 mb-2">🔑 APIトークンの取得方法</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>K-LMS (lms.keio.jp) にログイン</li>
              <li>左メニュー「アカウント」→「設定」</li>
              <li>「新しいアクセストークンの生成」をクリック</li>
              <li>用途に「ベアカレンダー」等を入力して「トークンを生成」</li>
              <li>表示されたトークンをコピーして上に貼り付け</li>
            </ol>
          </div>

          {lastApiSync && (
            <div className="text-sm text-gray-500">
              最終同期: {new Date(lastApiSync).toLocaleString('ja-JP')}
            </div>
          )}

          <button
            onClick={handleApiSync}
            disabled={apiLoading}
            className="w-full px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#1e3a8a]/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {apiLoading ? '取得中...' : 'Canvas APIで課題を同期'}
          </button>

          {apiMessage && (
            <div className={`p-4 rounded-md whitespace-pre-line ${
              apiMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {apiMessage.text}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            ⚠️ APIトークンはブラウザ内にのみ保存され、サーバーには保持されません。
          </div>
        </div>
      </div>

      {/* カレンダーフィード同期（従来方式） */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">カレンダーフィード同期</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded">従来方式</span>
        </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="calendarUrl" className="block text-sm font-medium text-gray-700 mb-2">
            KLMSカレンダーURL
          </label>
          <input
            type="text"
            id="calendarUrl"
            value={calendarUrl}
            onChange={(e) => setCalendarUrl(e.target.value)}
            placeholder="https://lms.keio.jp/feeds/calendars/user_xxxxx.ics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center mt-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={saveUrl}
              onChange={(e) => handleSaveUrlChange(e.target.checked)}
              className="mr-2 rounded border-gray-300"
            />
            URLを保存する
          </label>
        </div>

        {lastSync && (
          <div className="text-sm text-gray-500">
            最終同期: {new Date(lastSync).toLocaleString('ja-JP')}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-900 mb-2">📝 カレンダーURLの取得方法</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>KLMSにログイン</li>
            <li>右上のアカウントメニュー → 「設定」</li>
            <li>左メニューの「カレンダー」をクリック</li>
            <li>「カレンダーフィード」セクションで「カレンダーのエクスポート」をクリック</li>
            <li>表示されたURLをコピーして上記の入力欄に貼り付け</li>
          </ol>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '同期中...' : 'KLMSから課題・イベントを同期'}
        </button>

        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-600">
          <h3 className="font-medium text-gray-900 mb-2">ℹ️ 注意事項</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>カレンダーURLは秘密情報です。他人と共有しないでください</li>
            <li>課題だけでなく、KLMSのカレンダーイベントも取得されます</li>
            <li>重複した課題は自動的にスキップされます</li>
            <li>定期的に同期ボタンを押して最新の課題を取得してください</li>
            <li>同期されたイベントはカレンダータブで確認できます</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  )
}
