# Sentiment Analysis Dashboard (Frontend)

This is the modern React-based frontend for the Avon Social Media Sentiment Analysis Application. It provides a rich, interactive dashboard for visualizing and exploring Facebook sentiment data collected and processed by the backend API.

## Features
- **Interactive Dashboard:**
  - Real-time word cloud with sentiment-based color gradients
  - Top/bottom sentiment word lists with cross-highlighting
  - Comments/posts over time chart
  - Recent feeds and Hot Topics panels
  - Advanced comment search with filtering and sentiment scores
- **Monitoring & Management:**
  - Scraper controls and status monitoring
  - Data processor controls and analytics
  - Facebook page and keyword management
  - Settings panel for API credentials (Facebook, Google NLP, HuggingFace)
- **User Authentication:**
  - Register, login, and logout
  - Session-based access to protected features
- **Consistent Styling:**
  - Dark, cohesive dashboard theme
  - Responsive layout for desktop and mobile
- **Error & Loading Handling:**
  - User-friendly loading and error states for all analytics panels
- **API Integration:**
  - Connects to the Node.js/Express backend API
  - Fetches processed social media data, analytics, and visualizations

## Usage Guide
### Prerequisites
- Node.js (v18+ recommended)
- Backend API running (see backend/api/README.md for setup)

### Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure API Endpoint (if needed):**
   - By default, the frontend expects the backend API at `http://localhost:3000`.
   - To use a different backend URL, set the `VITE_API_BASE_URL` environment variable in a `.env` file at the project root:
     ```env
     VITE_API_BASE_URL=http://your-backend-url:3000
     ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Building for Production
```bash
npm run build
```
- Output will be in the `dist/` folder. Serve with any static web server.

### Linting
```bash
npm run lint
```

## Application Structure
- `src/components/` — Dashboard panels, visualizations, forms, and settings
- `src/pages/` — Page-level views (dashboard, monitoring, settings, etc.)
- `src/api/` — API utility functions
- `src/styles/` — CSS and theming

## Common Workflows
- **View Dashboard:**
  - See word cloud, sentiment charts, recent comments, and hot topics at a glance.
- **Search Comments:**
  - Use filters for keywords, pages, sentiment, and date range. Results include weighted sentiment scores.
- **Monitor Data Pipeline:**
  - Run or monitor the Facebook scraper and data processors from the Monitoring page.
- **Manage Pages/Keywords:**
  - Add/remove Facebook pages and keywords for targeted analysis.
- **Update Settings:**
  - Enter or update API keys for Facebook, Google NLP, and HuggingFace in the Settings panel.
- **Authentication:**
  - Register or log in to access protected features. Session is maintained via cookies.

## Troubleshooting
- If you see API/network errors, ensure the backend API is running and accessible at the configured URL.
- For protected routes, make sure you are logged in.

---
**For backend/API setup, see the [backend/api/README.md](../backend/api/README.md).**
