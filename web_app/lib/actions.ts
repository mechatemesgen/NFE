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
    console.error("Error fetching opportunity. ID:", id, "Error details:", JSON.stringify(fetchError, null, 2));
    throw new Error("Failed to fetch opportunity")
  }

  // 2. Get Telegram Bot Token from settings (you'll need to add this)
  // For now, we'll use an environment variable
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID

  if (!botToken || !channelId) {
    console.error("Error: Telegram bot token or channel ID not configured in environment variables.")
    throw new Error("Telegram bot token or channel ID not configured")
  }

  try {
    // 3. Format the message for Telegram
    const message = formatTelegramMessage(opportunity)
    const caption = message; // Use the formatted message as caption

    // 4. Send to Telegram using sendPhoto if thumbnail exists
    if (opportunity.thumbnail) {
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`
      console.log("Attempting to send photo to Telegram API URL:", telegramApiUrl);
      const formData = new FormData();
      formData.append('chat_id', channelId);
      formData.append('photo', opportunity.thumbnail); // Send URL as photo
      formData.append('caption', caption.substring(0, 1024)); // Caption limit 1024 chars
      formData.append('parse_mode', 'HTML');
      formData.append('disable_web_page_preview', 'false');

      console.log("Request body (FormData for sendPhoto):", {
        chat_id: channelId,
        photo_url: opportunity.thumbnail,
        caption_snippet: caption.substring(0, 200) + "...",
        parse_mode: "HTML",
      });

      const response = await fetch(telegramApiUrl, {
        method: "POST",
        body: formData, // FormData handles multipart/form-data header automatically
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Telegram API (sendPhoto) responded with an error. Status:", response.status, "Response:", errorData);
        // Check for specific Telegram error messages if possible
        if (errorData.includes("Wrong type of an object") || errorData.includes("PHOTO_INVALID")) {
          throw new Error(`Telegram API error (sendPhoto): Invalid photo URL or format. Details: ${errorData}`);
        }
        try {
          const jsonData = JSON.parse(errorData);
          throw new Error(`Telegram API error (sendPhoto): ${JSON.stringify(jsonData)}`);
        } catch (e) {
          throw new Error(`Telegram API error (sendPhoto, non-JSON response): ${errorData}`);
        }
      }
    } else {
      // Fallback to sendMessage if no thumbnail
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
      console.log("Attempting to send message to Telegram API URL (no thumbnail):", telegramApiUrl);
      const response = await fetch(telegramApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: channelId,
          text: message, // Send full message as text
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Telegram API (sendMessage) responded with an error. Status:", response.status, "Response:", errorData);
        try {
          const jsonData = JSON.parse(errorData);
          throw new Error(`Telegram API error (sendMessage): ${JSON.stringify(jsonData)}`);
        } catch (e) {
          throw new Error(`Telegram API error (sendMessage, non-JSON response): ${errorData}`);
        }
      }
    }

    // 5. Update the opportunity as posted
    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ posted_to_telegram: true })
      .eq("id", id)

    if (updateError) {
      // It's important to know if the Telegram post succeeded but DB update failed
      console.error(`Successfully posted to Telegram, but failed to update opportunity status in DB. Opportunity ID: ${id}. Error: ${updateError.message}`);
      throw new Error(`Successfully posted to Telegram, but failed to update opportunity status: ${updateError.message}`)
    }

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error in postToTelegram function:", error);
    if (error.cause) {
      console.error("Cause of error:", error.cause);
    }

    let errorMessage = `Failed to post to Telegram: ${error.message}`;

    // Check for specific network errors
    if (error.message.includes("fetch failed")) {
        errorMessage = "Failed to connect to Telegram API. Please check your network connection and try again. (fetch failed)";
        if (error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
            if (error.cause.code === 'ECONNRESET') {
                errorMessage = "Connection to Telegram API was reset. This might be a temporary network issue. Please try again. (ECONNRESET)";
            } else if (error.cause.code === 'ENOTFOUND' || error.cause.code === 'EAI_AGAIN') {
                errorMessage = "Could not resolve Telegram API hostname. Please check your DNS settings and network connection. (ENOTFOUND/EAI_AGAIN)";
            }
        }
    } else if (error.message.includes("Invalid photo URL")) {
        errorMessage = `Failed to post to Telegram: The provided thumbnail URL is invalid or inaccessible. Details: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}

function formatTelegramMessage(opportunity: any) {
  // Format the message according to the user's requirements
  // thumbnail as caption, title in bold, description, deadline in bold,
  // apply now CTA link, Join Us CTA with telegram channel link

  const title = opportunity.title ? `<b>${opportunity.title}</b>` : ""
  const description = opportunity.description || ""
  const deadline = opportunity.deadline ? `\n\n<b>Deadline:</b> ${opportunity.deadline}` : ""
  const applyLink = opportunity.link ? `\n\n📨 <a href="${opportunity.link}"><b>Apply Now</b></a>` : ""
  const joinUsLink = `\n\n✅ <a href="https://t.me/Scholarship_Spot"><b>Join Us</b></a>`


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
