'use client'

import { useRef, useState, useEffect } from 'react'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface MonthlyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  colors: Color[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export default function MonthlyCalendar({
  currentDate,
  events,
  colors,
  onEventClick,
  onDateClick,
  onSwipeLeft,
  onSwipeRight,
}: MonthlyCalendarProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Swipe state
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHorizontalSwipe = useRef<boolean | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [slideAnimation, setSlideAnimation] = useState<'none' | 'slide-out-left' | 'slide-out-right' | 'slide-in-left' | 'slide-in-right'>('none')

  // Reset animation when month changes
  useEffect(() => {
    if (slideAnimation === 'slide-out-left' || slideAnimation === 'slide-out-right') return
    if (slideAnimation === 'slide-in-left') {
      // New month slides in from right
      const timer = setTimeout(() => setSlideAnimation('none'), 300)
      return () => clearTimeout(timer)
    }
    if (slideAnimation === 'slide-in-right') {
      // New month slides in from left
      const timer = setTimeout(() => setSlideAnimation('none'), 300)
      return () => clearTimeout(timer)
    }
  }, [slideAnimation])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (slideAnimation !== 'none') return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontalSwipe.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    if (slideAnimation !== 'none') return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const deltaX = currentX - touchStartX.current
    const deltaY = currentY - touchStartY.current

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
      return
    }

    if (!isHorizontalSwipe.current) return

    // Apply resistance: offset moves less the further you drag
    const resistance = 0.4
    setDragOffset(deltaX * resistance)
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return

    const THRESHOLD = 40 // minimum drag distance to trigger navigation

    if (isHorizontalSwipe.current && Math.abs(dragOffset) > THRESHOLD) {
      if (dragOffset < 0) {
        // Swiped left → next month
        setSlideAnimation('slide-out-left')
        setTimeout(() => {
          setDragOffset(0)
          onSwipeLeft?.()
          setSlideAnimation('slide-in-left')
        }, 200)
      } else {
        // Swiped right → previous month
        setSlideAnimation('slide-out-right')
        setTimeout(() => {
          setDragOffset(0)
          onSwipeRight?.()
          setSlideAnimation('slide-in-right')
        }, 200)
      }
    } else {
      // Snap back
      setDragOffset(0)
    }

    touchStartX.current = null
    touchStartY.current = null
    isHorizontalSwipe.current = null
  }

  // Calculate transform style
  const getTransformStyle = (): React.CSSProperties => {
    if (slideAnimation === 'slide-out-left') {
      return {
        transform: 'translateX(-100%)',
        opacity: 0,
        transition: 'transform 0.2s ease-in, opacity 0.2s ease-in',
      }
    }
    if (slideAnimation === 'slide-out-right') {
      return {
        transform: 'translateX(100%)',
        opacity: 0,
        transition: 'transform 0.2s ease-in, opacity 0.2s ease-in',
      }
    }
    if (slideAnimation === 'slide-in-left') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.3s ease-out, opacity 0.2s ease-out',
      }
    }
    if (slideAnimation === 'slide-in-right') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.3s ease-out, opacity 0.2s ease-out',
      }
    }
    if (dragOffset !== 0) {
      return {
        transform: `translateX(${dragOffset}px)`,
        transition: 'none',
      }
    }
    return {
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease-out',
    }
  }

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startingDayOfWeek = firstDay.getDay()

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div
      ref={containerRef}
      className="bg-white shadow overflow-hidden md:max-w-7xl md:mx-auto md:rounded-lg mb-4 md:mb-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center text-sm font-semibold ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid with animation */}
      <div style={{ overflow: 'hidden' }}>
        <div style={getTransformStyle()}>
          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="border border-gray-200 bg-gray-50" />
              }

              const dayEvents = getEventsForDate(date)
              const today = isToday(date)
              const dayOfWeek = date.getDay()
              const maxVisible = 3

              return (
                <div
                  key={date.toISOString()}
                  className={`border border-gray-200 p-1 md:p-2 min-h-[90px] md:min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    today ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onDateClick(date)}
                >
                  <div
                    className={`text-xs md:text-sm font-medium mb-1 md:mb-2 ${
                      today
                        ? 'text-[#1e3a8a] font-bold'
                        : dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-[#1e3a8a]'
                        : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5 md:space-y-1">
                    {dayEvents.slice(0, maxVisible).map((event) => {
                      const color = getColorById(event.color_id)
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick(event)
                          }}
                          className="text-[10px] md:text-xs p-0.5 md:p-1 rounded truncate cursor-pointer hover:opacity-80"
                          style={{
                            backgroundColor: color?.hex_code + '30' || '#e5e7eb',
                            borderLeft: `2px solid ${color?.hex_code || '#9ca3af'}`,
                          }}
                          title={event.title}
                        >
                          <span className="hidden md:inline">
                            {new Date(event.start_date).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                          </span>
                          {event.title}
                        </div>
                      )
                    })}

                    {dayEvents.length > maxVisible && (
                      <div className="text-[10px] md:text-xs text-gray-500 pl-0.5 md:pl-1">
                        +{dayEvents.length - maxVisible}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
