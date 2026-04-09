'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import CalendarView from './CalendarView'
import TodoList from './TodoList'
import KLMSView from './KLMSView'
import UniversityCalendarView from './UniversityCalendarView'
import SettingsView from './SettingsView'
import FeedbackModal from './FeedbackModal'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [view, setView] = useState<'calendar' | 'todo' | 'klms' | 'university' | 'settings'>('calendar')
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
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
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === 'calendar'
                  ? 'border-[#1e3a8a] text-[#1e3a8a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 カレンダー
            </button>
            <button
              onClick={() => setView('todo')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === 'todo'
                  ? 'border-[#1e3a8a] text-[#1e3a8a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ✓ ToDo
            </button>
            <button
              onClick={() => setView('klms')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === 'klms'
                  ? 'border-[#1e3a8a] text-[#1e3a8a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔗 KLMS連携
            </button>
            <button
              onClick={() => setView('university')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === 'university'
                  ? 'border-[#1e3a8a] text-[#1e3a8a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🎓 大学暦
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === 'settings'
                  ? 'border-[#1e3a8a] text-[#1e3a8a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ 設定
            </button>
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
          <button
            onClick={() => setView('university')}
            className="flex flex-col items-center justify-center text-[10px] transition-colors"
          >
            <img
              src={view === 'university' ? '/icon-university-active.png' : '/icon-university-inactive.png'}
              alt="大学暦"
              className="w-6 h-6 mb-1 object-contain"
            />
            <span className={`font-medium ${view === 'university' ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
              大学暦
            </span>
          </button>
          <button
            onClick={() => setView('settings')}
            className="flex flex-col items-center justify-center text-[10px] transition-colors"
          >
            <img
              src={view === 'settings' ? '/icon-settings-active.png' : '/icon-settings-inactive.png'}
              alt="設定"
              className="w-6 h-6 mb-1 object-contain"
            />
            <span className={`font-medium ${view === 'settings' ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
              設定
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={view === 'calendar' ? 'py-3 md:py-8' : 'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 md:py-8'}>
        {view === 'calendar' && <CalendarView userId={user.id} />}
        {view === 'todo' && <TodoList userId={user.id} />}
        {view === 'klms' && <KLMSView userId={user.id} />}
        {view === 'university' && <UniversityCalendarView />}
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
