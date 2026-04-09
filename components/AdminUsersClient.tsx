'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CalendarView from './CalendarView'
import TodoList from './TodoList'

interface AdminUsersClientProps {
  user: User
}

export default function AdminUsersClient({ user }: AdminUsersClientProps) {
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; hasData: boolean }[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [view, setView] = useState<'calendar' | 'todo'>('calendar')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAllUsers()
  }, [])

  const loadAllUsers = async () => {
    try {
      setLoading(true)
      console.log('[Admin] Loading all users...')

      // Get users from all data tables
      const [eventsResult, todosResult, colorsResult, categoriesResult] = await Promise.all([
        supabase.from('calendar_events').select('user_id'),
        supabase.from('todos').select('user_id'),
        supabase.from('colors').select('user_id'),
        supabase.from('categories').select('user_id'),
      ])

      if (eventsResult.error) {
        console.error('[Admin] Error loading events:', eventsResult.error)
      }
      if (todosResult.error) {
        console.error('[Admin] Error loading todos:', todosResult.error)
      }

      const userIds = new Set<string>()

      eventsResult.data?.forEach((e) => { if (e.user_id) userIds.add(e.user_id) })
      todosResult.data?.forEach((t) => { if (t.user_id) userIds.add(t.user_id) })
      colorsResult.data?.forEach((c) => { if (c.user_id) userIds.add(c.user_id) })
      categoriesResult.data?.forEach((c) => { if (c.user_id) userIds.add(c.user_id) })

      // Try to fetch all users from admin API
      let emailMap: Record<string, string> = {}
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          if (data.users && Array.isArray(data.users)) {
            data.users.forEach((u: { id: string; email?: string }) => {
              if (u.id) userIds.add(u.id)
              if (u.id && u.email) emailMap[u.id] = u.email
            })
          }
        }
      } catch {
        console.log('[Admin] Admin API not available, using data tables only')
      }

      console.log('[Admin] Found user IDs:', Array.from(userIds))

      // Create user list with data check
      const users: { id: string; email: string; hasData: boolean }[] = Array.from(userIds).map((userId) => {
        const hasEvents = eventsResult.data?.some((e) => e.user_id === userId) || false
        const hasTodos = todosResult.data?.some((t) => t.user_id === userId) || false

        return {
          id: userId,
          email: userId === user.id
            ? user.email || 'No email'
            : emailMap[userId] || `User-${userId.substring(0, 8)}`,
          hasData: hasEvents || hasTodos,
        }
      })

      console.log('[Admin] All users:', users)
      setAllUsers(users.sort((a, b) => a.email.localeCompare(b.email)))
      setLoading(false)
    } catch (error) {
      console.error('[Admin] Error loading users:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const selectedUser = allUsers.find((u) => u.id === selectedUserId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                管理者 - ユーザー管理
              </h1>
              <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded">
                管理者
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                ダッシュボードに戻る
              </button>
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* User List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ユーザー一覧
              </h2>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  読み込み中...
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ユーザーが見つかりません
                </div>
              ) : (
                <div className="space-y-2">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedUserId === u.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            selectedUserId === u.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {u.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            ID: {u.id.substring(0, 8)}...
                          </p>
                        </div>
                        {u.hasData && (
                          <div className="ml-2 h-2 w-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedUserId ? (
              <>
                {/* User Info Banner */}
                <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedUser?.email || '不明なユーザー'} の予定を表示中
                  </p>
                </div>

                {/* View Tabs */}
                <div className="mb-6 flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setView('calendar')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      view === 'calendar'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    カレンダー
                  </button>
                  <button
                    onClick={() => setView('todo')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      view === 'todo'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Todoリスト
                  </button>
                </div>

                {/* Content */}
                {view === 'calendar' ? (
                  <CalendarView userId={selectedUserId} />
                ) : (
                  <TodoList userId={selectedUserId} />
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  ユーザーを選択してください
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  左側のユーザー一覧から確認したいユーザーを選択してください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
