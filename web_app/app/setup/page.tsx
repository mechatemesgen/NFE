import { createServerClient } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import GettingStartedGuide from "@/components/getting-started-guide"

export default async function SetupPage() {
  const supabase = createServerClient()

  // Function to initialize the database
  async function initializeDatabase() {
    "use server"

    const supabase = createServerClient()
    const success = true
    const errorMessage = ""

    try {
      // Create opportunities table using RPC
      const { error: opportunitiesError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS opportunities (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            link TEXT,
            deadline TEXT,
            thumbnail TEXT,
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            approved BOOLEAN DEFAULT FALSE,
            posted_to_telegram BOOLEAN DEFAULT FALSE
          )
        `,
      })

      if (opportunitiesError) {
        console.error("Error creating opportunities table:", opportunitiesError)
        // If RPC doesn't work, try alternative approach
        try {
          // Alternative: Try to create a dummy record to test if table exists
          const { error: testError } = await supabase.from("opportunities").select("id").limit(1).maybeSingle()

          if (testError && testError.message.includes("relation") && testError.message.includes("does not exist")) {
            // Table doesn't exist, we need to create it manually
            return {
              success: false,
              error:
                "Database tables need to be created manually. Please run the SQL commands in your Supabase dashboard.",
            }
          }
        } catch (altError) {
          console.error("Alternative check failed:", altError)
        }
      }

      // Create settings table using RPC
      const { error: settingsError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      })

      if (settingsError) {
        console.error("Error creating settings table:", settingsError)
      }

      // Insert default settings
      const { error: insertError } = await supabase.rpc("exec_sql", {
        sql: `
          INSERT INTO settings (key, value)
          VALUES 
            ('telegram_post_schedule', '0 12 * * *'),
            ('last_scrape_date', NULL)
          ON CONFLICT (key) DO NOTHING
        `,
      })

      if (insertError) {
        console.error("Error inserting default settings:", insertError)
        // Try to insert using regular insert method
        try {
          await supabase.from("settings").upsert([
            { key: "telegram_post_schedule", value: "0 12 * * *" },
            { key: "last_scrape_date", value: null },
          ])
        } catch (upsertError) {
          console.error("Upsert also failed:", upsertError)
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Unexpected error during database initialization:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during database initialization",
      }
    }
  }

  // Alternative initialization using direct SQL execution
  async function initializeDatabaseManual() {
    "use server"

    try {
      // Try to insert default settings to test if tables exist
      const supabase = createServerClient()

      // Test opportunities table
      const { error: oppTestError } = await supabase.from("opportunities").select("id").limit(1).maybeSingle()

      // Test settings table
      const { error: settingsTestError } = await supabase.from("settings").select("key").limit(1).maybeSingle()

      // If tables exist, insert default settings
      if (!settingsTestError || !settingsTestError.message.includes("does not exist")) {
        await supabase.from("settings").upsert([
          { key: "telegram_post_schedule", value: "0 12 * * *" },
          { key: "last_scrape_date", value: null },
        ])
      }

      return { success: true }
    } catch (error) {
      console.error("Manual initialization error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Manual initialization failed",
      }
    }
  }

  // Check if tables already exist
  const { error: opportunitiesTableError } = await supabase.from("opportunities").select("id").limit(1).maybeSingle()
  const { error: settingsTableError } = await supabase.from("settings").select("key").limit(1).maybeSingle()

  const opportunitiesTableExists =
    !opportunitiesTableError ||
    !opportunitiesTableError.message.includes("relation") ||
    !opportunitiesTableError.message.includes("does not exist")

  const settingsTableExists =
    !settingsTableError ||
    !settingsTableError.message.includes("relation") ||
    !settingsTableError.message.includes("does not exist")

  const tablesExist = opportunitiesTableExists && settingsTableExists

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Setup Opportunity Desk</CardTitle>
            <CardDescription>Initialize your database and configure your application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-muted">
                <h3 className="font-medium mb-2">Database Initialization</h3>
                {tablesExist ? (
                  <div className="text-green-600 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check-circle"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>Database tables already exist</span>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Your database tables need to be created. You can either use the automatic setup or create them
                      manually in your Supabase dashboard.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Option 1: Automatic Setup</h4>
                        <form action={initializeDatabaseManual} className="mb-2">
                          <Button type="submit">Initialize Database</Button>
                        </form>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Option 2: Manual Setup</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          If automatic setup doesn't work, copy and run these SQL commands in your Supabase SQL Editor:
                        </p>
                        <div className="bg-gray-900 text-white p-4 rounded-md text-sm overflow-auto">
                          <pre>{`-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  deadline TEXT,
  thumbnail TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  posted_to_telegram BOOLEAN DEFAULT FALSE
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value)
VALUES 
  ('telegram_post_schedule', '0 12 * * *'),
  ('last_scrape_date', NULL)
ON CONFLICT (key) DO NOTHING;`}</pre>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Go to your{" "}
                          <a
                            href="https://supabase.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Supabase Dashboard
                          </a>{" "}
                          → SQL Editor → New Query, paste the above SQL, and click "Run".
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      {!opportunitiesTableExists && <div>• Opportunities table needs to be created</div>}
                      {!settingsTableExists && <div>• Settings table needs to be created</div>}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-md bg-muted">
                <h3 className="font-medium mb-2">Telegram Configuration</h3>
                <p className="mb-4">
                  Make sure you've set up your Telegram bot and added the required environment variables:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>TELEGRAM_BOT_TOKEN</li>
                  <li>TELEGRAM_CHANNEL_ID</li>
                  <li>CRON_SECRET</li>
                  <li>NEXT_PUBLIC_CRON_SECRET</li>
                </ul>
              </div>

              <div className="p-4 border rounded-md bg-muted">
                <h3 className="font-medium mb-2">Python Script Integration</h3>
                <p className="mb-4">Your Python script has been integrated with the application. You can:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Use the "Scrape New Data" button on the dashboard</li>
                  <li>
                    Run the script directly: <code>python scripts/opportunity_scraper.py</code>
                  </li>
                  <li>Set up automatic scraping with cron jobs</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" asChild disabled={!tablesExist}>
                <Link href="/settings">Settings</Link>
              </Button>
              <Button asChild>
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>

        <GettingStartedGuide />
      </div>
    </div>
  )
}
