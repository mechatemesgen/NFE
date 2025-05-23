import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

export default function GettingStartedGuide() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Getting Started</AlertTitle>
        <AlertDescription>Follow this guide to set up and use your Opportunity Desk Scraper.</AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Step 1: Initialize Database</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p>Before you can use the application, you need to initialize the database tables.</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Visit the <code>/setup</code> page in your application
                </li>
                <li>Click the &quot;Initialize Database&quot; button</li>
                <li>Wait for confirmation that the tables have been created</li>
              </ol>
              <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success Indicator</AlertTitle>
                <AlertDescription>
                  You&apos;ll see a green checkmark when the database is initialized successfully.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Step 2: Scrape Opportunities</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p>You can scrape opportunities in two ways:</p>
              <h4 className="font-medium">Option 1: Using the Dashboard</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to the dashboard</li>
                <li>Click the &quot;Scrape New Data&quot; button</li>
                <li>Wait for the scraping process to complete</li>
                <li>The page will refresh automatically to show new opportunities</li>
              </ol>

              <h4 className="font-medium">Option 2: Running the Python Script Directly</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">python scripts/opportunity_scraper.py</pre>
              <p>To scrape a specific date:</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                python scripts/opportunity_scraper.py 2024/01/15
              </pre>

              <Alert variant="warning" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  The Python script requires the necessary environment variables to be set.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>Step 3: Approve and Post Opportunities</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p>After scraping, you need to approve opportunities before posting them to Telegram:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Browse the opportunities on the dashboard</li>
                <li>Click &quot;Approve&quot; on opportunities you want to post</li>
                <li>Click &quot;Post to Telegram&quot; on approved opportunities</li>
              </ol>
              <p>You can filter opportunities by status using the tabs at the top of the list.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>Step 4: Set Up Automatic Scheduling</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p>The application includes two cron jobs:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Daily scraping at 6:00 AM UTC</li>
                <li>Daily posting at 12:00 PM UTC</li>
              </ul>
              <p>
                These are configured in the <code>vercel.json</code> file:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {`{
  "crons": [
    {
      "path": "/api/scrape?secret=your-cron-secret",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/telegram?secret=your-cron-secret",
      "schedule": "0 12 * * *"
    }
  ]
}`}
              </pre>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Customization</AlertTitle>
                <AlertDescription>
                  You can modify these schedules to fit your needs. The format is standard cron syntax.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>Troubleshooting</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h4 className="font-medium">Database Issues</h4>
              <p>If you encounter database errors:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Visit the <code>/setup</code> page
                </li>
                <li>Click &quot;Initialize Database&quot; to recreate the tables</li>
              </ol>

              <h4 className="font-medium">Scraping Issues</h4>
              <p>If scraping fails:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Check the console logs for error messages</li>
                <li>Verify that your Python environment is set up correctly</li>
                <li>Try running the Python script directly to see detailed error messages</li>
              </ol>

              <h4 className="font-medium">Telegram Issues</h4>
              <p>If posting to Telegram fails:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Verify your bot token and channel ID</li>
                <li>Make sure your bot has permission to post to the channel</li>
                <li>Check that your message format is valid HTML</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
