'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NotificationSettings from './NotificationSettings'
import ProfileEditModal from './ProfileEditModal'
import PasswordChangeModal from './PasswordChangeModal'

interface SettingsViewProps {
  user: User
}

const ADMIN_EMAIL = 'hajimeazb@gmail.com'

export default function SettingsView({ user }: SettingsViewProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = user.email === ADMIN_EMAIL

  const handleProfileUpdate = async () => {
    // Refresh user data
    const { data: { user: updatedUser } } = await supabase.auth.getUser()
    if (updatedUser) {
      setCurrentUser(updatedUser)
    }
    router.refresh()
  }

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
  }

  const handleDeleteAccount = () => {
    if (
      confirm(
        'アカウントを削除すると、すべてのデータが失われます。本当に削除しますか？'
      )
    ) {
      alert('アカウント削除機能は現在開発中です')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">設定</h2>

      <div className="space-y-6">
        {/* アカウント */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            アカウント
          </h3>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {currentUser.user_metadata?.avatar_url ? (
                <img
                  src={currentUser.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.email?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {currentUser.user_metadata?.username || currentUser.email}
              </p>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
              <p className="text-sm text-gray-500">
                ID: {currentUser.id.slice(0, 8)}...
              </p>
              {isAdmin && (
                <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded">
                  管理者
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full mb-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
          >
            プロフィール編集
          </button>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
          >
            パスワード変更
          </button>
        </div>

        {/* 通知設定 */}
        <NotificationSettings />

        {/* 表示 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">表示</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">ダークモード</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkModeEnabled}
                onChange={(e) => setDarkModeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <button
            onClick={() => alert('言語設定機能は現在開発中です')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
          >
            <span>言語設定</span>
            <span className="text-gray-500">日本語</span>
          </button>
        </div>

        {/* データ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">データ</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">自動同期</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <button
            onClick={() => alert('キャッシュクリア機能は現在開発中です')}
            className="w-full mb-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
          >
            キャッシュクリア
          </button>
          <button
            onClick={() => alert('データエクスポート機能は現在開発中です')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
          >
            データエクスポート
          </button>
        </div>

        {/* 管理者専用 */}
        {isAdmin && (
          <div className="bg-purple-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">
              管理者機能
            </h3>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full px-4 py-2 text-left text-purple-700 hover:bg-purple-100 rounded font-medium"
            >
              ユーザー管理
            </button>
          </div>
        )}

        {/* アプリについて */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            アプリについて
          </h3>
          <button
            onClick={() => alert('利用規約は現在作成中です')}
            className="w-full mb-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
          >
            利用規約
          </button>
          <button
            onClick={() => alert('プライバシーポリシーは現在作成中です')}
            className="w-full mb-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
          >
            プライバシーポリシー
          </button>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-gray-700">バージョン</span>
            <span className="text-gray-500">1.0.0</span>
          </div>
        </div>

        {/* 危険な操作 */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleLogout}
            className="w-full mb-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded font-medium"
          >
            ログアウト
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded font-medium"
          >
            アカウント削除
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 py-4">
          <p>Keio Calendar v1.0.0</p>
          <p>© 2026 All rights reserved</p>
        </div>
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUpdate={handleProfileUpdate}
      />
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  )
}
