'use client'

import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface DailyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  colors: Color[]
  onEventClick: (event: CalendarEvent) => void
}

export default function DailyCalendar({
  currentDate,
  events,
  colors,
  onEventClick,
}: DailyCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getDayEvents = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const dayEvents = getDayEvents()

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event) => {
      const eventHour = new Date(event.start_date).getHours()
      return eventHour === hour
    })
  }

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-4 md:mb-0">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          予定: {dayEvents.length}件
        </p>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)

          return (
            <div
              key={hour}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex">
                <div className="w-20 p-3 text-sm text-gray-600 font-medium border-r border-gray-200">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                <div className="flex-1 p-2 min-h-[60px]">
                  {hourEvents.length > 0 ? (
                    <div className="space-y-2">
                      {hourEvents.map((event) => {
                        const color = getColorById(event.color_id)
                        const startTime = new Date(event.start_date)
                        const endTime = new Date(event.end_date)

                        return (
                          <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: color?.hex_code + '20' || '#e5e7eb',
                              borderLeft: `4px solid ${color?.hex_code || '#9ca3af'}`,
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {event.title}
                                </h4>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 ml-4">
                                {startTime.toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                -{' '}
                                {endTime.toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            {color && (
                              <div className="mt-2">
                                <span
                                  className="text-xs px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: color.hex_code + '30',
                                    color: color.hex_code,
                                  }}
                                >
                                  {color.name}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
