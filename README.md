# sentiment-analysis-scraper
A data scraping module for social media platforms

## Facebook Scraper for Avon Product Comments

This module scrapes Facebook pages for posts and comments, then filters and stores comments related to Avon products in a MongoDB database.

### Features

- Scrape posts from multiple Facebook pages using page IDs
- Extract all comments from these posts
- Filter comments for Avon product-related content using keyword matching
- Store filtered comments in MongoDB for further analysis
- Rate limit handling to avoid API restrictions
- **Incremental scraping**: Only processes new, unscraped posts and comments
- **Time-based filtering**: Specify how many days back to scrape
- **Page management**: Store and manage Facebook page IDs in MongoDB
- **Keyword management**: Configure and manage Avon-related keywords in MongoDB

### Requirements

- Python 3.7+
- Facebook Developer Account and Access Token
- MongoDB (local or cloud instance)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/sentiment-analysis-scraper.git
   cd sentiment-analysis-scraper
   ```

2. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Configure your environment variables:
   - Copy `.env.example` to `.env`
   - Add your Facebook access token and MongoDB connection details

### Usage

The scraper uses a command-line interface with several subcommands:

#### Managing Facebook Pages

Add a Facebook page to the database:
```
python run_scraper.py add-page AvonInsider
```

With optional name and description:
```
python run_scraper.py add-page AvonInsider --name "Avon Insider" --description "Official Avon page"
```

Import multiple page IDs from a JSON file:
```
python run_scraper.py import-pages page_ids.json
```

List all Facebook pages stored in the database:
```
python run_scraper.py list-pages
```

Remove a Facebook page from the database:
```
python run_scraper.py remove-page AvonInsider
```

#### Managing Keywords

Add a keyword to the database:
```
python run_scraper.py add-keyword "avon lipstick"
```

With category and description:
```
python run_scraper.py add-keyword "avon true" --category "makeup" --description "Avon's makeup line"
```

Import keywords from a JSON file:
```
python run_scraper.py import-keywords keywords.json
```

List all keywords in the database:
```
python run_scraper.py list-keywords
```

Remove a keyword from the database:
```
python run_scraper.py remove-keyword "avon lipstick"
```

#### Running the Scraper

Scrape all pages stored in the database:
```
python run_scraper.py scrape
```

Scrape specific pages (overrides stored pages):
```
python run_scraper.py scrape --ids AvonInsider AvonUK
```

Specify how many days back to scrape:
```
python run_scraper.py scrape --days 14
```

### MongoDB Structure

The scraper uses four MongoDB collections:

1. **facebook_comments**: Stores Avon-related comments with the following structure:
   ```json
   {
     "comment_id": "123456789_12345",
     "post_id": "123456789",
     "page_id": "avon_page_id",
     "message": "I love the new Avon Anew serum!",
     "created_time": "2023-01-15T14:22:15+0000",
     "from_id": "user_id",
     "from_name": "User Name",
     "scraped_at": "2023-01-16T08:30:45"
   }
   ```

2. **scraped_posts**: Tracks which posts have already been scraped:
   ```json
   {
     "post_id": "123456789",
     "page_id": "avon_page_id",
     "created_time": "2023-01-15T14:22:15+0000",
     "last_scraped": "2023-01-16T08:30:45"
   }
   ```

3. **page_ids**: Stores Facebook pages to be scraped:
   ```json
   {
     "page_id": "AvonInsider",
     "name": "Avon Insider",
     "description": "Official Avon page",
     "added_at": "2023-01-15T14:22:15+0000",
     "last_scraped": "2023-01-16T08:30:45"
   }
   ```

4. **keywords**: Stores Avon-related keywords for filtering comments:
   ```json
   {
     "keyword": "avon true",
     "category": "makeup",
     "description": "Avon's makeup line",
     "is_default": false,
     "added_at": "2023-01-15T14:22:15+0000",
     "last_updated": "2023-01-16T08:30:45"
   }
   ```

### Keyword Format for Import

You can import keywords in two formats:

1. Simple string list:
   ```json
   [
     "avon lipstick",
     "avon mascara",
     "avon foundation"
   ]
   ```

2. Detailed format with metadata:
   ```json
   [
     {
       "keyword": "avon true",
       "category": "makeup",
       "description": "Avon's makeup line"
     },
     {
       "keyword": "anew clinical",
       "category": "skincare",
       "description": "Advanced anti-aging skincare"
     }
   ]
   ```

### Important Notes

- Ensure your Facebook access token has the necessary permissions
- Be mindful of Facebook's rate limits and terms of service
- This tool is intended for research purposes only
- The scraper will only process new posts and comments that haven't been scraped before
- Default keywords are automatically added if no keywords exist in the database
