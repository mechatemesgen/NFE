import requests
from bs4 import BeautifulSoup
import re
import time
import random
import json
import csv
from datetime import datetime, timedelta
import os
import sys
from supabase import create_client, Client

BASE_URL = "https://opportunitydesk.org"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/15.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")
    
    return create_client(url, key)

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
    tags = []

    # Extract more info link and deadline from paragraphs
    for p in soup.find_all("p"):
        text = p.get_text(strip=True).lower()

        # More info link usually in paragraph mentioning 'for more information'
        if "for more information" in text or "apply here" in text or "apply now" in text:
            a_tag = p.find("a", href=True)
            if a_tag:
                more_info_link = a_tag['href']

        # Deadline often in strong tags inside paragraphs
        strong_tag = p.find("strong")
        if strong_tag and "deadline:" in strong_tag.get_text(strip=True).lower():
            match = re.search(r"deadline:\s*(.*)", strong_tag.get_text(strip=True), re.IGNORECASE)
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
            raw_description = re.sub(r"^deadline:\s*[^.]*\.?\s*", "", raw_description, flags=re.IGNORECASE)
            description = raw_description
            
    # Extract tags/categories
    categories = soup.find_all("a", rel="category tag")
    if categories:
        tags = [cat.get_text(strip=True) for cat in categories]

    # If no more info link found, fallback to detail URL
    if not more_info_link:
        more_info_link = detail_url

    time.sleep(random.uniform(5, 10))  # Slow down between detail pages
    return more_info_link, deadline, thumbnail_url, description, tags

def clean_deadline(deadline_str):
    """Clean and standardize deadline format"""
    if not deadline_str:
        return None
        
    # Try to extract a date in various formats
    # This is a simplified version - you might need more patterns
    date_patterns = [
        r'(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4})',
        r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})',
        r'(\d{1,2}/\d{1,2}/\d{4})',
        r'(\d{4}-\d{2}-\d{2})'
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, deadline_str, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return deadline_str

def save_to_supabase(opportunity, supabase_client):
    """Save opportunity to Supabase database"""
    try:
        # Check if opportunity already exists (by title and link)
        existing = supabase_client.table("opportunities").select("id").eq("title", opportunity["title"]).execute()
        
        if existing.data:
            print(f"⚠️ Opportunity already exists: {opportunity['title']}")
            return False
        
        # Insert new opportunity
        result = supabase_client.table("opportunities").insert({
            "title": opportunity["title"],
            "description": opportunity["description"],
            "link": opportunity["link"],
            "deadline": opportunity["deadline"],
            "thumbnail": opportunity["thumbnail"],
            "tags": opportunity.get("tags", []),
            "approved": False,
            "posted_to_telegram": False
        }).execute()
        
        if result.data:
            print(f"✅ Saved to database: {opportunity['title']}")
            return True
        else:
            print(f"❌ Failed to save: {opportunity['title']}")
            return False
            
    except Exception as e:
        print(f"❌ Database error for {opportunity['title']}: {e}")
        return False

def fetch_opportunities_by_date(target_date, save_to_db=True):
    """
    target_date format: 'YYYY/MM/DD'
    """
    all_opportunities = []
    session = requests.Session()
    
    # Initialize Supabase client if saving to database
    supabase_client = None
    if save_to_db:
        try:
            supabase_client = get_supabase_client()
        except Exception as e:
            print(f"❌ Failed to initialize Supabase client: {e}")
            print("Continuing without database save...")
            save_to_db = False

    url = f"{BASE_URL}/{target_date}/"
    print(f"\nFetching opportunities for date URL: {url}")

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

            (link, deadline, thumbnail, description, tags) = extract_detail_info(session, detail_url)
            
            # Clean and standardize deadline format
            cleaned_deadline = clean_deadline(deadline)

            opportunity = {
                "title": title,
                "link": link,
                "deadline": cleaned_deadline,
                "thumbnail": thumbnail,
                "description": description,
                "tags": tags
            }
            
            all_opportunities.append(opportunity)

            print(f"Title: {title}")
            print(f"Link: {link}")
            print(f"Deadline: {cleaned_deadline}")
            print(f"Thumbnail: {thumbnail}")
            print(f"Description: {description[:100]}..." if description else "Description: None")
            print(f"Tags: {', '.join(tags)}")
            print("-" * 40)
            
            # Save to database if enabled
            if save_to_db and supabase_client:
                save_to_supabase(opportunity, supabase_client)

        except Exception as e:
            print(f"❌ Error parsing article #{idx}: {e}")

    return all_opportunities

def save_to_csv(opportunities, date_str):
    """Save opportunities to CSV file as backup"""
    filename = f"opportunities_{date_str}.csv"
    with open(filename, mode='w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['title', 'link', 'deadline', 'thumbnail', 'description', 'tags']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for opp in opportunities:
            # Convert tags list to string for CSV
            if 'tags' in opp and isinstance(opp['tags'], list):
                opp['tags'] = ', '.join(opp['tags'])
            writer.writerow(opp)

    print(f"\n✅ Saved {len(opportunities)} opportunities to '{filename}'")

def update_last_scrape_date(supabase_client):
    """Update the last scrape date in settings"""
    try:
        supabase_client.table("settings").upsert({
            "key": "last_scrape_date",
            "value": datetime.now().isoformat()
        }).execute()
        print("✅ Updated last scrape date")
    except Exception as e:
        print(f"⚠️ Failed to update last scrape date: {e}")

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
    
    print(f"Scraping opportunities posted on: {target_date}")
    print(f"Saving to database: {'Yes' if os.environ.get('SUPABASE_URL') else 'No (missing env vars)'}")

    opportunities = fetch_opportunities_by_date(target_date, save_to_db=True)
    
    if opportunities:
        # Always save CSV as backup
        save_to_csv(opportunities, date_str)
        
        # Update last scrape date if we have database access
        if os.environ.get('SUPABASE_URL'):
            try:
                supabase_client = get_supabase_client()
                update_last_scrape_date(supabase_client)
            except Exception as e:
                print(f"⚠️ Failed to update last scrape date: {e}")
        
        print(f"\n🎉 Successfully processed {len(opportunities)} opportunities!")
    else:
        print("No opportunities found for the given date.")
