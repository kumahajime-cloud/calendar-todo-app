'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import TodoModal from './TodoModal'
import CategoryManager from './CategoryManager'
import { Database } from '@/lib/types/database.types'

type Todo = Database['public']['Tables']['todos']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface TodoListProps {
  userId: string
}

export default function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTodos()
    loadCategories()
  }, [userId])

  const loadTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTodos(data)
    }
  }

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, colors(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setCategories(data as any)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadTodos(), loadCategories()])
    setIsRefreshing(false)
  }

  const handleToggleComplete = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', todo.id)

    if (!error) {
      loadTodos()
    }
  }

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setIsTodoModalOpen(true)
  }

  const handleTodoSave = async () => {
    await loadTodos()
    setIsTodoModalOpen(false)
    setSelectedTodo(null)
  }

  const handleCategoriesUpdate = async () => {
    await loadCategories()
    await loadTodos()
  }

  const getFilteredTodos = () => {
    let filtered = todos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((todo) => todo.category_id === selectedCategory)
    }

    if (!showCompleted) {
      filtered = filtered.filter((todo) => !todo.is_completed)
    }

    return filtered
  }

  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null
    return categories.find((c) => c.id === categoryId)
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return ''
    }
  }

  const groupTodosByDeadline = (todos: Todo[]) => {
    const groups: { label: string; sortKey: number; todos: Todo[] }[] = []
    const noDeadline: Todo[] = []
    const dateMap = new Map<string, Todo[]>()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    for (const todo of todos) {
      if (!todo.deadline) {
        noDeadline.push(todo)
        continue
      }

      const deadlineDate = new Date(todo.deadline)
      const dateKey = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, [])
      }
      dateMap.get(dateKey)!.push(todo)
    }

    const sortedDates = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b))

    for (const [dateKey, dateTodos] of sortedDates) {
      const d = new Date(dateKey + 'T00:00:00')
      const sortKey = d.getTime()

      let label: string
      if (d.getTime() < today.getTime()) {
        label = `期限切れ - ${d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}`
      } else if (d.getTime() === today.getTime()) {
        label = '今日が締切'
      } else if (d.getTime() === tomorrow.getTime()) {
        label = '明日が締切'
      } else {
        label = d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
      }

      groups.push({ label, sortKey, todos: dateTodos })
    }

    if (noDeadline.length > 0) {
      groups.push({ label: '締切なし', sortKey: Infinity, todos: noDeadline })
    }

    return groups
  }

  const filteredTodos = getFilteredTodos()
  const completedCount = todos.filter((t) => t.is_completed).length
  const totalCount = todos.length
  const todoGroups = useMemo(() => groupTodosByDeadline(filteredTodos), [filteredTodos])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">全タスク</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">完了</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">未完了</p>
          <p className="text-2xl font-bold text-blue-600">{totalCount - completedCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                showCompleted
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600'
              }`}
            >
              {showCompleted ? '完了済みを表示中' : '完了済みを非表示中'}
            </button>
          </div>

          <div className="flex gap-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              title="データを更新"
            >
              <svg
                className={`w-5 h-5 inline-block mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              更新
            </button>

            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              カテゴリ管理
            </button>
            <button
              onClick={() => {
                setSelectedTodo(null)
                setIsTodoModalOpen(true)
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Todo追加
            </button>
          </div>
        </div>
      </div>

      {/* Todo List grouped by deadline */}
      {filteredTodos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          {showCompleted ? 'Todoがありません' : '未完了のTodoがありません'}
        </div>
      ) : (
        <div className="space-y-4">
          {todoGroups.map((group) => {
            const isOverdueGroup = group.label.startsWith('期限切れ')
            const isTodayGroup = group.label === '今日が締切'

            return (
              <div key={group.label} className="bg-white rounded-lg shadow overflow-hidden">
                <div className={`px-4 py-2 border-b ${
                  isOverdueGroup ? 'bg-red-50 border-red-200' :
                  isTodayGroup ? 'bg-orange-50 border-orange-200' :
                  group.label === '締切なし' ? 'bg-gray-50 border-gray-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <h3 className={`text-sm font-bold ${
                    isOverdueGroup ? 'text-red-700' :
                    isTodayGroup ? 'text-orange-700' :
                    group.label === '締切なし' ? 'text-gray-600' :
                    'text-blue-700'
                  }`}>
                    {group.label}
                    <span className="ml-2 font-normal text-xs">({group.todos.length}件)</span>
                  </h3>
                </div>

                <div className="divide-y divide-gray-200">
                  {group.todos.map((todo) => {
                    const category = getCategoryById(todo.category_id)
                    const overdue = isOverdue(todo.deadline)

                    return (
                      <div
                        key={todo.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          todo.is_completed ? 'opacity-60' : ''
                        }`}
                        onClick={() => handleTodoClick(todo)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={todo.is_completed}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleToggleComplete(todo)
                            }}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className={`text-base font-medium ${
                                  todo.is_completed
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-900'
                                }`}
                              >
                                {todo.title}
                              </h3>
                              <span className={`text-sm font-medium ${getPriorityColor(todo.priority)}`}>
                                優先度: {getPriorityLabel(todo.priority)}
                              </span>
                            </div>

                            {todo.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {todo.description}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {category && (
                                <span
                                  className="px-2 py-1 text-xs rounded"
                                  style={{
                                    backgroundColor: (category as any).colors?.hex_code
                                      ? (category as any).colors.hex_code + '20'
                                      : '#e5e7eb',
                                    color: (category as any).colors?.hex_code || '#6b7280',
                                  }}
                                >
                                  {category.name}
                                </span>
                              )}

                              {todo.deadline && (
                                <span
                                  className={`text-xs ${
                                    overdue && !todo.is_completed
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-600'
                                  }`}
                                >
                                  {new Date(todo.deadline).toLocaleTimeString('ja-JP', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Todo Modal */}
      {isTodoModalOpen && (
        <TodoModal
          todo={selectedTodo}
          categories={categories}
          onClose={() => {
            setIsTodoModalOpen(false)
            setSelectedTodo(null)
          }}
          onSave={handleTodoSave}
        />
      )}

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && (
        <CategoryManager
          categories={categories}
          onClose={() => setIsCategoryManagerOpen(false)}
          onUpdate={handleCategoriesUpdate}
        />
      )}
    </div>
  )
}
