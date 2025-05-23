"use server"

import { createServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function approveOpportunity(id: number) {
  const supabase = createServerClient()

  const { error } = await supabase.from("opportunities").update({ approved: true }).eq("id", id)

  if (error) {
    console.error("Error approving opportunity:", error)
    throw new Error("Failed to approve opportunity")
  }

  revalidatePath("/")
  return { success: true }
}

export async function postToTelegram(id: number) {
  const supabase = createServerClient()

  // 1. Get the opportunity data
  const { data: opportunity, error: fetchError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !opportunity) {
    console.error("Error fetching opportunity:", fetchError)
    throw new Error("Failed to fetch opportunity")
  }

  // 2. Get Telegram Bot Token from settings (you'll need to add this)
  // For now, we'll use an environment variable
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID

  if (!botToken || !channelId) {
    throw new Error("Telegram bot token or channel ID not configured")
  }

  try {
    // 3. Format the message for Telegram
    const message = formatTelegramMessage(opportunity)

    // 4. Send to Telegram
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
        disable_web_page_preview: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`)
    }

    // 5. Update the opportunity as posted
    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ posted_to_telegram: true })
      .eq("id", id)

    if (updateError) {
      throw new Error(`Failed to update opportunity status: ${updateError.message}`)
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error posting to Telegram:", error)
    throw error
  }
}

function formatTelegramMessage(opportunity: any) {
  // Format the message according to the user's requirements
  // thumbnail as caption, title in bold, description, deadline in bold,
  // apply now CTA link, Join Us CTA with telegram channel link

  const title = opportunity.title ? `<b>${opportunity.title}</b>` : ""
  const description = opportunity.description || ""
  const deadline = opportunity.deadline ? `\n\n<b>Deadline:</b> ${opportunity.deadline}` : ""
  const applyLink = opportunity.link ? `\n\n🔗 <a href="${opportunity.link}">Apply Now</a>` : ""
  const joinUsLink = `\n\n📢 <a href="https://t.me/your_channel_username">Join Us</a>`

  // Add hashtags for better discoverability
  const tags = "\n\n#Opportunities #Scholarships #Grants #Education #Career"

  // Combine all parts with proper spacing
  return `${title}\n\n${description}${deadline}${applyLink}${joinUsLink}${tags}`
}

export async function refreshData() {
  // This function would trigger your Python script to run
  // For now, we'll just revalidate the path
  revalidatePath("/")
  return { success: true }
}
