import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'ログインセッションが切れています。ページを再読み込みしてください。' }, { status: 401 })
    }

    const { apiToken } = await request.json()

    if (!apiToken) {
      return NextResponse.json({ error: 'APIトークンが必要です' }, { status: 400 })
    }

    // 1. 全履修コースを取得
    const coursesRes = await fetch(
      'https://lms.keio.jp/api/v1/courses?enrollment_state=active&per_page=50',
      { headers: { 'Authorization': `Bearer ${apiToken}` } }
    )

    if (!coursesRes.ok) {
      return NextResponse.json(
        { error: 'K-LMSからコース情報の取得に失敗しました。APIトークンを確認してください。' },
        { status: 400 }
      )
    }

    const courses = await coursesRes.json()

    // 2. 各コースの課題を取得
    let todosAdded = 0
    let eventsAdded = 0
    let skipped = 0
    let totalAssignments = 0

    for (const course of courses) {
      // コース名から科目名を抽出
      const courseName = extractCourseName(course.name)

      const assignmentsRes = await fetch(
        `https://lms.keio.jp/api/v1/courses/${course.id}/assignments?per_page=100&order_by=due_at`,
        { headers: { 'Authorization': `Bearer ${apiToken}` } }
      )

      if (!assignmentsRes.ok) continue

      const assignments = await assignmentsRes.json()
      if (!Array.isArray(assignments)) continue

      for (const assignment of assignments) {
        totalAssignments++

        const title = assignment.name
        const dueAt = assignment.due_at
        const description = assignment.description
          ? assignment.description.replace(/<[^>]*>/g, '').substring(0, 500)
          : ''
        const url = assignment.html_url || ''

        if (!dueAt) {
          skipped++
          continue
        }

        const deadline = new Date(dueAt)
        const todoTitle = `${title} [${courseName}]`
        const todoDescription = `[KLMS] ${description}\n${url}`.trim()

        // Todo に追加（重複チェック）
        const { data: existingTodo } = await supabase
          .from('todos')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', todoTitle)
          .eq('deadline', deadline.toISOString())
          .single()

        if (!existingTodo) {
          const { error: todoError } = await supabase
            .from('todos')
            .insert({
              user_id: user.id,
              title: todoTitle,
              description: todoDescription,
              deadline: deadline.toISOString(),
              priority: 'high',
              is_completed: false,
            })

          if (!todoError) todosAdded++
        }

        // カレンダーイベントにも追加（重複チェック）
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', todoTitle)
          .eq('start_date', deadline.toISOString())
          .single()

        if (!existingEvent) {
          const { error: eventError } = await supabase
            .from('calendar_events')
            .insert({
              user_id: user.id,
              title: todoTitle,
              description: `[KLMS] ${description}`,
              start_date: deadline.toISOString(),
              end_date: deadline.toISOString(),
              is_visible: true,
            })

          if (!eventError) eventsAdded++
        } else {
          skipped++
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        todos_added: todosAdded,
        events_added: eventsAdded,
        skipped,
        total: totalAssignments,
        courses: courses.length,
      }
    })

  } catch (error: any) {
    console.error('KLMS assignments sync error:', error)
    return NextResponse.json(
      { error: error.message || '課題取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// コース名から科目名を抽出
// "3-22 春[火2]福島 康仁　宇宙安全保障 [湘南藤沢 τ11]" → "宇宙安全保障"
function extractCourseName(fullName: string): string {
  // 番号と学期を除去
  let name = fullName.replace(/^\d+-\d+\s*春?\s*/, '')
  // [曜日時限] を除去
  name = name.replace(/\[[月火水木金土他][^\]]*\]/, '')
  // [教室] を除去
  name = name.replace(/\[(SFC|湘南藤沢)\s*[^\]]*\]/, '')
  // 教員名と科目名を分離（全角スペースまたは2つ以上のスペースで区切り）
  const parts = name.trim().split(/\s{2,}|　/)
  // 教員名の後の部分を科目名とする
  if (parts.length >= 2) {
    return parts.slice(1).join(' ').trim()
  }
  return name.trim()
}
