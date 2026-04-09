'use client'

import { useState } from 'react'

export function KLMSSettings() {
  const [calendarUrl, setCalendarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const handleSync = async () => {
    if (!calendarUrl.trim()) {
      setMessage({ type: 'error', text: 'カレンダーURLを入力してください' })
      return
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

      setMessage({
        type: 'success',
        text: `同期完了！ 追加: ${data.results.added}件、スキップ: ${data.results.skipped}件（全${data.results.total}件）`
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">KLMS連携設定</h2>

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
        </div>

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
  )
}
