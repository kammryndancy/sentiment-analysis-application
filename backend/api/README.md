# Sentiment Analysis Backend API

This backend powers the Avon social media sentiment analysis dashboard. It provides endpoints and data processing for scraping, analyzing, and serving Facebook posts/comments, with advanced keyword filtering and sentiment features.

## Features
- **Facebook Scraping:**
  - Scrapes posts and comments from multiple Facebook pages using page IDs
  - Incremental scraping (only new/unscraped content)
  - Time-based filtering (scrape N days back)
  - Handles rate limiting
- **Keyword & Page Management:**
  - Stores/manages Avon-related keywords and Facebook page IDs in MongoDB
  - Supports keyword/category import/export
- **Data Processing:**
  - Text preprocessing and anonymization
  - Sentiment analysis using `natural` (Node.js NLP)
  - Aggregates for analytics (word cloud, time series, etc.)
- **API Endpoints:**
  - Serve processed posts/comments
  - Serve analytics (word cloud, top keywords, sentiment over time, etc.)
- **Tech Stack:**
  - Node.js (ES Modules)
  - Express
  - MongoDB
  - Python (for scraping)

## Setup
1. **Install dependencies:**
   - Node.js: `npm install`
   - Python: `pip install -r requirements.txt` (see `scripts/`)
2. **Environment:**
   - Copy `.env.example` to `.env` and fill in Facebook API token, MongoDB URI, etc.
3. **Run the backend:**
   - `npm start` (or `node server.js`)
4. **Run the scraper:**
   - `python scripts/run_scraper.py scrape --days 7`

## Directory Structure
- `controllers/` — API route handlers
- `services/` — Data processing, anonymization, utils
- `scripts/` — Python scraper and helpers
- `models/` — Mongoose models

## Example API Endpoints
- `GET /api/posts` — All processed posts
- `GET /api/wordcloud` — Word cloud data
- `GET /api/comments-overtime` — Comments/posts over time

## Notes
- Requires MongoDB running
- Facebook API credentials required for scraping
- See `scripts/keywords.json` and `scripts/page_ids.json` for sample config

---
**For full-stack usage, see the frontend README.**
