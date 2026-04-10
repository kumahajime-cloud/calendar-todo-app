'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type Color = Database['public']['Tables']['colors']['Row']

interface ColorManagerProps {
  colors: Color[]
  onClose: () => void
  onUpdate: () => void
}

const PRESET_COLORS = [
  { name: '赤', hex: '#ef4444' },
  { name: '青', hex: '#3b82f6' },
  { name: '緑', hex: '#10b981' },
  { name: '黄', hex: '#eab308' },
  { name: '紫', hex: '#a855f7' },
  { name: 'ピンク', hex: '#ec4899' },
  { name: 'オレンジ', hex: '#f97316' },
  { name: '水色', hex: '#06b6d4' },
]

export default function ColorManager({ colors, onClose, onUpdate }: ColorManagerProps) {
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleAddColor = async (e: React.FormEvent) => {
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
      .from('colors')
      .insert([
        {
          user_id: user.id,
          name: newColorName,
          hex_code: newColorHex,
        },
      ])

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setNewColorName('')
      setNewColorHex('#3b82f6')
      setLoading(false)
      onUpdate()
    }
  }

  const handleDeleteColor = async (colorId: string) => {
    if (!confirm('このカラーを削除しますか? このカラーを使用している予定からカラー設定が削除されます。')) {
      return
    }

    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('id', colorId)

    if (error) {
      setError(error.message)
    } else {
      onUpdate()
    }
  }

  const handlePresetClick = (preset: typeof PRESET_COLORS[0]) => {
    setNewColorName(preset.name)
    setNewColorHex(preset.hex)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">カラー管理</h2>
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

          {/* Add new color form */}
          <form onSubmit={handleAddColor} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新しいカラーを追加</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カラー名 *
                </label>
                <input
                  type="text"
                  required
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 仕事"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カラーコード *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    required
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>

            {/* Preset colors */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プリセットから選択:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className="px-3 py-1 rounded-md text-sm font-medium text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '追加中...' : 'カラーを追加'}
            </button>
          </form>

          {/* Existing colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">登録済みカラー</h3>
            {colors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                カラーが登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{color.name}</p>
                        <p className="text-sm text-gray-500">{color.hex_code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteColor(color.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
