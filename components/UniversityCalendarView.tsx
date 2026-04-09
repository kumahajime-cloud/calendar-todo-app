'use client'

import { useState } from 'react'

interface AcademicEvent {
  id: string
  title: string
  date: string
  endDate?: string
  category: 'semester' | 'exam' | 'holiday' | 'event'
  description?: string
  campus: string[]
}

const keioEvents2026: AcademicEvent[] = [
  // 春学期 2026
  {
    id: 'spring-entrance',
    title: '入学式',
    date: '2026-04-01',
    category: 'event',
    description: '2026年度入学式',
    campus: ['all'],
  },
  {
    id: 'spring-guidance',
    title: 'ガイダンス',
    date: '2026-03-25',
    endDate: '2026-04-07',
    category: 'event',
    description: '新学期ガイダンス期間',
    campus: ['all'],
  },
  {
    id: 'spring-classes-start',
    title: '春学期授業開始',
    date: '2026-04-08',
    category: 'semester',
    description: '2026年度春学期授業開始',
    campus: ['all'],
  },
  {
    id: 'spring-health-checkup',
    title: '健康診断',
    date: '2026-04-04',
    endDate: '2026-04-09',
    category: 'event',
    description: '学生健康診断',
    campus: ['hiyoshi'],
  },
  {
    id: 'spring-showa-day',
    title: '昭和の日（授業実施）',
    date: '2026-04-29',
    category: 'holiday',
    description: '祝日ですが授業が行われます',
    campus: ['all'],
  },
  {
    id: 'spring-midterm',
    title: '春学期中間試験',
    date: '2026-06-04',
    endDate: '2026-06-05',
    category: 'exam',
    description: '春学期中間試験・補講期間',
    campus: ['all'],
  },
  {
    id: 'spring-marine-day',
    title: '海の日（授業実施）',
    date: '2026-07-20',
    category: 'holiday',
    description: '祝日ですが授業が行われます',
    campus: ['all'],
  },
  {
    id: 'spring-final',
    title: '春学期期末試験',
    date: '2026-07-22',
    endDate: '2026-07-29',
    category: 'exam',
    description: '春学期期末試験期間',
    campus: ['all'],
  },
  {
    id: 'summer-break',
    title: '夏季休業',
    date: '2026-07-30',
    endDate: '2026-09-21',
    category: 'holiday',
    description: '夏季休業期間',
    campus: ['all'],
  },
  {
    id: 'summer-makeup',
    title: '夏季追試',
    date: '2026-08-05',
    endDate: '2026-08-07',
    category: 'exam',
    description: '夏季追試験期間',
    campus: ['all'],
  },
  {
    id: 'spring-graduation',
    title: '卒業式（9月）',
    date: '2026-09-18',
    category: 'event',
    description: '2026年9月卒業式',
    campus: ['all'],
  },
  // 秋学期 2026
  {
    id: 'fall-entrance',
    title: '入学式（秋）',
    date: '2026-09-24',
    category: 'event',
    description: '秋学期入学式',
    campus: ['all'],
  },
  {
    id: 'fall-classes-start',
    title: '秋学期授業開始',
    date: '2026-10-01',
    category: 'semester',
    description: '2026年度秋学期授業開始',
    campus: ['all'],
  },
  {
    id: 'fall-sports-day',
    title: '体育の日（授業実施）',
    date: '2026-10-12',
    category: 'holiday',
    description: '祝日ですが授業が行われます',
    campus: ['all'],
  },
  {
    id: 'fall-culture-day',
    title: '文化の日（授業実施）',
    date: '2026-11-03',
    category: 'holiday',
    description: '祝日ですが授業が行われます',
    campus: ['all'],
  },
  {
    id: 'fall-midterm-1',
    title: '秋学期中間試験',
    date: '2026-11-18',
    category: 'exam',
    description: '秋学期中間試験日',
    campus: ['all'],
  },
  {
    id: 'mita-festival',
    title: '三田祭',
    date: '2026-11-18',
    endDate: '2026-11-24',
    category: 'event',
    description: '三田祭期間（午後休講）',
    campus: ['mita'],
  },
  {
    id: 'fall-midterm-2',
    title: '秋学期中間試験・補講',
    date: '2026-11-26',
    category: 'exam',
    description: '秋学期中間試験・補講日',
    campus: ['all'],
  },
  {
    id: 'winter-break',
    title: '冬季休業',
    date: '2026-12-28',
    endDate: '2027-01-04',
    category: 'holiday',
    description: '冬季休業期間',
    campus: ['all'],
  },
  {
    id: 'fall-final',
    title: '秋学期期末試験',
    date: '2027-01-26',
    endDate: '2027-02-05',
    category: 'exam',
    description: '秋学期期末試験期間',
    campus: ['all'],
  },
  {
    id: 'entrance-exam',
    title: '入学試験',
    date: '2027-02-15',
    endDate: '2027-02-20',
    category: 'exam',
    description: '入学試験期間（概算）',
    campus: ['all'],
  },
  {
    id: 'fall-graduation',
    title: '卒業式',
    date: '2027-03-23',
    category: 'event',
    description: '2026年度卒業式',
    campus: ['all'],
  },
]

const campuses = [
  { id: 'all', label: 'すべて', icon: '🏫' },
  { id: 'mita', label: '三田', icon: '🏛️' },
  { id: 'hiyoshi', label: '日吉', icon: '🌸' },
  { id: 'yagami', label: '矢上', icon: '⚙️' },
  { id: 'sfc', label: 'SFC', icon: '🌳' },
]

const categories = [
  { id: 'all', label: 'すべて', color: '#6b7280' },
  { id: 'semester', label: '学期', color: '#1e3a8a' },
  { id: 'exam', label: '試験', color: '#dc2626' },
  { id: 'holiday', label: '休業', color: '#16a34a' },
  { id: 'event', label: 'イベント', color: '#9333ea' },
]

export default function UniversityCalendarView() {
  const [selectedCampus, setSelectedCampus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.id === category)
    return cat?.color || '#6b7280'
  }

  const filteredEvents = keioEvents2026.filter((event) => {
    const campusMatch =
      selectedCampus === 'all' ||
      event.campus.includes('all') ||
      event.campus.includes(selectedCampus)
    const categoryMatch =
      selectedCategory === 'all' || event.category === selectedCategory
    return campusMatch && categoryMatch
  })

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const startStr = start.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })

    if (endDate) {
      const end = new Date(endDate)
      const endStr = end.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      })
      return `${startStr} - ${endStr}`
    }

    return startStr
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          慶應義塾大学 学事日程
        </h2>
        <p className="text-gray-600">2026年度（春学期・秋学期）</p>
      </div>

      {/* Campus Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">キャンパス</h3>
        <div className="flex flex-wrap gap-2">
          {campuses.map((campus) => (
            <button
              key={campus.id}
              onClick={() => setSelectedCampus(campus.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCampus === campus.id
                  ? 'bg-[#1e3a8a] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {campus.icon} {campus.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">カテゴリー</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor:
                  selectedCategory === cat.id ? cat.color : undefined,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            選択した条件に該当するイベントがありません
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow overflow-hidden flex"
            >
              <div
                className="w-2"
                style={{ backgroundColor: getCategoryColor(event.category) }}
              />
              <div className="flex-1 p-4">
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: getCategoryColor(event.category) }}
                >
                  {formatDateRange(event.date, event.endDate)}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-gray-600 text-sm">{event.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
