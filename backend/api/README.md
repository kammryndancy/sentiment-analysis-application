# Sentiment Analysis Backend API

This backend powers the Avon social media sentiment analysis dashboard. It provides RESTful API endpoints and data processing for scraping, analyzing, and serving Facebook posts and comments, with advanced keyword filtering and sentiment features.

## Features
- **Facebook Scraping:**
  - Scrape posts and comments from multiple Facebook pages using stored page IDs
  - Incremental scraping (processes only new/unscraped content)
  - Time-based filtering (scrape N days back)
  - Handles Facebook API rate limiting
- **Keyword & Page Management:**
  - Store and manage Avon-related keywords and Facebook page IDs in MongoDB
  - Import/export keywords and page IDs
- **Data Processing:**
  - Text preprocessing and anonymization
  - Sentiment analysis using Node.js NLP (`natural`)
  - Analytics: word cloud, sentiment over time, extremes, etc.
- **API Endpoints:**
  - Serve processed posts/comments
  - Serve analytics (word cloud, top keywords, sentiment over time, etc.)
  - Authentication (register/login/logout/check)
  - Settings management (Facebook/Google/HuggingFace credentials)
- **Tech Stack:**
  - Node.js (ES Modules), Express, MongoDB
  - Python (for scraping)


## API Documentation
- **Postman Collection:**
  - See [`api-collection-postman.json`](./api-collection-postman.json) for a complete, up-to-date list of all backend API endpoints. Import this file into Postman for easy testing.
  - Auth instructions are included in the collection.

## Directory Structure
- `controllers/` — API route handlers
- `routes/` — Express route definitions
- `services/` — Data processing, anonymization, utils
- `scripts/` — Python scraper and Node.js import tools
- `models/` — Mongoose models

## Example API Endpoints
- `GET /api/pages` — List all Facebook pages
- `POST /api/keywords` — Add a keyword
- `POST /api/scraper/run` — Start the scraper
- `GET /api/data-processor/wordcloud` — Get word cloud analytics
- `GET /api/data-processor/search-comments` — Search comments
- `GET /api/sentiment-over-time` — Get sentiment trend
- `POST /api/auth/register` — Register new user

## Dummy Data Import Tools
Dummy data scripts are provided to quickly populate your MongoDB with sample posts and comments for testing and development.

### Import Dummy Posts
- **Script:** `scripts/import_dummy_posts.js`
- **Data file:** `scripts/dummy_scraped_posts.json`
- **Usage:**
  ```sh
  node scripts/import_dummy_posts.js
  ```
- **What it does:**
  - Connects to MongoDB using your `.env` config
  - Imports all posts from `dummy_scraped_posts.json` into your `scraped_posts` collection
  - Overwrites (deletes) existing posts in the collection

**Note:** Ensure MongoDB is running and your `.env` file is configured before running these scripts. You will also need to run import_dummy_posts.js before running import_dummy_comments.js.

### Import Dummy Comments
- **Script:** `scripts/import_dummy_comments.js`
- **Data file:** `scripts/dummy_scraped_comments.json`
- **Usage:**
  ```sh
  node scripts/import_dummy_comments.js
  ```
- **What it does:**
  - Connects to MongoDB using your `.env` config
  - Imports all comments from `dummy_scraped_comments.json` into your `scraped_comments` collection
  - Overwrites (deletes) existing comments in the collection

## Notes
- Requires MongoDB running locally or remotely
- Facebook API credentials required for live scraping
- See `scripts/keywords.json` and `scripts/page_ids.json` for sample config files

---
**For full-stack usage, see the frontend README.**
