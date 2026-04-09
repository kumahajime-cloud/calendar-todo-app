'use client'

import { useState, useEffect } from 'react'
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
  const [showCompleted, setShowCompleted] = useState(true)
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
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
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return ''
    }
  }

  const filteredTodos = getFilteredTodos()
  const completedCount = todos.filter((t) => t.is_completed).length
  const totalCount = todos.length

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

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              完了済みを表示
            </label>
          </div>

          <div className="flex gap-2">
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

      {/* Todo List */}
      <div className="bg-white rounded-lg shadow">
        {filteredTodos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Todoがありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTodos.map((todo) => {
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
                            締切:{' '}
                            {new Date(todo.deadline).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
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
        )}
      </div>

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
