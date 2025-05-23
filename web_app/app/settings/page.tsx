import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TelegramSettings from "@/components/telegram-settings"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function SettingsPage() {
  const supabase = createServerClient()

  // Check if the settings table exists
  const { error: tableCheckError } = await supabase.from("settings").select("key").limit(1).maybeSingle()

  // If we get a "relation does not exist" error, the table doesn't exist yet
  const tableDoesNotExist =
    tableCheckError?.message?.includes("relation") && tableCheckError?.message?.includes("does not exist")

  if (tableDoesNotExist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Database Not Initialized</h1>
          <p className="text-lg mb-8">
            It looks like your database tables haven't been set up yet. Please visit the setup page to initialize your
            database.
          </p>
          <Button asChild size="lg">
            <Link href="/setup">Go to Setup</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Fetch current settings
  try {
    const { data: settings, error } = await supabase.from("settings").select("*")

    if (error) {
      console.error("Error fetching settings:", error)
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Error Loading Settings</h1>
            <p className="text-lg mb-8">
              There was a problem loading settings. Please try again or check your database connection.
            </p>
            <pre className="bg-gray-100 p-4 rounded text-left overflow-auto text-sm">{error.message}</pre>
            <div className="mt-6">
              <Button asChild>
                <Link href="/setup">Go to Setup</Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Convert settings array to an object for easier access
    const settingsMap = (settings || []).reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string | null>,
    )

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Settings</CardTitle>
              <CardDescription>Configure your Telegram bot and channel settings</CardDescription>
            </CardHeader>
            <CardContent>
              <TelegramSettings schedule={settingsMap.telegram_post_schedule || "0 12 * * *"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scraping Settings</CardTitle>
              <CardDescription>Configure your data scraping settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The Python script will handle scraping. Make sure it's configured to send data to the webhook endpoint:
              </p>
              <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
                <code>
                  POST {process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}
                  /api/webhook
                </code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Unexpected Error</h1>
          <p className="text-lg mb-8">An unexpected error occurred. Please try again or check your configuration.</p>
          <Button asChild>
            <Link href="/setup">Go to Setup</Link>
          </Button>
        </div>
      </div>
    )
  }
}
