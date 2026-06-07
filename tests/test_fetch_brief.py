"""Unit tests for fetch_brief.py curation logic."""

import json
import os
import sys
from unittest.mock import MagicMock, patch

# Ensure the parent scripts directory can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts import fetch_brief


@patch("scripts.fetch_brief.requests.get")
def test_fetch_raw_feed_items(mock_get, mock_rss_content):
    """Test that RSS feed XML is fetched and parsed correctly into dictionary items."""
    # Setup mock requests response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = mock_rss_content.encode("utf-8")
    mock_get.return_value = mock_resp

    items = fetch_brief.fetch_raw_feed_items()
    
    assert len(items) > 0
    # Two feeds in FEED_URLS, so mock_get runs twice, returning 2 items each time
    assert len(items) == 4
    
    assert items[0]["title"] == "OpenAI launches new safety protocols for agents"
    assert items[0]["url"] == "https://example.com/openai-safety"
    assert "infinite loops" in items[0]["description"]
    
    assert items[1]["title"] == "Google Gemini processes million token audio waves natively"
    assert items[1]["url"] == "https://example.com/gemini-audio"


@patch.dict(os.environ, {"GEMINI_API_KEY": "test-key-value-123"})
@patch("scripts.fetch_brief.genai.GenerativeModel")
def test_curate_with_gemini(mock_model_class, mock_gemini_json):
    """Test that curate_with_gemini configures and calls the GenerativeModel class."""
    # Setup mock models responses
    mock_model = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = mock_gemini_json
    mock_model.generate_content.return_value = mock_resp
    mock_model_class.return_value = mock_model

    feed_items = [
        {"title": "OpenAI safety", "description": "agent loops", "url": "https://example.com/1"},
        {"title": "Gemini Audio", "description": "native tokens", "url": "https://example.com/2"}
    ]

    payload = fetch_brief.curate_with_gemini(feed_items)
    
    assert payload is not None
    parsed = json.loads(payload)
    assert parsed["growth_news"][0]["title"] == "AI Helps Safe Dolphins in the Ocean"
    
    # Assert model instantiation configurations
    mock_model_class.assert_called_with("gemini-1.5-flash")
    mock_model.generate_content.assert_called_once()


@patch("scripts.fetch_brief.fetch_raw_feed_items")
@patch("scripts.fetch_brief.curate_with_gemini")
@patch("scripts.fetch_brief.open", create=True)
@patch("scripts.fetch_brief.os.makedirs")
def test_main_success(mock_makedirs, mock_open, mock_curate, mock_fetch, mock_gemini_json):
    """Test main execution loop writes updated json data to file system when inputs succeed."""
    mock_fetch.return_value = [{"title": "News", "description": "Desc", "url": "url"}]
    mock_curate.return_value = mock_gemini_json

    # Mock context manager open call
    mock_file = MagicMock()
    mock_open.return_value.__enter__.return_value = mock_file

    with patch("scripts.fetch_brief.sys.exit") as mock_exit:
        fetch_brief.main()
        
        # Ensure sys.exit is not called (which signifies success)
        mock_exit.assert_not_called()
        
        # Verify folder creation and file writing operations
        mock_makedirs.assert_called_once()
        mock_open.assert_called_once()
        
        # Extract json.dump written call strings
        written_calls = mock_file.write.call_args_list
        assert len(written_calls) > 0
