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
      return NextResponse.json({ error: 'ログインセッションが切れています。ページを再読み込みしてください。' }, { status: 401 })
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
    let todos_added = 0

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)

      const title = event.summary
      const rawDescription = event.description || ''
      const description = `[KLMS] ${rawDescription}`
      let startDate = event.startDate.toJSDate()
      let endDate = event.endDate?.toJSDate() || startDate

      // 終日イベント（VALUE=DATE）の場合、締切を当日23:59に設定
      const isAllDay = event.startDate.isDate
      if (isAllDay) {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 0)
        endDate = new Date(startDate)
      }

      // UIDやURLからassignmentかどうかを判定
      const uid = vevent.getFirstPropertyValue('uid') || ''
      const url = vevent.getFirstPropertyValue('url') || ''
      const isAssignment = String(uid).includes('assignment') || String(url).includes('assignment')

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
      } else {
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

      // assignment系イベントの場合、todoも作成
      if (isAssignment) {
        // 既存のtodoをチェック（title + deadline + user_id）
        const { data: existingTodo } = await supabase
          .from('todos')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', title)
          .eq('deadline', startDate.toISOString())
          .single()

        if (!existingTodo) {
          const { error: todoError } = await supabase
            .from('todos')
            .insert({
              user_id: user.id,
              title,
              description: `[KLMS] ${rawDescription}`,
              deadline: startDate.toISOString(),
              priority: 'high',
              is_completed: false,
            })

          if (todoError) {
            console.error('Error inserting todo:', todoError)
          } else {
            todos_added++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: { added, skipped, todos_added, total: vevents.length }
    })

  } catch (error: any) {
    console.error('KLMS sync error:', error)
    return NextResponse.json(
      { error: error.message || '同期中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
