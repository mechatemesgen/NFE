import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { postToTelegram } from "@/lib/actions"

// This endpoint is specifically for posting to Telegram on a schedule
export async function GET(request: Request) {
  try {
    // Check for a secret key to secure the endpoint
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClient()

    // Get the current schedule from settings
    const { data: scheduleSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "telegram_post_schedule")
      .single()

    // Check if it's time to post based on the schedule
    // For simplicity, we'll just post whenever this endpoint is called
    // In a real app, you'd check the cron schedule against the current time

    // Get approved but not posted opportunities
    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("approved", true)
      .eq("posted_to_telegram", false)
      .order("created_at", { ascending: true })
      .limit(1) // Post one at a time to avoid flooding

    if (error) {
      console.error("Error fetching opportunities:", error)
      return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 })
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({ message: "No approved opportunities to post" })
    }

    // Post the opportunity to Telegram
    try {
      await postToTelegram(opportunities[0].id)
      return NextResponse.json({
        success: true,
        posted: opportunities[0].title,
      })
    } catch (error) {
      console.error(`Error posting opportunity:`, error)
      return NextResponse.json(
        {
          error: "Failed to post to Telegram",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in Telegram cron job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
