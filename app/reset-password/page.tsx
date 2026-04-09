'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has access token from reset email
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({
          type: 'error',
          text: 'パスワードリセットのリンクが無効です。もう一度リセットメールを送信してください。'
        })
      }
    }
    checkSession()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (newPassword.length < 6) {
        throw new Error('パスワードは6文字以上で入力してください')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('パスワードが一致しません')
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      setMessage({
        type: 'success',
        text: 'パスワードを変更しました。ログイン画面に移動します...'
      })

      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error: any) {
      console.error('Password update error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'パスワード変更に失敗しました'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいパスワードを設定</h1>
          <p className="text-gray-600">
            新しいパスワードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] pr-20"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              >
                {showPassword ? '非表示' : '表示'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">6文字以上で入力してください</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認）
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] pr-20"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              >
                {showConfirmPassword ? '非表示' : '表示'}
              </button>
            </div>
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
            {loading ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>
      </div>
    </div>
  )
}
