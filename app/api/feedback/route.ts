import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { feedback, userEmail } = await request.json()

    if (!feedback) {
      return NextResponse.json({ error: 'フィードバック内容が必要です' }, { status: 400 })
    }

    // メール送信の準備
    const emailBody = `
ベアカレンダー - 修正要望・フィードバック

【送信者メールアドレス】
${userEmail}

【フィードバック内容】
${feedback}

【送信日時】
${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
    `.trim()

    // Resend APIを使用してメール送信
    // 注: Resend APIキーが環境変数に設定されている必要があります
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set')
      // 本番環境ではエラーを返すが、開発環境ではログのみ
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'メール送信の設定がされていません' },
          { status: 500 }
        )
      } else {
        console.log('Development mode - Email would be sent:')
        console.log(emailBody)
        return NextResponse.json({
          success: true,
          message: 'フィードバックを受け付けました（開発モード）'
        })
      }
    }

    // Resend APIでメール送信
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ベアカレンダー <onboarding@resend.dev>',
        to: ['hajimeazb@gmail.com'],
        subject: 'ベアカレンダー - 修正要望・フィードバック',
        text: emailBody,
        reply_to: userEmail !== '未入力' ? userEmail : undefined,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Resend API error:', errorData)
      throw new Error('メール送信に失敗しました')
    }

    return NextResponse.json({
      success: true,
      message: 'フィードバックを送信しました'
    })

  } catch (error: any) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error.message || 'フィードバックの送信中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
