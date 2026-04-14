'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface TimetableClass {
  name: string
  room?: string
  teacher?: string
  color: string
}

interface TimetableData {
  [key: string]: TimetableClass // key: "day-period" e.g. "0-0" = Mon 1st period
}

interface TimetableViewProps {
  userId: string
}

const DAYS = ['月', '火', '水', '木', '金', '土'] as const
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const PERIODS = [
  { label: '1限', time: '9:25-10:55' },
  { label: '2限', time: '11:10-12:40' },
  { label: '3限', time: '13:30-15:00' },
  { label: '4限', time: '15:15-16:45' },
  { label: '5限', time: '17:00-18:30' },
  { label: '6限', time: '18:45-20:15' },
] as const

const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E8BAFF', '#FFB3DE', '#B3FFE0', '#FFE0B3', '#B3D4FF',
  '#D4B3FF', '#FFB3B3', '#B3FFB3', '#B3FFFF', '#FFD4B3',
  '#D4FFB3',
]

function getRandomPastelColor(): string {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]
}

function getStorageKey(userId: string) {
  return `timetable_${userId}`
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5,
}

export default function TimetableView({ userId }: TimetableViewProps) {
  const [tabMode, setTabMode] = useState<'register' | 'weekly'>('register')
  const [timetable, setTimetable] = useState<TimetableData>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null)
  const [formName, setFormName] = useState('')
  const [formRoom, setFormRoom] = useState('')
  const [formTeacher, setFormTeacher] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 0 : d - 1 // Default to today's day (Mon=0)
  })
  const [importing, setImporting] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(userId))
    if (stored) {
      try {
        setTimetable(JSON.parse(stored))
      } catch {
        setTimetable({})
      }
    }
    // Load saved API token
    const savedToken = localStorage.getItem(`klms_api_token_${userId}`)
    if (savedToken) setApiToken(savedToken)
  }, [userId])

  const handleImportFromKLMS = async () => {
    if (!apiToken.trim()) {
      setImportMessage({ type: 'error', text: 'APIトークンを入力してください' })
      return
    }

    setImporting(true)
    setImportMessage(null)

    try {
      const res = await fetch('/api/klms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apiToken: apiToken.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (!data.timetable || data.timetable.length === 0) {
        setImportMessage({ type: 'error', text: '時間割情報が見つかりませんでした' })
        setImporting(false)
        return
      }

      // Build timetable from API response
      const newTimetable: TimetableData = { ...timetable }
      let addedCount = 0
      const colorMap: Record<string, string> = {}

      for (const entry of data.timetable) {
        const dayIndex = DAY_NAME_TO_INDEX[entry.day]
        if (dayIndex === undefined) continue
        const periodIndex = entry.period - 1 // API returns 1-based
        if (periodIndex < 0 || periodIndex >= 6) continue

        const key = `${dayIndex}-${periodIndex}`
        if (newTimetable[key]) continue // Don't overwrite existing

        // Use consistent color for same course
        if (!colorMap[entry.name]) {
          colorMap[entry.name] = getRandomPastelColor()
        }

        newTimetable[key] = {
          name: entry.name,
          room: entry.room || undefined,
          teacher: entry.teacher || undefined,
          color: colorMap[entry.name],
        }
        addedCount++
      }

      saveTimetable(newTimetable)
      // Save token for future use
      localStorage.setItem(`klms_api_token_${userId}`, apiToken.trim())
      setImportMessage({ type: 'success', text: `K-LMSから ${addedCount} コマの授業を取得しました` })
      setShowTokenInput(false)
    } catch (error: any) {
      setImportMessage({ type: 'error', text: error.message || '取得に失敗しました' })
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const saveTimetable = useCallback((data: TimetableData) => {
    setTimetable(data)
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data))
  }, [userId])

  const cellKey = (day: number, period: number) => `${day}-${period}`

  const handleCellClick = (day: number, period: number) => {
    setEditingCell({ day, period })
    const existing = timetable[cellKey(day, period)]
    if (existing) {
      setFormName(existing.name)
      setFormRoom(existing.room || '')
      setFormTeacher(existing.teacher || '')
    } else {
      setFormName('')
      setFormRoom('')
      setFormTeacher('')
    }
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!editingCell || !formName.trim()) return
    const key = cellKey(editingCell.day, editingCell.period)
    const existing = timetable[key]
    const newData = {
      ...timetable,
      [key]: {
        name: formName.trim(),
        room: formRoom.trim() || undefined,
        teacher: formTeacher.trim() || undefined,
        color: existing?.color || getRandomPastelColor(),
      },
    }
    saveTimetable(newData)
    setModalOpen(false)
    setEditingCell(null)
  }

  const handleDelete = () => {
    if (!editingCell) return
    const key = cellKey(editingCell.day, editingCell.period)
    const newData = { ...timetable }
    delete newData[key]
    saveTimetable(newData)
    setModalOpen(false)
    setEditingCell(null)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingCell(null)
  }

  // Shared import UI
  const importUI = (
    <div className="mb-4">
      {!showTokenInput ? (
        <button
          onClick={() => setShowTokenInput(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#1e3a8a] rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
        >
          K-LMSから自動取得
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-sm text-blue-800">
            K-LMS → アカウント → 設定 → 「新しいアクセストークンの生成」でトークンを取得してください
          </p>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="K-LMS APIトークン"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportFromKLMS}
              disabled={importing}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1e3a8a] rounded-lg hover:bg-[#1e3a8a]/90 disabled:opacity-50 transition-colors"
            >
              {importing ? '取得中...' : '取得する'}
            </button>
            <button
              onClick={() => { setShowTokenInput(false); setImportMessage(null) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
      {importMessage && (
        <div className={`mt-2 p-3 rounded-lg text-sm ${
          importMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importMessage.text}
        </div>
      )}
    </div>
  )

  // Get today's day index (0=Mon, 5=Sat, -1=Sun)
  const todayDayIndex = (() => {
    const d = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    return d === 0 ? -1 : d - 1 // Mon=0, Tue=1, ..., Sat=5, Sun=-1
  })()

  // Tab switcher (shared between mobile/desktop)
  const tabSwitcher = (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
      <button
        onClick={() => setTabMode('register')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          tabMode === 'register' ? 'bg-white text-[#1e3a8a] shadow' : 'text-gray-600'
        }`}
      >
        時間割
      </button>
      <button
        onClick={() => setTabMode('weekly')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          tabMode === 'weekly' ? 'bg-white text-[#1e3a8a] shadow' : 'text-gray-600'
        }`}
      >
        週間予定
      </button>
    </div>
  )

  // Weekly calendar view
  if (tabMode === 'weekly') {
    return (
      <div className="p-2 md:p-4">
        <h2 className="text-lg md:text-xl font-bold text-[#1e3a8a] mb-3 md:mb-4">時間割</h2>
        {tabSwitcher}
        <WeeklyCalendarView userId={userId} />
      </div>
    )
  }

  // Mobile: show one day at a time
  if (isMobile) {
    return (
      <div className="p-2">
        <h2 className="text-lg font-bold text-[#1e3a8a] mb-3">時間割</h2>
        {tabSwitcher}
        {importUI}

        {/* Day selector */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 min-w-[40px] py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedDay === i
                  ? 'bg-[#1e3a8a] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Period list for selected day */}
        <div className="space-y-2">
          {PERIODS.map((period, pi) => {
            const cls = timetable[cellKey(selectedDay, pi)]
            return (
              <button
                key={pi}
                onClick={() => handleCellClick(selectedDay, pi)}
                className="w-full text-left rounded-lg border border-gray-200 p-3 transition-colors hover:border-[#1e3a8a]/30"
                style={cls ? { backgroundColor: cls.color + '40', borderColor: cls.color } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 w-20 shrink-0">
                    <div className="font-medium text-gray-700">{period.label}</div>
                    <div>{period.time}</div>
                  </div>
                  {cls ? (
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{cls.name}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {[cls.room, cls.teacher].filter(Boolean).join(' / ')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">タップして追加</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Modal */}
        {modalOpen && (
          <TimetableModal
            editingCell={editingCell}
            timetable={timetable}
            formName={formName}
            formRoom={formRoom}
            formTeacher={formTeacher}
            setFormName={setFormName}
            setFormRoom={setFormRoom}
            setFormTeacher={setFormTeacher}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={handleModalClose}
            cellKey={cellKey}
          />
        )}
      </div>
    )
  }

  // Desktop: full table
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-[#1e3a8a] mb-4">時間割</h2>
      {tabSwitcher}
      {importUI}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="w-20 p-2 text-xs text-gray-500 border border-gray-200 bg-gray-50"></th>
              {DAYS.map((day, i) => (
                <th
                  key={i}
                  className={`p-2 text-sm font-semibold border border-gray-200 ${
                    i === todayDayIndex ? 'bg-blue-50 text-[#1e3a8a]' : 'bg-gray-50 text-[#1e3a8a]'
                  }`}
                >
                  <div className={i === todayDayIndex ? 'text-[#1e3a8a] font-bold' : ''}>{day}</div>
                  <div className={`text-xs font-normal ${i === todayDayIndex ? 'text-[#1e3a8a]/60' : 'text-gray-400'}`}>{DAYS_EN[i]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, pi) => (
              <tr key={pi}>
                <td className="p-2 text-center border border-gray-200 bg-gray-50">
                  <div className="text-xs font-medium text-gray-700">{period.label}</div>
                  <div className="text-[10px] text-gray-400">{period.time}</div>
                </td>
                {DAYS.map((_, di) => {
                  const cls = timetable[cellKey(di, pi)]
                  const isTodayCol = di === todayDayIndex
                  return (
                    <td
                      key={di}
                      onClick={() => handleCellClick(di, pi)}
                      className={`border border-gray-200 p-1 h-20 align-top cursor-pointer transition-colors hover:bg-blue-50 ${
                        isTodayCol && !cls ? 'bg-blue-50/40' : ''
                      }`}
                      style={cls ? { backgroundColor: cls.color + (isTodayCol ? '60' : '40') } : undefined}
                    >
                      {cls ? (
                        <div className="p-1">
                          <div
                            className="text-xs font-medium text-gray-900 leading-tight truncate"
                            title={cls.name}
                          >
                            {cls.name}
                          </div>
                          {cls.room && (
                            <div className="text-[10px] text-gray-600 truncate mt-0.5">{cls.room}</div>
                          )}
                          {cls.teacher && (
                            <div className="text-[10px] text-gray-500 truncate">{cls.teacher}</div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-300 text-lg">+</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <TimetableModal
          editingCell={editingCell}
          timetable={timetable}
          formName={formName}
          formRoom={formRoom}
          formTeacher={formTeacher}
          setFormName={setFormName}
          setFormRoom={setFormRoom}
          setFormTeacher={setFormTeacher}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleModalClose}
          cellKey={cellKey}
        />
      )}
    </div>
  )
}

// Modal sub-component
function TimetableModal({
  editingCell,
  timetable,
  formName,
  formRoom,
  formTeacher,
  setFormName,
  setFormRoom,
  setFormTeacher,
  onSave,
  onDelete,
  onClose,
  cellKey,
}: {
  editingCell: { day: number; period: number } | null
  timetable: TimetableData
  formName: string
  formRoom: string
  formTeacher: string
  setFormName: (v: string) => void
  setFormRoom: (v: string) => void
  setFormTeacher: (v: string) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
  cellKey: (day: number, period: number) => string
}) {
  if (!editingCell) return null
  const isEditing = !!timetable[cellKey(editingCell.day, editingCell.period)]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#1e3a8a] mb-4">
          {DAYS[editingCell.day]} {PERIODS[editingCell.period].label}
          <span className="text-sm font-normal text-gray-500 ml-2">
            {PERIODS[editingCell.period].time}
          </span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              授業名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="例: 情報基礎"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">教室</label>
            <input
              type="text"
              value={formRoom}
              onChange={(e) => setFormRoom(e.target.value)}
              placeholder="例: θ211"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当教員</label>
            <input
              type="text"
              value={formTeacher}
              onChange={(e) => setFormTeacher(e.target.value)}
              placeholder="例: 山田太郎"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/50 focus:border-[#1e3a8a]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          {isEditing && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            disabled={!formName.trim()}
            className="px-4 py-2 text-sm text-white bg-[#1e3a8a] rounded-lg hover:bg-[#1e3a8a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Weekly Calendar View (Penmark-style)
function WeeklyCalendarView({ userId }: { userId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const supabase = createClient()

  // 週間表示はコンパクトに50px/h（日表示DailyCalendarは60px/hでゆったり表示）
  const HOUR_HEIGHT = 50
  const START_HOUR = 6
  const END_HOUR = 22
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  }), [weekStart])

  useEffect(() => {
    loadEvents()
    loadColors()
  }, [currentDate, userId])

  const loadEvents = async () => {
    const start = weekDays[0]
    const end = new Date(weekDays[6])
    end.setHours(23, 59, 59)

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', start.toISOString())
      .lte('start_date', end.toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('[WeeklyCalendar] Error loading events:', error)
    } else {
      setEvents(data)
    }
  }

  const loadColors = async () => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[WeeklyCalendar] Error loading colors:', error)
    } else {
      setColors(data)
    }
  }

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

  // Calculate column assignment for overlapping events
  const getEventColumns = (dayEvents: CalendarEvent[]) => {
    const columns: CalendarEvent[][] = []
    const eventColumns = new Map<string, number>()

    const sorted = [...dayEvents].sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )

    sorted.forEach((event) => {
      let col = 0
      let placed = false
      while (!placed) {
        if (!columns[col]) columns[col] = []
        const overlaps = columns[col].some((ex) => {
          const s1 = new Date(event.start_date).getTime()
          const e1 = new Date(event.end_date).getTime()
          const s2 = new Date(ex.start_date).getTime()
          const e2 = new Date(ex.end_date).getTime()
          return s1 < e2 && s2 < e1
        })
        if (!overlaps) {
          columns[col].push(event)
          eventColumns.set(event.id, col)
          placed = true
        } else {
          col++
        }
      }
    })

    return { eventColumns, maxColumns: Math.max(columns.length, 1) }
  }

  const weekLabel = (() => {
    const s = weekDays[0]
    const e = weekDays[6]
    if (s.getMonth() === e.getMonth()) {
      return `${s.getFullYear()}年 ${s.getMonth() + 1}月 ${s.getDate()}日 〜 ${e.getDate()}日`
    }
    return `${s.getMonth() + 1}/${s.getDate()} 〜 ${e.getMonth() + 1}/${e.getDate()}`
  })()

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }}
          className="p-2 rounded hover:bg-gray-100"
        >
          ←
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          今週
        </button>
        <button
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }}
          className="p-2 rounded hover:bg-gray-100"
        >
          →
        </button>
        <h3 className="text-sm md:text-lg font-bold ml-2">{weekLabel}</h3>
      </div>

      {/* Weekly timetable */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 sticky top-0 bg-white z-20">
              <div className="p-2 border-r border-gray-200" />
              {weekDays.map((date, i) => {
                const today = isToday(date)
                const dayOfWeek = date.getDay()
                return (
                  <div
                    key={i}
                    className={`p-2 text-center border-r border-gray-200 ${today ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-xs font-semibold ${
                      dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {dayLabels[i]}
                    </div>
                    <div className={`text-lg font-bold ${
                      today ? 'text-blue-600' : dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
                <div className="relative border-r border-gray-200">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full text-right pr-2 text-xs text-gray-500 font-medium"
                      style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {weekDays.map((date, dayIndex) => {
                  const dayEvents = getEventsForDay(date)
                  const { eventColumns, maxColumns } = getEventColumns(dayEvents)
                  const today = isToday(date)

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-r border-gray-200 ${today ? 'bg-blue-50/30' : ''}`}
                    >
                      {hours.map((hour) => (
                        <div
                          key={`grid-${hour}`}
                          className="absolute w-full border-b border-gray-100"
                          style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {dayEvents.map((event) => {
                        const color = getColorById(event.color_id)
                        const startTime = new Date(event.start_date)
                        const endTime = new Date(event.end_date)

                        const startHour = startTime.getHours() + startTime.getMinutes() / 60
                        const endHour = endTime.getHours() + endTime.getMinutes() / 60

                        const clampedStart = Math.max(startHour, START_HOUR)
                        const clampedEnd = Math.min(endHour, END_HOUR)
                        if (clampedEnd <= clampedStart) return null

                        const top = (clampedStart - START_HOUR) * HOUR_HEIGHT
                        const height = (clampedEnd - clampedStart) * HOUR_HEIGHT
                        const colIndex = eventColumns.get(event.id) || 0
                        const width = `${100 / maxColumns}%`
                        const left = `${(colIndex / maxColumns) * 100}%`

                        return (
                          <div
                            key={event.id}
                            className="absolute rounded-md overflow-hidden"
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 20)}px`,
                              width,
                              left,
                              backgroundColor: color?.hex_code || '#94a3b8',
                              zIndex: 10,
                              padding: '2px 4px',
                            }}
                          >
                            <div className="text-[10px] font-bold text-white truncate leading-tight">
                              {event.title}
                            </div>
                            {height > 30 && (
                              <div className="text-[9px] text-white/80 truncate">
                                {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
