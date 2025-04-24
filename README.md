# Sentiment Analysis Application

A full-stack application for scraping, analyzing, and visualizing sentiment from social media platforms.

---

## Table of Contents
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Backend (API)](#backend-api)
- [Frontend (Dashboard)](#frontend-dashboard)
- [Development & Setup](#development--setup)
- [License](#license)

---

## Overview
This project provides:
- A backend API for scraping Facebook data, filtering for Avon-related content, and storing results in MongoDB
- A React-based frontend dashboard for data visualization and reporting

## Project Structure
```
sentiment-analysis-application/
  backend/
    api/           # Node.js API, controllers, routes, services, config, tests
  frontend/        # React dashboard (Vite)
  documents/       # Planning, requirements, and docs
  README.md
```

---

## Backend (API)

### Features
- RESTful API for scraping and data management
- Scrape posts/comments from multiple Facebook pages using page IDs
- Filter comments for Avon product-related content using keyword matching
- Store filtered comments in MongoDB
- Rate limit handling
- Incremental & time-based scraping
- Manage page IDs and keywords in MongoDB

### Requirements
- Node.js 14+
- Facebook Developer Account & Access Token
- MongoDB (local or cloud)
- See `backend/api/.env.example` for environment variables

### Installation
```bash
cd backend/api
npm install
```

### Running the Backend
```bash
# Copy example env and fill in your credentials
cp .env.example .env
npm start
```

### API Endpoints

#### Page Management

- **GET /api/pages** - List all Facebook pages
- **POST /api/pages** - Add a new Facebook page
  ```json
  {
    "pageId": "AvonInsider",
    "name": "Avon Insider",
    "description": "Official Avon page"
  }
  ```
- **DELETE /api/pages/:pageId** - Remove a Facebook page
- **POST /api/pages/import** - Import multiple page IDs
  ```json
  {
    "pageIds": ["AvonInsider", "AvonUK", "AvonUSA"]
  }
  ```

#### Keyword Management

- **GET /api/keywords** - List all keywords
- **POST /api/keywords** - Add a new keyword
  ```json
  {
    "keyword": "avon true",
    "category": "makeup",
    "description": "Avon's makeup line"
  }
  ```
- **DELETE /api/keywords/:keyword** - Remove a keyword
- **POST /api/keywords/import** - Import multiple keywords
  ```json
  {
    "keywords": [
      {
        "keyword": "avon true",
        "category": "makeup",
        "description": "Avon's makeup line"
      },
      "avon brochure",
      "avon campaign"
    ]
  }
  ```

#### Scraper Operations

- **POST /api/scraper/run** - Run the scraper
  ```json
  {
    "pageIds": ["AvonInsider", "AvonUK"],  // Optional, uses all pages if not provided
    "daysBack": 30  // Optional, defaults to 30
  }
  ```
- **GET /api/scraper/status** - Get scraper status (last run times)
- **GET /api/scraper/comments** - Get Avon-related comments
  - Query parameters:
    - `pageId` - Filter by page ID
    - `startDate` - Filter by start date (ISO format)
    - `endDate` - Filter by end date (ISO format)
    - `limit` - Limit results (default: 100)
    - `skip` - Skip results for pagination (default: 0)
- **GET /api/scraper/stats** - Get statistics about the scraped data

---

## Frontend (Dashboard)

### Features
- Modern React dashboard for visualizing sentiment data
- Sidebar navigation, analytics panel, filters, and feed list
- Responsive, clean UI with real-time analytics (when backend is connected)

### Requirements
- Node.js 14+

### Installation
```bash
cd frontend
npm install
```

### Running the Frontend
```bash
npm run dev
# Visit http://localhost:5173
```

---

## Development & Setup
- See `documents/Phase1-PlanningRequirements.md` for project goals and stack
- Backend and frontend run independently for development
- Environment variables for the backend are in `backend/api/.env`
- For API docs and Postman collections, see `backend/api/api-collection-postman.json`

---

## License
MIT
