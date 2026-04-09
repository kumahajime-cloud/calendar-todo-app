import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ICAL from 'ical.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { calendarUrl } = await request.json()

    if (!calendarUrl) {
      return NextResponse.json({ error: 'カレンダーURLが必要です' }, { status: 400 })
    }

    // iCalデータを取得
    const response = await fetch(calendarUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'カレンダーデータの取得に失敗しました' }, { status: 400 })
    }

    const icalData = await response.text()

    // iCalデータをパース
    const jcalData = ICAL.parse(icalData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    let added = 0
    let skipped = 0

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)

      const title = event.summary
      const description = event.description || ''
      const startDate = event.startDate.toJSDate()
      const endDate = event.endDate?.toJSDate() || startDate

      // 既存のイベントをチェック
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', title)
        .eq('start_date', startDate.toISOString())
        .single()

      if (existing) {
        skipped++
        continue
      }

      // カレンダーイベントとして保存
      const { error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title,
          description,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_visible: true,
        })

      if (error) {
        console.error('Error inserting event:', error)
        skipped++
      } else {
        added++
      }
    }

    return NextResponse.json({
      success: true,
      results: { added, skipped, total: vevents.length }
    })

  } catch (error: any) {
    console.error('KLMS sync error:', error)
    return NextResponse.json(
      { error: error.message || '同期中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
