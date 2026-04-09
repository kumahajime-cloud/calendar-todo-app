'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!email) {
        throw new Error('メールアドレスを入力してください')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setMessage({
        type: 'success',
        text: 'パスワードリセット用のメールを送信しました。メールをご確認ください。'
      })
      setEmail('')

    } catch (error: any) {
      console.error('Password reset error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'メール送信に失敗しました'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block w-16 h-16 bg-[#1e3a8a] rounded-lg flex items-center justify-center mb-4">
            <span className="text-3xl">🐻</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">パスワードを忘れた方</h1>
          <p className="text-gray-600">
            登録したメールアドレスを入力してください。
            <br />
            パスワードリセット用のリンクをお送りします。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              required
            />
          </div>

          {message && (
            <div
              className={`p-4 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '送信中...' : 'リセットメールを送信'}
          </button>

          <div className="text-center space-y-2">
            <Link
              href="/login"
              className="block text-sm text-[#1e3a8a] hover:underline"
            >
              ← ログイン画面に戻る
            </Link>
            <Link
              href="/signup"
              className="block text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              アカウントをお持ちでない方はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
