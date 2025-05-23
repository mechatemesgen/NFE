import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { postToTelegram } from "@/lib/actions"

// This endpoint can be called by a cron job to automatically post approved opportunities
export async function GET(request: Request) {
  try {
    // Check for a secret key to secure the endpoint
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClient()

    // Get approved but not posted opportunities
    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("approved", true)
      .eq("posted_to_telegram", false)
      .order("created_at", { ascending: true })
      .limit(5) // Limit to 5 at a time to avoid rate limits

    if (error) {
      console.error("Error fetching opportunities:", error)
      return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 })
    }

    // Post each opportunity to Telegram
    const results = []
    for (const opportunity of opportunities || []) {
      try {
        await postToTelegram(opportunity.id)
        results.push({ id: opportunity.id, success: true })
      } catch (error) {
        console.error(`Error posting opportunity ${opportunity.id}:`, error)
        results.push({ id: opportunity.id, success: false, error: (error as Error).message })
      }

      // Add a small delay between posts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: true,
      posted: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
