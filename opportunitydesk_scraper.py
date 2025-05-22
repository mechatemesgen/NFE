import requests
from bs4 import BeautifulSoup
import re
import time
import random
import csv
from datetime import datetime, timedelta

BASE_URL = "https://opportunitydesk.org"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
            time.sleep((2 ** i) + random.uniform(2, 4))
    return None

def extract_detail_info(session, detail_url):
    response = safe_get(session, detail_url)
    if not response:
        return [None] * 10  # return 10 None values

    soup = BeautifulSoup(response.text, "html.parser")

    more_info_link = None
    deadline = None
    thumbnail_url = None
    description = None
    organizer = None
    location = None
    eligibility = None
    benefits = None
    category = None

    # --- Find deadline and more info ---
    for p in soup.find_all("p"):
        text = p.get_text(strip=True).lower()

        if "for more information" in text:
            a_tag = p.find("a", href=True)
            if a_tag:
                more_info_link = a_tag['href']

        strong_tag = p.find("strong")
        if strong_tag and "deadline:" in strong_tag.get_text(strip=True).lower():
            match = re.search(r"deadline:\s*(.*)", strong_tag.get_text(strip=True), re.IGNORECASE)
            if match:
                deadline = match.group(1).strip()

    # --- Thumbnail ---
    figure = soup.find("figure", class_="image-link")
    if figure:
        img = figure.find("img")
        if img and img.has_attr("src"):
            thumbnail_url = img['src']

    # --- Description, Eligibility, Benefits, Category ---
    content_div = soup.find("div", class_="entry-content")
    if content_div:
        paragraphs = content_div.find_all("p", recursive=False)
        if paragraphs:
            raw_description = " ".join(p.get_text(strip=True) for p in paragraphs[:2])
            raw_description = re.sub(r"^deadline:\s*[^.]*\.?\s*", "", raw_description, flags=re.IGNORECASE)
            description = (raw_description[:197] + "... read more") if len(raw_description) > 200 else raw_description

        full_text = content_div.get_text(separator="\n").lower()

        # Eligibility
        for p in content_div.find_all("p"):
            if any(keyword in p.get_text(strip=True).lower() for keyword in ["eligibility", "who can apply", "eligible applicants"]):
                eligibility = p.get_text(strip=True)
                break

        # Benefits
        for p in content_div.find_all("p"):
            if any(keyword in p.get_text(strip=True).lower() for keyword in ["benefits", "what you get", "award", "prize"]):
                benefits = p.get_text(strip=True)
                break

        # Category
        for p in content_div.find_all("p"):
            if "category" in p.get_text(strip=True).lower():
                category = p.get_text(strip=True)
                break

    # --- Organizer ---
    organizer_candidates = []
    content_text = content_div.get_text(separator="\n").split("\n") if content_div else []
    for line in content_text:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in ["organized by", "organizer:", "hosted by"]):
            match = re.search(r"(organized by|organizer:|hosted by)\s*[:\-]?\s*(.+)", line, re.IGNORECASE)
            if match:
                org = match.group(2).strip()
                if org:
                    organizer_candidates.append(org)
    if organizer_candidates:
        organizer = organizer_candidates[0]

    # --- Location (basic keyword guess) ---
    locations = ["kenya", "east africa", "africa", "global", "worldwide"]
    text_all = content_div.get_text(separator=" ").lower() if content_div else ""
    for loc in locations:
        if loc in text_all:
            location = loc.title()
            break

    if not more_info_link:
        more_info_link = detail_url

    time.sleep(random.uniform(5, 10))  # Polite scraping delay
    return more_info_link, deadline, thumbnail_url, description, organizer, location, eligibility, benefits, category

def fetch_opportunities_by_date(target_date):
    all_opportunities = []
    session = requests.Session()

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

            link, deadline, thumbnail, description, organizer, location, eligibility, benefits, category = extract_detail_info(session, detail_url)
            if not link:
                link = detail_url

            all_opportunities.append({
                "title": title,
                "link": link,
                "deadline": deadline,
                "thumbnail": thumbnail,
                "description": description,
                "organizer": organizer,
                "location": location,
                "eligibility": eligibility,
                "benefits": benefits,
                "category": category,
            })

            print(f"\nTitle: {title}")
            print(f"Link: {link}")
            print(f"Deadline: {deadline}")
            print(f"Thumbnail: {thumbnail}")
            print(f"Description: {description}")
            print(f"Organizer: {organizer}")
            print(f"Location: {location}")
            print(f"Eligibility: {eligibility}")
            print(f"Benefits: {benefits}")
            print(f"Category: {category}")
            print("-" * 40)

        except Exception as e:
            print(f"❌ Error parsing article #{idx}: {e}")

    return all_opportunities

def save_to_csv(opportunities, date_str):
    filename = f"opportunities_{date_str}.csv"
    with open(filename, mode='w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['title', 'link', 'deadline', 'thumbnail', 'description', 'organizer', 'location', 'eligibility', 'benefits', 'category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for opp in opportunities:
            writer.writerow(opp)

    print(f"\n✅ Saved {len(opportunities)} opportunities to '{filename}'")

if __name__ == "__main__":
    yesterday = datetime.now() - timedelta(days=1)
    target_date = yesterday.strftime("%Y/%m/%d")
    date_str = yesterday.strftime("%Y-%m-%d")

    print(f"Scraping opportunities posted on: {date_str}")
    opportunities = fetch_opportunities_by_date(target_date)
    if opportunities:
        save_to_csv(opportunities, date_str)
    else:
        print("No opportunities found for the given date.")
