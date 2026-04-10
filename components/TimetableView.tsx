'use client'

import { useState, useEffect, useCallback } from 'react'

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

export default function TimetableView({ userId }: TimetableViewProps) {
  const [timetable, setTimetable] = useState<TimetableData>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null)
  const [formName, setFormName] = useState('')
  const [formRoom, setFormRoom] = useState('')
  const [formTeacher, setFormTeacher] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(userId))
    if (stored) {
      try {
        setTimetable(JSON.parse(stored))
      } catch {
        setTimetable({})
      }
    }
  }, [userId])

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

  // Mobile: show one day at a time
  if (isMobile) {
    return (
      <div className="p-2">
        <h2 className="text-lg font-bold text-[#1e3a8a] mb-3">時間割</h2>

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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="w-20 p-2 text-xs text-gray-500 border border-gray-200 bg-gray-50"></th>
              {DAYS.map((day, i) => (
                <th
                  key={i}
                  className="p-2 text-sm font-semibold text-[#1e3a8a] border border-gray-200 bg-gray-50"
                >
                  <div>{day}</div>
                  <div className="text-xs font-normal text-gray-400">{DAYS_EN[i]}</div>
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
                  return (
                    <td
                      key={di}
                      onClick={() => handleCellClick(di, pi)}
                      className="border border-gray-200 p-1 h-20 align-top cursor-pointer transition-colors hover:bg-blue-50"
                      style={cls ? { backgroundColor: cls.color + '40' } : undefined}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
