'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MonthlyCalendar from './MonthlyCalendar'
import DailyCalendar from './DailyCalendar'
import EventModal from './EventModal'
import ColorManager from './ColorManager'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface CalendarViewProps {
  userId: string
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [filteredColorIds, setFilteredColorIds] = useState<Set<string>>(new Set())
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
    loadColors()
  }, [currentDate, viewMode, userId])

  const loadEvents = async () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', startDate.toISOString())
      .lte('start_date', endDate.toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('[Calendar] Error loading events:', error)
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
      console.error('[Calendar] Error loading colors:', error)
    } else {
      setColors(data)
    }
  }

  const toggleColorFilter = (colorId: string) => {
    const newFiltered = new Set(filteredColorIds)
    if (newFiltered.has(colorId)) {
      newFiltered.delete(colorId)
    } else {
      newFiltered.add(colorId)
    }
    setFilteredColorIds(newFiltered)
  }

  const getFilteredEvents = () => {
    let filtered = events

    // is_visible が false の予定は両ビューで非表示
    filtered = filtered.filter(e => e.is_visible)

    if (filteredColorIds.size > 0) {
      filtered = filtered.filter(e => e.color_id && filteredColorIds.has(e.color_id))
    }

    return filtered
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventSave = async () => {
    await loadEvents()
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  const handleColorsUpdate = async () => {
    await loadColors()
    await loadEvents()
  }

  const goToPreviousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
    }
  }

  const goToNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const filteredEvents = getFilteredEvents()

  return (
    <div className="space-y-2 md:space-y-6">
      {/* Controls */}
      <div className="bg-white shadow p-2 md:p-4 mx-2 md:mx-auto md:max-w-7xl md:rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={goToPreviousPeriod}
              className="p-2 rounded hover:bg-gray-100 text-base md:text-lg"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 md:px-4 py-2 text-sm md:text-base font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              今日
            </button>
            <button
              onClick={goToNextPeriod}
              className="p-2 rounded hover:bg-gray-100 text-base md:text-lg"
            >
              →
            </button>
            <h2 className="text-sm md:text-xl font-bold ml-2 md:ml-4">
              {viewMode === 'month'
                ? `${currentDate.getFullYear()}年${String(currentDate.getMonth() + 1).padStart(2, '0')}月`
                : currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setIsColorManagerOpen(true)}
              className="hidden sm:block px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              カラー管理
            </button>

            <button
              onClick={() => {
                setSelectedDate(new Date())
                setSelectedEvent(null)
                setIsEventModalOpen(true)
              }}
              className="hidden md:block px-3 md:px-4 py-2 text-sm md:text-base font-medium text-white bg-[#1e3a8a] rounded hover:bg-[#1e40af]"
            >
              予定追加
            </button>
          </div>
        </div>

        {/* Color Filters */}
        <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-700">表示フィルター:</h3>
            <button
              onClick={() => setIsColorManagerOpen(true)}
              className="w-6 h-6 flex items-center justify-center bg-[#1e3a8a] text-white rounded-full text-sm hover:bg-[#1e40af] transition-colors"
              aria-label="カラー追加"
            >
              +
            </button>
          </div>
          {colors.length > 0 ? (
            <div className="flex flex-wrap gap-1 md:gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => toggleColorFilter(color.id)}
                  className={`px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm rounded-full border-2 transition-all ${
                    filteredColorIds.size === 0 || filteredColorIds.has(color.id)
                      ? 'opacity-100'
                      : 'opacity-30'
                  }`}
                  style={{
                    borderColor: color.hex_code,
                    backgroundColor: filteredColorIds.has(color.id) || filteredColorIds.size === 0
                      ? color.hex_code + '20'
                      : 'transparent',
                    color: color.hex_code,
                  }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">+ボタンからカラーを追加して予定を分類しましょう</p>
          )}
        </div>
      </div>

      {/* Calendar Display */}
      {viewMode === 'month' ? (
        <MonthlyCalendar
          currentDate={currentDate}
          events={filteredEvents}
          colors={colors}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onSwipeLeft={goToNextPeriod}
          onSwipeRight={goToPreviousPeriod}
        />
      ) : (
        <DailyCalendar
          currentDate={currentDate}
          events={filteredEvents}
          colors={colors}
          onEventClick={handleEventClick}
        />
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          initialDate={selectedDate}
          colors={colors}
          onClose={() => {
            setIsEventModalOpen(false)
            setSelectedEvent(null)
            setSelectedDate(null)
          }}
          onSave={handleEventSave}
        />
      )}

      {/* Color Manager Modal */}
      {isColorManagerOpen && (
        <ColorManager
          colors={colors}
          onClose={() => setIsColorManagerOpen(false)}
          onUpdate={handleColorsUpdate}
        />
      )}

      {/* Mobile Floating Controls */}
      <div className="md:hidden fixed bottom-24 right-6 flex items-center gap-3 z-40">
        <div className="flex gap-1 bg-white rounded-full shadow-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              viewMode === 'month'
                ? 'bg-[#1e3a8a] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              viewMode === 'day'
                ? 'bg-[#1e3a8a] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            日
          </button>
        </div>

        <button
          onClick={() => {
            setSelectedDate(viewMode === 'day' ? currentDate : new Date())
            setSelectedEvent(null)
            setIsEventModalOpen(true)
          }}
          className="w-14 h-14 bg-[#1e3a8a] text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-[#1e40af] active:scale-95 transition-all"
          aria-label="予定を追加"
        >
          +
        </button>
      </div>
    </div>
  )
}
