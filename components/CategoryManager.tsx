'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type Category = Database['public']['Tables']['categories']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface CategoryManagerProps {
  categories: Category[]
  onClose: () => void
  onUpdate: () => void
}

export default function CategoryManager({ categories, onClose, onUpdate }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColorId, setNewCategoryColorId] = useState<string>('')
  const [colors, setColors] = useState<Color[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadColors()
  }, [])

  const loadColors = async () => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setColors(data)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('ユーザーが見つかりません')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: user.id,
          name: newCategoryName,
          color_id: newCategoryColorId || null,
        },
      ])

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setNewCategoryName('')
      setNewCategoryColorId('')
      setLoading(false)
      onUpdate()
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('このカテゴリを削除しますか? このカテゴリを使用しているTodoからカテゴリ設定が削除されます。')) {
      return
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      setError(error.message)
    } else {
      onUpdate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">カテゴリ管理</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Add new category form */}
          <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新しいカテゴリを追加</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ名 *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 仕事"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カラー
                </label>
                <select
                  value={newCategoryColorId}
                  onChange={(e) => setNewCategoryColorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">カラーなし</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {colors.length === 0 && (
              <p className="text-sm text-gray-600 mb-4">
                カラーを使用するには、まずカレンダー画面でカラーを作成してください。
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '追加中...' : 'カテゴリを追加'}
            </button>
          </form>

          {/* Existing categories */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">登録済みカテゴリ</h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                カテゴリが登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => {
                  const categoryColor = (category as any).colors

                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {categoryColor && (
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: categoryColor.hex_code }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {categoryColor && (
                            <p className="text-sm text-gray-500">{categoryColor.name}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
