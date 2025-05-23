#!/bin/bash

# Setup script for the Python scraper

echo "Setting up Python environment for Opportunity Desk Scraper..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install required packages
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Telegram Configuration (optional for Python script)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHANNEL_ID=your_telegram_channel_id_here
EOL
    echo "⚠️ Please update the .env file with your actual credentials"
else
    echo "✅ .env file already exists"
fi

echo "✅ Setup complete!"
echo ""
echo "To run the scraper manually:"
echo "  python3 scripts/opportunity_scraper.py"
echo ""
echo "To scrape a specific date:"
echo "  python3 scripts/opportunity_scraper.py 2024/01/15"
echo ""
echo "Don't forget to update your .env file with the correct credentials!"
