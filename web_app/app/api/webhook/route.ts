import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

// This endpoint can be called by your Python script to add new opportunities
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate the incoming data
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if the opportunities table exists
    const { error: tableCheckError } = await supabase.from("opportunities").select("id").limit(1).maybeSingle()

    // If we get a "relation does not exist" error, the table doesn't exist yet
    const tableDoesNotExist =
      tableCheckError?.message?.includes("relation") && tableCheckError?.message?.includes("does not exist")

    if (tableDoesNotExist) {
      return NextResponse.json(
        {
          error: "Database tables not initialized",
          message: "Please visit the setup page to initialize your database tables",
        },
        { status: 500 },
      )
    }

    // Insert the opportunity into the database
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .insert({
        title: data.title,
        description: data.description || null,
        link: data.link || null,
        deadline: data.deadline || null,
        thumbnail: data.thumbnail || null,
        approved: false,
        posted_to_telegram: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting opportunity:", error)
      return NextResponse.json({ error: "Failed to insert opportunity" }, { status: 500 })
    }

    return NextResponse.json({ success: true, opportunity })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
