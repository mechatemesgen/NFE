import { NextResponse } from "next/server"

// This endpoint can be used to test your Telegram bot
export async function POST(request: Request) {
  try {
    const { botToken, channelId, message } = await request.json()

    if (!botToken || !channelId || !message) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    // Send a test message to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Telegram API error",
          details: result,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error testing Telegram bot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
