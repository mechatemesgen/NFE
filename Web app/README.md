# Opportunity Desk Scraper

A complete solution for scraping, managing, and posting opportunities from OpportunityDesk.org to your Telegram channel.

## Features

- 🔍 **Automated Scraping**: Scrape opportunities from OpportunityDesk.org
- 💾 **Database Storage**: Store opportunities in Supabase
- ✅ **Approval Workflow**: Review and approve opportunities before posting
- 📱 **Telegram Integration**: Post approved opportunities to your Telegram channel
- ⏱️ **Scheduled Posting**: Automatically post opportunities on a schedule
- 🔄 **Duplicate Detection**: Avoid duplicate opportunities

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.7+ with pip
- Supabase account (already set up)
- Telegram Bot (already set up)

### Installation

1. **Clone the repository**

2. **Install Node.js dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Install Python dependencies**
   \`\`\`bash
   pip install requests beautifulsoup4 supabase python-dotenv
   \`\`\`

4. **Environment Variables**
   The following environment variables should be set in your Vercel project:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `TELEGRAM_CHANNEL_ID`: Your Telegram channel ID
   - `CRON_SECRET`: Secret for securing cron endpoints
   - `NEXT_PUBLIC_CRON_SECRET`: Same as CRON_SECRET, but accessible in the browser

### Usage

#### Initialize Database

1. Visit the `/setup` page in your application
2. Click the "Initialize Database" button to create the necessary tables

#### Manual Scraping

1. Click the "Scrape New Data" button on the dashboard
2. Wait for the scraping process to complete
3. Refresh the page to see the new opportunities

#### Running the Python Script Directly

\`\`\`bash
python scripts/opportunity_scraper.py
\`\`\`

To scrape a specific date:
\`\`\`bash
python scripts/opportunity_scraper.py 2024/01/15
\`\`\`

#### Approving and Posting Opportunities

1. Browse the opportunities on the dashboard
2. Click "Approve" on opportunities you want to post
3. Click "Post to Telegram" on approved opportunities

#### Automatic Scheduling

The application includes two cron jobs:
- Daily scraping at 6:00 AM UTC
- Daily posting at 12:00 PM UTC

You can modify these schedules in the `vercel.json` file.

## Project Structure

- `/app`: Next.js application routes
- `/components`: React components
- `/lib`: Utility functions and server actions
- `/scripts`: Python scripts for scraping

## Customization

### Telegram Message Format

You can customize the Telegram message format in `lib/actions.ts` by modifying the `formatTelegramMessage` function.

### Scraping Logic

The scraping logic is contained in `scripts/opportunity_scraper.py`. You can modify this file to change how opportunities are scraped.

### Scheduling

Modify the cron schedules in `vercel.json` to change when scraping and posting occur.

## Troubleshooting

### Database Issues

If you encounter database errors:
1. Visit the `/setup` page
2. Click "Initialize Database" to recreate the tables

### Scraping Issues

If scraping fails:
1. Check the console logs for error messages
2. Verify that your Python environment is set up correctly
3. Try running the Python script directly to see detailed error messages

### Telegram Issues

If posting to Telegram fails:
1. Verify your bot token and channel ID
2. Make sure your bot has permission to post to the channel
3. Check that your message format is valid HTML

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

Now, let's create a simple guide component to help users get started:
