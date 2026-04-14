'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import CalendarView from './CalendarView'
import TodoList from './TodoList'
import KLMSView from './KLMSView'
import UniversityCalendarView from './UniversityCalendarView'
import SettingsView from './SettingsView'
import FeedbackModal from './FeedbackModal'
import TimetableView from './TimetableView'
import CreditTracker from './CreditTracker'

type ViewType = 'calendar' | 'todo' | 'klms' | 'timetable' | 'university' | 'credits' | 'settings'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [view, setView] = useState<ViewType>('calendar')
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [syncToast, setSyncToast] = useState<string | null>(null)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const hasSyncedRef = useRef(false)

  // Auto-sync KLMS on mount
  useEffect(() => {
    if (hasSyncedRef.current) return
    hasSyncedRef.current = true

    const klmsUrl = localStorage.getItem('klms_calendar_url')
    if (!klmsUrl) return

    const lastSync = localStorage.getItem('klms_last_sync')
    const oneHour = 60 * 60 * 1000
    const now = Date.now()

    if (lastSync && now - parseInt(lastSync, 10) < oneHour) return

    // Trigger background sync
    fetch('/api/klms/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarUrl: klmsUrl }),
    })
      .then(async (res) => {
        if (res.ok) {
          localStorage.setItem('klms_last_sync', String(Date.now()))
          setSyncToast('KLMS同期が完了しました')
        } else {
          setSyncToast('KLMS同期に失敗しました')
        }
      })
      .catch(() => {
        setSyncToast('KLMS同期に失敗しました')
      })
  }, [])

  // Auto-hide toast
  useEffect(() => {
    if (!syncToast) return
    const timer = setTimeout(() => setSyncToast(null), 3000)
    return () => clearTimeout(timer)
  }, [syncToast])

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreMenuOpen])

  const isMoreView = view === 'university' || view === 'credits' || view === 'settings'

  const handleMoreSelect = useCallback((v: ViewType) => {
    setView(v)
    setMoreMenuOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Sync Toast */}
      {syncToast && (
        <div className="fixed top-4 right-4 z-[100] bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {syncToast}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1e3a8a] shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-xl md:text-2xl">🐻</span>
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-white">
                ベアカレンダー
              </h1>
              <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="ml-2 px-3 py-1 text-xs md:text-sm bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
              >
                修正要望
              </button>
            </div>
            <div className="text-white text-sm md:text-lg font-semibold">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }).replace('/', '.')}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {([
              { key: 'calendar', label: '📅 カレンダー' },
              { key: 'todo', label: '✓ ToDo' },
              { key: 'timetable', label: '📋 時間割' },
              { key: 'klms', label: '🔗 KLMS連携' },
              { key: 'university', label: '🎓 大学暦' },
              { key: 'credits', label: '📊 単位' },
              { key: 'settings', label: '⚙️ 設定' },
            ] as { key: ViewType; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  view === tab.key
                    ? 'border-[#1e3a8a] text-[#1e3a8a]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="grid grid-cols-5 h-18 pt-1">
          <button
            onClick={() => setView('calendar')}
            className="flex flex-col items-center justify-center text-[10px] transition-colors"
          >
            <img
              src={view === 'calendar' ? '/icon-calendar-active.png' : '/icon-calendar-inactive.png'}
              alt="カレンダー"
              className="w-6 h-6 mb-1 object-contain"
            />
            <span className={`font-medium ${view === 'calendar' ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
              カレンダー
            </span>
          </button>
          <button
            onClick={() => setView('todo')}
            className="flex flex-col items-center justify-center text-[10px] transition-colors"
          >
            <img
              src={view === 'todo' ? '/icon-todo-active.png' : '/icon-todo-inactive.png'}
              alt="ToDo"
              className="w-6 h-6 mb-1 object-contain"
            />
            <span className={`font-medium ${view === 'todo' ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
              ToDo
            </span>
          </button>
          <button
            onClick={() => setView('timetable')}
            className="flex flex-col items-center justify-center text-[10px] transition-colors"
          >
            <span className="text-xl mb-1">📋</span>
            <span className={`font-medium ${view === 'timetable' ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
              時間割
            </span>
          </button>
          <button
            onClick={() => setView('klms')}
            className="flex flex-col items-center justify-center text-[10px] transition-colors"
          >
            <img
              src={view === 'klms' ? '/icon-klms-active.png' : '/icon-klms-inactive.png'}
              alt="KLMS"
              className="w-6 h-6 mb-1 object-contain"
            />
            <span className={`font-medium ${view === 'klms' ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
              KLMS
            </span>
          </button>
          {/* More menu (その他) */}
          <div ref={moreMenuRef} className="relative flex flex-col items-center justify-center">
            <button
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              className="flex flex-col items-center justify-center text-[10px] transition-colors w-full"
            >
              <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke={isMoreView ? '#1e3a8a' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
              <span className={`font-medium ${isMoreView ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
                その他
              </span>
            </button>
            {moreMenuOpen && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-[60]">
                <button
                  onClick={() => handleMoreSelect('university')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${view === 'university' ? 'text-[#1e3a8a] font-semibold' : 'text-gray-700'}`}
                >
                  🎓 大学暦
                </button>
                <button
                  onClick={() => handleMoreSelect('credits')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${view === 'credits' ? 'text-[#1e3a8a] font-semibold' : 'text-gray-700'}`}
                >
                  📊 単位管理
                </button>
                <button
                  onClick={() => handleMoreSelect('settings')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${view === 'settings' ? 'text-[#1e3a8a] font-semibold' : 'text-gray-700'}`}
                >
                  ⚙️ 設定
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={view === 'calendar' ? 'py-3 md:py-8' : 'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 md:py-8'}>
        {view === 'calendar' && (
          <CalendarView userId={user.id} />
        )}
        {view === 'todo' && <TodoList userId={user.id} />}
        {view === 'klms' && <KLMSView userId={user.id} />}
        {view === 'timetable' && <TimetableView userId={user.id} />}
        {view === 'university' && <UniversityCalendarView />}
        {view === 'credits' && <CreditTracker userId={user.id} />}
        {view === 'settings' && <SettingsView user={user} />}
      </main>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  )
}
