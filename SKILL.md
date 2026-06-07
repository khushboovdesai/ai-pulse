# SKILL: AI Pulse Development Guidance

This file provides rules, instructions, and schemas for AI coding agents modifying or extending **AI Pulse**.

---

## 1. Project Stack Overview
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (Single-Page App). No React, Vue, Tailwind, or external layout builders.
- **Backend (Curation Script)**: Python 3.9+ executing `scripts/fetch_brief.py` with standard library calls + `google-generativeai`.
- **Database**: Standard static JSON file at `data/brief.json`.

---

## 2. Coding Standards & Constraints

### Frontend Development Rules
- **CSS guidelines**:
  - Keep styling strictly inside `style.css` (no inline styles).
  - Use **CSS Custom Properties** (Variables) for tokens.
  - Colors: Use OKLCH or HSL spaces for brand highlights. Electric Cyan (`hsl(180, 100%, 50%)`) and cyber pinks/purples are standard.
  - Implement modern glassmorphism: background blur (`backdrop-filter: blur(12px)`), semi-transparent borders, and soft shadows.
  - Avoid layout shifts: always specify `width` and `height` on dynamic SVGs and media elements.
- **JavaScript guidelines**:
  - Structure logic using classes or clean module namespaces.
  - Animations must be handles natively using CSS transitions, Web Animations API, or high-performance HTML5 canvas/requestAnimationFrame loops.
  - Event handlers must be bound using `addEventListener()` (never use inline `onclick` attributes).

### Python Curation Script Rules
- **Formatting**: Adhere to PEP 8 standards with descriptive variable naming.
- **Type Annotations**: Always include standard type hints for functions.
- **API Call Precaution**: Always wrap LLM API transactions in try-except statements to handle network issues gracefully.
- **Scraping rules**: Avoid loading large scraping frameworks like Selenium or BeautifulSoup. Use lightweight API lookups or clean feeds.

---

## 3. Database Schema (`data/brief.json`)

The curation script must generate a payload conforming to this layout:

```json
{
  "updated_at": "ISO-8601 Timestamp String",
  "growth_news": [
    {
      "id": "item-number-string",
      "title": "Clear headline for kids",
      "description": "Simplified summary explaining why this growth matters",
      "source": "Name of publisher",
      "url": "Link to article"
    }
  ],
  "tech_news": [
    {
      "id": "item-number-string",
      "title": "Tech concept headline",
      "description": "Detailed yet accessible explanation of the tech break-through",
      "source": "Source name",
      "url": "Article URL"
    }
  ],
  "jargons": [
    {
      "id": "jargon-key-string",
      "term": "Term Name",
      "definition": "Simple kid-friendly definition",
      "example": "Real-world relatable analogy",
      "use_case": "Where is it used in daily tech life?"
    }
  ],
  "tools": [
    {
      "id": "tool-id-string",
      "name": "Tool Name",
      "tagline": "Simple catchy description",
      "trending_factor": "Why is it hot right now?",
      "url": "Official link"
    }
  ],
  "models": [
    {
      "name": "Model Name",
      "developer": "Company",
      "parameters": "Size (e.g. '1.8 Trillion' or '70 Billion')",
      "context_window": "Number of tokens",
      "mmlu_score": "Float score (0.0 to 100.0)",
      "cost_per_million": "Float dollar price"
    }
  ],
  "courses": [
    {
      "title": "Course Title",
      "provider": "Platform (e.g. DeepLearning.AI)",
      "instructor": "Teacher name",
      "level": "Beginner / Intermediate / Advanced",
      "duration": "Est hours",
      "url": "Course URL"
    }
  ],
  "blogs": [
    {
      "title": "Blog Article Title",
      "author": "Writer",
      "site": "Site Name",
      "read_time": "Minutes",
      "url": "Link"
    }
  ]
}
```

---

## 4. Operational Commands

### Frontend Verification
Launch a simple Python-based HTTP server inside the project root:
```bash
python3 -m http.server 8000
```
Then view the page at `http://localhost:8000`.

### Python Package & Curation Verification
1. Install dependencies (recommended in virtual environment):
   ```bash
   pip install -e ".[dev]"
   ```
2. Execute the python scraping/curation script:
   ```bash
   export GEMINI_API_KEY="your-key-here"
   python3 scripts/fetch_brief.py
   ```
3. Run tests:
   ```bash
   pytest
   ```
