'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type Todo = Database['public']['Tables']['todos']['Row']
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface DeadlineItem {
  id: string
  title: string
  deadline: Date
  type: 'todo' | 'event'
}

interface DeadlineCountdownProps {
  userId: string
}

function getTimeRemaining(deadline: Date): { text: string; color: string } {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()

  if (diff < 0) {
    return { text: '期限切れ', color: 'text-red-600' }
  }

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days >= 1) {
    return {
      text: `あと${days}日`,
      color: days < 3 ? 'text-orange-600' : 'text-green-600',
    }
  }
  if (hours >= 1) {
    return {
      text: `あと${hours}時間`,
      color: 'text-red-600',
    }
  }
  return {
    text: `あと${minutes}分`,
    color: 'text-red-600',
  }
}

function getBorderColor(deadline: Date): string {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  const hours = diff / (1000 * 60 * 60)

  if (hours < 0) return 'border-red-400 bg-red-50'
  if (hours < 24) return 'border-red-300 bg-red-50/50'
  if (hours < 72) return 'border-orange-300 bg-orange-50/50'
  return 'border-green-300 bg-green-50/50'
}

export default function DeadlineCountdown({ userId }: DeadlineCountdownProps) {
  const [items, setItems] = useState<DeadlineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const now = new Date().toISOString()
    const deadlineItems: DeadlineItem[] = []

    // Fetch todos with deadlines
    const { data: todos } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gte('deadline', now)
      .order('deadline', { ascending: true })

    if (todos) {
      for (const todo of todos as Todo[]) {
        if (todo.deadline) {
          deadlineItems.push({
            id: todo.id,
            title: todo.title,
            deadline: new Date(todo.deadline),
            type: 'todo',
          })
        }
      }
    }

    // Fetch upcoming calendar events
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', now)
      .order('start_date', { ascending: true })

    if (events) {
      for (const event of events as CalendarEvent[]) {
        deadlineItems.push({
          id: event.id,
          title: event.title,
          deadline: new Date(event.start_date),
          type: 'event',
        })
      }
    }

    // Sort by deadline
    deadlineItems.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    setItems(deadlineItems)
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Force re-render every minute for time remaining updates
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const displayItems = showAll ? items : items.slice(0, 5)
  const hasMore = items.length > 5

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-bold text-[#1e3a8a] mb-3">締め切り</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-bold text-[#1e3a8a] mb-3">締め切り</h3>
        <div className="text-sm text-gray-500 text-center py-6">
          直近の締め切りはありません
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-bold text-[#1e3a8a] mb-3">締め切り</h3>

      <div className="space-y-2">
        {displayItems.map((item) => {
          const remaining = getTimeRemaining(item.deadline)
          const borderClass = getBorderColor(item.deadline)

          return (
            <div
              key={`${item.type}-${item.id}`}
              className={`rounded-lg border-l-4 p-3 ${borderClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">
                      {item.type === 'todo' ? '✓' : '📅'}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.deadline.toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    })}{' '}
                    {item.deadline.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${remaining.color}`}>
                  {remaining.text}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full text-center text-xs text-[#1e3a8a] hover:text-[#1e3a8a]/70 font-medium transition-colors"
        >
          もっと見る ({items.length - 5}件)
        </button>
      )}
      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full text-center text-xs text-[#1e3a8a] hover:text-[#1e3a8a]/70 font-medium transition-colors"
        >
          閉じる
        </button>
      )}
    </div>
  )
}
