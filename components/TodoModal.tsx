'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type Todo = Database['public']['Tables']['todos']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface TodoModalProps {
  todo: Todo | null
  categories: Category[]
  onClose: () => void
  onSave: () => void
}

export default function TodoModal({ todo, categories, onClose, onSave }: TodoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [deadline, setDeadline] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setCategoryId(todo.category_id || '')
      if (todo.deadline) {
        const deadlineDate = new Date(todo.deadline)
        setDeadline(deadlineDate.toISOString().split('T')[0])
        setDeadlineTime(deadlineDate.toTimeString().slice(0, 5))
      } else {
        setDeadline('')
        setDeadlineTime('')
      }
      setPriority(todo.priority as 'low' | 'medium' | 'high')
      setIsCompleted(todo.is_completed)
    }
  }, [todo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let deadlineDateTime = null
    if (deadline) {
      const timeToUse = deadlineTime || '23:59'
      deadlineDateTime = new Date(`${deadline}T${timeToUse}`).toISOString()
    }

    const todoData = {
      title,
      description: description || null,
      category_id: categoryId || null,
      deadline: deadlineDateTime,
      priority,
      is_completed: isCompleted,
    }

    if (todo) {
      // Update existing todo
      const { error } = await supabase
        .from('todos')
        .update(todoData)
        .eq('id', todo.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        onSave()
      }
    } else {
      // Create new todo
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ユーザーが見つかりません')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('todos')
        .insert([{ ...todoData, user_id: user.id }])

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        onSave()
      }
    }
  }

  const handleDelete = async () => {
    if (!todo || !confirm('このTodoを削除しますか?')) return

    setLoading(true)
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todo.id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {todo ? 'Todoを編集' : 'Todoを追加'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">カテゴリなし</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                締切日時
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="日付"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="時間"
                />
              </div>
              {deadline && !deadlineTime && (
                <p className="text-xs text-gray-500 mt-1">
                  時間未設定の場合、23:59に設定されます
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'low', label: '低', color: 'bg-green-100 text-green-700' },
                  { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-700' },
                  { value: 'high', label: '高', color: 'bg-red-100 text-red-700' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value as 'low' | 'medium' | 'high')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      priority === p.value
                        ? p.color + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {todo && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCompleted"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isCompleted" className="ml-2 text-sm text-gray-700">
                  完了済み
                </label>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div>
                {todo && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
