# Sentiment Analysis Dashboard (Frontend)

This is the modern React-based frontend for the Avon Social Media Sentiment Analysis Application.

## Features
- **Interactive Dashboard:**
  - Real-time word cloud with sentiment-based color gradients
  - Top/bottom sentiment word lists with cross-highlighting
  - Comments/posts over time chart
  - Recent feeds and Hot Topics panels
- **Consistent Styling:**
  - Dark, cohesive dashboard theme
  - Responsive layout
- **Error & Loading Handling:**
  - User-friendly loading and error states for all analytics panels
- **API Integration:**
  - Connects to the Node.js/Express backend API
  - Fetches processed social media data, analytics, and visualizations

## Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173) by default.

## Project Structure
- `/src/components/dashboard/` — Dashboard panels (AnalyticsPanel, FeedList, etc.)
- `/src/components/visualizations/` — Custom charts and word cloud
- `/src/api/` — API request logic
- `/public/` — Static assets

## Customization
- All dashboard panels and visualizations are fully customizable in `/src/components/`
- API endpoints can be configured in `/src/api/`

## Build for Production
```bash
npm run build
```

## Requirements
- Node.js 18+
- Backend API (see `../backend/api/README.md`)

---
For backend and data scraping setup, see the backend API README.
