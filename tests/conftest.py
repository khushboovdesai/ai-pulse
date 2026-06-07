"""Pytest fixtures for AI Pulse tests."""

import pytest

@pytest.fixture
def mock_rss_content():
    """Return a mock RSS XML string representation."""
    return """<rss version="2.0">
      <channel>
        <title>Google News - AI</title>
        <item>
          <title>OpenAI launches new safety protocols for agents</title>
          <description>Researchers announced details of agent restrictions to prevent infinite loops.</description>
          <link>https://example.com/openai-safety</link>
        </item>
        <item>
          <title>Google Gemini processes million token audio waves natively</title>
          <description>New native models skip transcription steps entirely, accelerating performance.</description>
          <link>https://example.com/gemini-audio</link>
        </item>
      </channel>
    </rss>"""

@pytest.fixture
def mock_gemini_json():
    """Return a mocked JSON response string that mimics Gemini API output."""
    return """{
      "updated_at": "2026-06-07T00:00:00Z",
      "growth_news": [
        {
          "id": "growth-1",
          "title": "AI Helps Safe Dolphins in the Ocean",
          "description": "Scientists are using underwater sound trackers with smart software to detect and keep dolphins away from ship pathways.",
          "source": "Nature Focus",
          "url": "https://example.com/dolphins"
        }
      ],
      "tech_news": [
        {
          "id": "tech-1",
          "title": "Computers Learn to Listen Directly to Waves",
          "description": "By ingestion raw audio sound frequencies instead of converting them to text, AI understands the human voice much faster.",
          "source": "Audio Science",
          "url": "https://example.com/audio"
        }
      ],
      "jargons": [],
      "tools": [],
      "models": [],
      "courses": [],
      "blogs": []
    }"""
