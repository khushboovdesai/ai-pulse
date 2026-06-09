#!/usr/bin/env python3
"""AI Pulse daily brief curation script.

Fetches headlines from public feeds and uses the Google Gemini API
to summarize, translate, and format kid-friendly updates.
"""

import json
import os
import sys
from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET
import requests
import google.generativeai as genai

# Feeds to aggregate raw AI updates from
FEED_URLS = [
    "https://hnrss.org/frontpage?q=AI",
    "https://news.google.com/rss/search?q=Artificial+Intelligence&hl=en-US&gl=US&ceid=US:en"
]

# Database target paths
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "brief.json")

GEMINI_PROMPT_TEMPLATE = """
You are a friendly, encouraging AI educator. You are curating the daily brief for "AI Pulse", a portal designed for kids, young learners, and tech-curious youth.
Your job is to read the raw feed items below, select the most exciting and important updates, and output a validated JSON schema.

RULES:
1. CURATE AND BALANCE SENTIMENT: Make updates encouraging, inspiring, and balanced. Avoid extreme doom-mongering, fear-based narratives, or complex financial/regulatory jargon.
2. SIMPLIFIED EXPLANATIONS: Explain everything using simple terminology and analogies suitable for a middle-school/teen reader.
3. QUANTITY: Select exactly the 3 most exciting and important news items for 'growth_news', and exactly the 3 most exciting items for 'tech_news'.
4. OUTPUT STRUCTURE: You must output a JSON object containing the fields below. Do not include markdown code block formatting (such as ```json) or any pre/post text. Return ONLY the raw JSON string.

TARGET SCHEMA FORMAT:
{{
  "updated_at": "ISO-8601 current timestamp string",
  "growth_news": [
    {{
      "id": "growth-1",
      "title": "Short exciting title (e.g., AI helps save dolphins)",
      "description": "2-3 sentences explaining the news simply and why it is great for the world.",
      "source": "Name of news publisher",
      "url": "Valid link from the feed"
    }}
  ],
  "tech_news": [
    {{
      "id": "tech-1",
      "title": "Exciting tech title (e.g., Computer chips copy brain cells)",
      "description": "2-3 sentences explaining what technology was created and how it works using a simple analogy.",
      "source": "Publisher name",
      "url": "Valid link from the feed"
    }}
  ],
  "jargons": [
     // List of 5 standard AI terms (Neural Network, Self-Attention, RAG, Reinforcement Learning, Fine-Tuning)
     // Tailor their definitions/examples for children.
     {{
       "id": "neural_network",
       "term": "Neural Network",
       "definition": "Simple definition.",
       "example": "Friendly analogy.",
       "use_case": "Real world use."
     }}
  ],
  "tools": [
     // Curate 5 trending popular tools (Cursor, NotebookLM, v0, Midjourney, ElevenLabs, etc.)
     {{
       "id": "tool-1",
       "name": "Tool Name",
       "tagline": "Catchy 3-word tagline",
       "trending_factor": "Why kids/creators love it.",
       "url": "Website link"
     }}
  ],
  "models": [
     // List 5 famous models (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, Llama 3 70B, Mistral Large 2)
     // Use realistic metrics: parameter counts, context limits, MMLU score, and API cost.
     {{
       "name": "Model Name",
       "developer": "Company",
       "parameters": "Size string (e.g., '70 Billion')",
       "context_window": 128000,
       "mmlu_score": 88.7,
       "cost_per_million": 3.00
     }}
  ],
  "courses": [
     // List 5 great machine learning / AI learning courses
     {{
       "title": "Course Title",
       "provider": "Platform name",
       "instructor": "Teacher",
       "level": "Beginner/Intermediate/Advanced",
       "duration": "Hours",
       "url": "Link"
     }}
  ],
  "blogs": [
     // List 5 high-quality AI blogs
     {{
       "title": "Blog article title",
       "author": "Writer name",
       "site": "Site name",
       "read_time": "Minutes",
       "url": "Link"
     }}
  ]
}}

RAW FEED DATA TO PARSE:
{raw_feed_content}
"""


def fetch_raw_feed_items() -> List[Dict[str, str]]:
    """Download RSS feed XML and parse item titles and descriptions."""
    items = []
    headers = {"User-Agent": "AIPulseDailyScraper/1.0"}
    
    for url in FEED_URLS:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
            
            root = ET.fromstring(response.content)
            for item in root.findall(".//item")[:15]:
                title_elem = item.find("title")
                desc_elem = item.find("description")
                link_elem = item.find("link")
                
                title = title_elem.text if title_elem is not None else ""
                desc = desc_elem.text if desc_elem is not None else ""
                link = link_elem.text if link_elem is not None else "#"
                
                items.append({
                    "title": title,
                    "description": desc,
                    "url": link
                })
        except Exception as e:
            print(f"Error fetching feed {url}: {e}", file=sys.stderr)
            
    return items


def curate_with_gemini(feed_items: List[Dict[str, str]]) -> Optional[str]:
    """Call Google Gemini API to structure, summarize, and sanitize raw news."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY environment variable is missing.", file=sys.stderr)
        return None

    genai.configure(api_key=api_key)
    
    # Flatten feed items to text blocks
    feed_text = ""
    for idx, item in enumerate(feed_items):
        feed_text += f"[{idx}] Title: {item['title']}\nDesc: {item['description']}\nLink: {item['url']}\n\n"

    prompt = GEMINI_PROMPT_TEMPLATE.format(raw_feed_content=feed_text)

    try:
        # Use gemini-3.5-flash for rapid, lightweight summaries
        model = genai.GenerativeModel("gemini-3.5-flash")
        
        # Configure model to return JSON directly
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return response.text
    except Exception as e:
        print(f"Gemini API call encountered an error: {e}", file=sys.stderr)
        return None


def main() -> None:
    """Orchestrate curation and update data file."""
    print("AI Pulse Curation Pipeline started...")
    
    # 1. Fetch raw feeds
    feed_items = fetch_raw_feed_items()
    if not feed_items:
        print("No raw feed entries found to parse. Terminating pipeline.", file=sys.stderr)
        sys.exit(0)
        
    print(f"Aggregated {len(feed_items)} raw feed entries.")

    # 2. Call Gemini API to filter and structure
    json_payload_str = curate_with_gemini(feed_items)
    if not json_payload_str:
        print("Curation failed. Preserving existing database entries.", file=sys.stderr)
        sys.exit(0)

    # 3. Validate JSON structure
    try:
        parsed_data = json.loads(json_payload_str)
        # Ensure updated timestamp is set correctly
        import datetime
        parsed_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
        
        # Write back to file database
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
            
        print("Curation database file successfully updated!")
    except json.JSONDecodeError as jde:
        print(f"JSON validation failed: {jde}", file=sys.stderr)
        print("Raw payload output was:", file=sys.stderr)
        print(json_payload_str, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
