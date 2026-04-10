import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 曜日マッピング
const DAY_MAP: Record<string, string> = {
  '月': '月', '火': '火', '水': '水', '木': '木', '金': '金', '土': '土',
}

// コース名から時間割情報をパース
// 例: "3-31 春[水1 水2 金1 金2]HIGH CAMERON I　ENGLISH INTENSIVE 1EA [SFC λ23]"
function parseCourseSchedule(name: string) {
  // [曜日時限] パターンを抽出: [火2] や [水1 水2 金1 金2]
  const scheduleMatch = name.match(/\[([月火水木金土他][^\]]*)\]/)
  if (!scheduleMatch) return null

  const scheduleStr = scheduleMatch[1]

  // 「他」は不定期なのでスキップ
  if (scheduleStr === '他') return null

  // 各曜日・時限を抽出: "水1 水2 金1 金2" → [{day: "水", period: 1}, ...]
  const slots: { day: string; period: number }[] = []
  const slotPattern = /([月火水木金土])(\d)/g
  let match
  while ((match = slotPattern.exec(scheduleStr)) !== null) {
    slots.push({ day: match[1], period: parseInt(match[2]) })
  }

  // 教室を抽出: [SFC λ23] や [湘南藤沢 τ11]
  const roomMatch = name.match(/\[(SFC|湘南藤沢)\s*([^\]]+)\]/)
  const room = roomMatch ? roomMatch[2].trim() : ''

  // 教員名を抽出: 曜日の後の最初の名前パターン
  // "春[火2]福島 康仁　宇宙安全保障" → teacher: "福島 康仁", subject: "宇宙安全保障"
  const afterSchedule = name.replace(/^\d+-\d+\s*春/, '').replace(/\[[^\]]*\]/g, '').trim()
  const parts = afterSchedule.split(/\s{2,}|　/)
  const teacher = parts[0] || ''
  const subject = parts.slice(1).join(' ').trim() || afterSchedule

  return { slots, room, teacher, subject }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { apiToken } = await request.json()

    if (!apiToken) {
      return NextResponse.json({ error: 'APIトークンが必要です' }, { status: 400 })
    }

    // Canvas APIからコース一覧を取得
    const response = await fetch('https://lms.keio.jp/api/v1/courses?enrollment_state=active&per_page=50', {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'K-LMSからコース情報の取得に失敗しました。APIトークンを確認してください。' }, { status: 400 })
    }

    const courses = await response.json()

    // 各コースの時間割情報をパース
    const timetableEntries: {
      day: string
      period: number
      name: string
      room: string
      teacher: string
      courseId: number
    }[] = []

    for (const course of courses) {
      const parsed = parseCourseSchedule(course.name)
      if (!parsed) continue

      for (const slot of parsed.slots) {
        timetableEntries.push({
          day: slot.day,
          period: slot.period,
          name: parsed.subject,
          room: parsed.room,
          teacher: parsed.teacher,
          courseId: course.id,
        })
      }
    }

    return NextResponse.json({
      success: true,
      courses: courses.map((c: any) => ({ id: c.id, name: c.name })),
      timetable: timetableEntries,
    })

  } catch (error: any) {
    console.error('KLMS courses error:', error)
    return NextResponse.json(
      { error: error.message || 'コース取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
