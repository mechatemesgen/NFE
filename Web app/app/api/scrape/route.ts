import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function POST(request: Request) {
  try {
    // Check for authorization
    const authHeader = request.headers.get("authorization")
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date } = await request.json()

    // If no date provided, use yesterday
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0].replace(/-/g, "/")

    console.log(`Starting scrape for date: ${targetDate}`)

    // Set environment variables for the Python script
    const env = {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Execute the Python script
    const command = `python scripts/opportunity_scraper.py ${targetDate}`
    const { stdout, stderr } = await execPromise(command, { env })

    if (stderr && !stderr.includes("Warning")) {
      console.error("Python script error:", stderr)
      return NextResponse.json(
        {
          error: "Python script error",
          details: stderr,
          stdout: stdout,
        },
        { status: 500 },
      )
    }

    console.log("Python script output:", stdout)

    return NextResponse.json({
      success: true,
      message: "Scraping completed successfully",
      output: stdout,
      date: targetDate,
    })
  } catch (error) {
    console.error("Error executing scrape:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET endpoint for manual triggering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")
    const date = searchParams.get("date")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Trigger the scraping
    const response = await fetch(new URL("/api/scrape", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ date }),
    })

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in GET scrape endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
