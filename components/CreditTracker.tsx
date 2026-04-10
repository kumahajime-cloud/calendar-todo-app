'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface Course {
  id: string
  name: string
  credits: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | '未確定'
  semester: string
}

interface CreditTrackerProps {
  userId: string
}

const GRADE_OPTIONS = ['S', 'A', 'B', 'C', 'D', 'F', '未確定'] as const
const GRADE_POINTS: Record<string, number> = {
  S: 4.0,
  A: 3.0,
  B: 2.0,
  C: 1.0,
  D: 0,
}

const GRADUATION_CREDITS = 124

function getStorageKey(userId: string) {
  return `credits_${userId}`
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function CreditTracker({ userId }: CreditTrackerProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formName, setFormName] = useState('')
  const [formCredits, setFormCredits] = useState(2)
  const [formGrade, setFormGrade] = useState<Course['grade']>('未確定')
  const [formSemester, setFormSemester] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(userId))
    if (stored) {
      try {
        setCourses(JSON.parse(stored))
      } catch {
        setCourses([])
      }
    }
  }, [userId])

  const saveCourses = useCallback(
    (data: Course[]) => {
      setCourses(data)
      localStorage.setItem(getStorageKey(userId), JSON.stringify(data))
    },
    [userId]
  )

  // Compute stats
  const stats = useMemo(() => {
    const graded = courses.filter((c) => c.grade !== '未確定')
    const totalAttempted = graded.reduce((sum, c) => sum + c.credits, 0)
    const earned = graded
      .filter((c) => c.grade !== 'F')
      .reduce((sum, c) => sum + c.credits, 0)

    // GPA: only count graded courses (S/A/B/C/D), F is not earned
    let gpaPoints = 0
    let gpaCredits = 0
    for (const c of graded) {
      if (c.grade in GRADE_POINTS) {
        gpaPoints += GRADE_POINTS[c.grade] * c.credits
        gpaCredits += c.credits
      }
    }
    const gpa = gpaCredits > 0 ? gpaPoints / gpaCredits : 0

    const including未確定 = courses.reduce((sum, c) => sum + c.credits, 0)

    return { totalAttempted, earned, gpa, including未確定 }
  }, [courses])

  // Group by semester
  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>()
    for (const c of courses) {
      const list = map.get(c.semester) || []
      list.push(c)
      map.set(c.semester, list)
    }
    // Sort semesters
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    return entries
  }, [courses])

  const openAddModal = () => {
    setEditingCourse(null)
    setFormName('')
    setFormCredits(2)
    setFormGrade('未確定')
    // Default semester suggestion
    const now = new Date()
    const year = now.getFullYear()
    const season = now.getMonth() < 8 ? '春' : '秋'
    setFormSemester(`${year}${season}`)
    setModalOpen(true)
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormName(course.name)
    setFormCredits(course.credits)
    setFormGrade(course.grade)
    setFormSemester(course.semester)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim() || !formSemester.trim()) return

    if (editingCourse) {
      const updated = courses.map((c) =>
        c.id === editingCourse.id
          ? { ...c, name: formName.trim(), credits: formCredits, grade: formGrade, semester: formSemester.trim() }
          : c
      )
      saveCourses(updated)
    } else {
      const newCourse: Course = {
        id: generateId(),
        name: formName.trim(),
        credits: formCredits,
        grade: formGrade,
        semester: formSemester.trim(),
      }
      saveCourses([...courses, newCourse])
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    if (!editingCourse) return
    saveCourses(courses.filter((c) => c.id !== editingCourse.id))
    setModalOpen(false)
  }

  const progressPercent = Math.min((stats.earned / GRADUATION_CREDITS) * 100, 100)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1e3a8a]">単位管理</h2>
        <button
          onClick={openAddModal}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#1e3a8a] rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
        >
          + 科目追加
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">取得単位</div>
          <div className="text-xl font-bold text-[#1e3a8a]">{stats.earned}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">GPA</div>
          <div className="text-xl font-bold text-[#1e3a8a]">{stats.gpa.toFixed(2)}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">履修中</div>
          <div className="text-xl font-bold text-[#1e3a8a]">
            {stats.including未確定 - stats.totalAttempted}
          </div>
        </div>
      </div>

      {/* Graduation progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>卒業要件 ({GRADUATION_CREDITS}単位)</span>
          <span>
            {stats.earned}/{GRADUATION_CREDITS} ({Math.round(progressPercent)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent >= 100
                  ? '#22c55e'
                  : progressPercent >= 60
                  ? '#1e3a8a'
                  : '#f59e0b',
            }}
          />
        </div>
        {stats.earned < GRADUATION_CREDITS && (
          <div className="text-xs text-gray-500 mt-1">
            あと{GRADUATION_CREDITS - stats.earned}単位
          </div>
        )}
      </div>

      {/* Course list grouped by semester */}
      {grouped.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">
          科目を追加してください
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([semester, semCourses]) => {
            const semEarned = semCourses
              .filter((c) => c.grade !== '未確定' && c.grade !== 'F')
              .reduce((s, c) => s + c.credits, 0)
            return (
              <div key={semester}>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-semibold text-gray-700">{semester}</h3>
                  <span className="text-xs text-gray-500">{semEarned}単位取得</span>
                </div>
                <div className="space-y-1">
                  {semCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => openEditModal(course)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-[#1e3a8a]/30 transition-colors bg-white"
                    >
                      <GradeBadge grade={course.grade} />
                      <span className="text-sm text-gray-900 flex-1 truncate">{course.name}</span>
                      <span className="text-xs text-gray-500">{course.credits}単位</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1e3a8a] mb-4">
              {editingCourse ? '科目を編集' : '科目を追加'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  科目名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: データサイエンス入門"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formSemester}
                  onChange={(e) => setFormSemester(e.target.value)}
                  placeholder="例: 2026春"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">単位数</label>
                  <select
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}単位
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成績</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value as Course['grade'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {editingCourse && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim() || !formSemester.trim()}
                className="px-4 py-2 text-sm text-white bg-[#1e3a8a] rounded-lg hover:bg-[#1e3a8a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCourse ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GradeBadge({ grade }: { grade: Course['grade'] }) {
  const colors: Record<string, string> = {
    S: 'bg-purple-100 text-purple-700',
    A: 'bg-blue-100 text-blue-700',
    B: 'bg-green-100 text-green-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700',
    '未確定': 'bg-gray-100 text-gray-500',
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${colors[grade] || 'bg-gray-100 text-gray-500'}`}
    >
      {grade === '未確定' ? '-' : grade}
    </span>
  )
}
