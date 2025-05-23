import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createServerClient } from "@/lib/supabase-server"

const execPromise = promisify(exec)

// This endpoint can be used to trigger your Python script
export async function POST(request: Request) {
  try {
    // Check for a secret key to secure the endpoint
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the date to scrape from the request body
    const { date } = await request.json()

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Execute the Python script
    // Note: This will only work if Python is installed on the server
    // For Vercel, you'll need to use a different approach
    const { stdout, stderr } = await execPromise(`python3 scripts/scraper.py ${date}`)

    if (stderr) {
      console.error("Python script error:", stderr)
      return NextResponse.json({ error: "Python script error", details: stderr }, { status: 500 })
    }

    // Update the last scrape date in settings
    const supabase = createServerClient()
    await supabase.from("settings").update({ value: new Date().toISOString() }).eq("key", "last_scrape_date")

    return NextResponse.json({ success: true, output: stdout })
  } catch (error) {
    console.error("Error executing Python script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
