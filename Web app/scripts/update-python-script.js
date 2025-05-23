// This is a helper script to convert your Python script to work with the Next.js app
// You would run this manually, not as part of the web app

import fs from "fs"
import path from "path"

// Create the scripts directory if it doesn't exist
const scriptsDir = path.join(process.cwd(), "scripts")
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir)
}

// Create a modified version of the Python script that sends data to the webhook
const pythonScript = `
import requests
from bs4 import BeautifulSoup
import re
import time
import random
import json
from datetime import datetime, timedelta
import sys

BASE_URL = "https://opportunitydesk.org"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/15.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

def random_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive"
    }

def safe_get(session, url, max_retries=5):
    for i in range(max_retries):
        try:
            response = session.get(url, headers=random_headers(), timeout=30)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Attempt {i + 1} failed for {url}: {e}")
            time.sleep((2 ** i) + random.uniform(2, 4))  # Exponential backoff
    return None

def extract_detail_info(session, detail_url):
    response = safe_get(session, detail_url)
    if not response:
        return None, None, None, None

    soup = BeautifulSoup(response.text, "html.parser")

    more_info_link = None
    deadline = None
    thumbnail_url = None
    description = None

    # Extract more info link and deadline from paragraphs
    for p in soup.find_all("p"):
        text = p.get_text(strip=True).lower()

        # More info link usually in paragraph mentioning 'for more information'
        if "for more information" in text:
            a_tag = p.find("a", href=True)
            if a_tag:
                more_info_link = a_tag['href']

        # Deadline often in strong tags inside paragraphs
        strong_tag = p.find("strong")
        if strong_tag and "deadline:" in strong_tag.get_text(strip=True).lower():
            match = re.search(r"deadline:\\s*(.*)", strong_tag.get_text(strip=True), re.IGNORECASE)
            if match:
                deadline = match.group(1).strip()

    # Extract thumbnail image URL from <figure class="image-link"><img src=...>
    figure = soup.find("figure", class_="image-link")
    if figure:
        img = figure.find("img")
        if img and img.has_attr("src"):
            thumbnail_url = img['src']

    # Extract description: Take first 2 paragraphs from the main content area
    content_div = soup.find("div", class_="entry-content")
    if content_div:
        paragraphs = content_div.find_all("p", recursive=False)  # direct children only
        if paragraphs:
            raw_description = " ".join(p.get_text(strip=True) for p in paragraphs[:2])
            # Remove any leading "Deadline: ..." from description start
            raw_description = re.sub(r"^deadline:\\s*[^.]*\\.?\\s*", "", raw_description, flags=re.IGNORECASE)
            description = raw_description

    # If no more info link found, fallback to detail URL
    if not more_info_link:
        more_info_link = detail_url

    time.sleep(random.uniform(5, 10))  # Slow down between detail pages
    return more_info_link, deadline, thumbnail_url, description

def fetch_opportunities_by_date(target_date, webhook_url=None, webhook_secret=None):
    """
    target_date format: 'YYYY/MM/DD'
    """
    all_opportunities = []
    session = requests.Session()

    url = f"{BASE_URL}/{target_date}/"
    print(f"\\nFetching opportunities for date URL: {url}")

    page_response = safe_get(session, url)
    if not page_response:
        print(f"❌ Error fetching {url}")
        return all_opportunities

    soup = BeautifulSoup(page_response.text, "html.parser")
    articles = soup.select("article")
    print(f"✅ Found {len(articles)} articles for {target_date}")

    for idx, article in enumerate(articles, start=1):
        try:
            title_link = article.find("a", string=True, href=True)
            if not title_link:
                print(f"⚠️ No title link found in article #{idx}, skipping...")
                continue

            title = title_link.get_text(strip=True)
            detail_url = title_link['href']

            (link, deadline, thumbnail, description) = extract_detail_info(session, detail_url)

            opportunity = {
                "title": title,
                "link": link,
                "deadline": deadline,
                "thumbnail": thumbnail,
                "description": description,
            }
            
            all_opportunities.append(opportunity)

            print(f"Title: {title}")
            print(f"Link: {link}")
            print(f"Deadline: {deadline}")
            print(f"Thumbnail: {thumbnail}")
            print(f"Description: {description}")
            print("-" * 40)
            
            # Send to webhook if provided
            if webhook_url:
                try:
                    headers = {"Content-Type": "application/json"}
                    if webhook_secret:
                        headers["Authorization"] = f"Bearer {webhook_secret}"
                        
                    response = requests.post(
                        webhook_url,
                        json=opportunity,
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        print(f"✅ Successfully sent to webhook: {title}")
                    else:
                        print(f"❌ Failed to send to webhook: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"❌ Error sending to webhook: {e}")

        except Exception as e:
            print(f"❌ Error parsing article #{idx}: {e}")

    return all_opportunities

def save_to_json(opportunities, date_str):
    filename = f"opportunities_{date_str}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(opportunities, f, ensure_ascii=False, indent=2)
    print(f"\\n✅ Saved {len(opportunities)} opportunities to '{filename}'")

if __name__ == "__main__":
    # Get target date from command line argument or use yesterday
    if len(sys.argv) > 1:
        target_date = sys.argv[1]
        date_format = "%Y/%m/%d"
        try:
            # Validate date format
            datetime.strptime(target_date, date_format)
        except ValueError:
            print(f"Invalid date format. Please use {date_format}")
            sys.exit(1)
    else:
        # Calculate yesterday's date
        yesterday = datetime.now() - timedelta(days=1)
        target_date = yesterday.strftime("%Y/%m/%d")  # Format for URL path
    
    date_str = target_date.replace("/", "-")  # Format for filename
    
    # Set your webhook URL here
    webhook_url = "http://localhost:3000/api/webhook"  # Change to your actual webhook URL
    webhook_secret = "your-secret-key"  # Change to your actual secret key
    
    print(f"Scraping opportunities posted on: {target_date}")

    opportunities = fetch_opportunities_by_date(target_date, webhook_url, webhook_secret)
    if opportunities:
        save_to_json(opportunities, date_str)
    else:
        print("No opportunities found for the given date.")
`

// Write the Python script to the scripts directory
fs.writeFileSync(path.join(scriptsDir, "scraper.py"), pythonScript)

console.log("Python script updated and saved to scripts/scraper.py")
