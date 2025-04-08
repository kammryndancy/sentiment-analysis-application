import os
import re
import json
import time
from datetime import datetime, timedelta
import facebook
import pymongo
import nltk
from dotenv import load_dotenv
from nltk.tokenize import word_tokenize

# Load environment variables
load_dotenv()

# Download NLTK data (only needed first time)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class FacebookScraper:
    def __init__(self):
        # Initialize Facebook Graph API
        self.access_token = os.getenv('FACEBOOK_ACCESS_TOKEN')
        self.graph = facebook.GraphAPI(access_token=self.access_token, version="12.0")
        
        # Initialize MongoDB connection
        self.mongo_client = pymongo.MongoClient(os.getenv('MONGO_URI'))
        self.db = self.mongo_client[os.getenv('MONGO_DB')]
        self.collection = self.db[os.getenv('MONGO_COLLECTION')]
        
        # Create a new collection to track scraped posts
        self.scraped_posts = self.db['scraped_posts']
        self.scraped_posts.create_index('post_id', unique=True)
        
        # Create a new collection to store page IDs
        self.page_ids_collection = self.db['page_ids']
        self.page_ids_collection.create_index('page_id', unique=True)
        
        # Create a new collection to store keywords
        self.keywords_collection = self.db['keywords']
        self.keywords_collection.create_index('keyword', unique=True)
        
        # Create indexes for the comments collection
        self.collection.create_index('comment_id', unique=True)
        self.collection.create_index('post_id')
        self.collection.create_index('page_id')
        self.collection.create_index('created_time')
        
        # Initialize keywords from database or use defaults
        self._initialize_keywords()
        
        # Compile regex pattern for faster matching
        self._compile_keyword_pattern()

    def _initialize_keywords(self):
        """Initialize keywords from database or use defaults if none exist."""
        # Check if we have keywords in the database
        keywords_count = self.keywords_collection.count_documents({})
        
        if keywords_count == 0:
            # No keywords in database, add default keywords
            default_keywords = [
                'avon', 'avon products', 'avon representative', 'avon catalog', 
                'avon skincare', 'avon makeup', 'avon perfume', 'avon fragrance',
                'anew', 'skin so soft', 'far away', 'today', 'little black dress',
                'advance techniques', 'mark', 'avon care'
            ]
            
            for keyword in default_keywords:
                self.add_keyword(keyword, is_default=True)
                
            print(f"Initialized database with {len(default_keywords)} default keywords")
    
    def _compile_keyword_pattern(self):
        """Compile regex pattern from current keywords."""
        # Get all keywords from database
        keywords = self.get_keywords()
        
        if not keywords:
            # Fallback to a basic pattern if no keywords are found
            self.avon_pattern = re.compile(r'\bavon\b', re.IGNORECASE)
        else:
            # Compile regex pattern for faster matching
            self.avon_pattern = re.compile(r'\b(' + '|'.join(keywords) + r')\b', re.IGNORECASE)

    def is_avon_related(self, text):
        """Check if the text contains Avon-related keywords."""
        if not text:
            return False
        return bool(self.avon_pattern.search(text))

    def add_keyword(self, keyword, category=None, description=None, is_default=False):
        """Add a keyword to the database."""
        # Prepare document for MongoDB
        keyword_doc = {
            'keyword': keyword.lower().strip(),
            'category': category,
            'description': description,
            'is_default': is_default,
            'added_at': datetime.now(),
            'last_updated': datetime.now()
        }
        
        # Insert or update keyword in MongoDB
        result = self.keywords_collection.update_one(
            {'keyword': keyword_doc['keyword']},
            {'$set': keyword_doc},
            upsert=True
        )
        
        if result.upserted_id:
            print(f"Added new keyword: {keyword}")
        else:
            print(f"Updated existing keyword: {keyword}")
        
        # Recompile the pattern with the new keyword
        self._compile_keyword_pattern()
        
        return True

    def remove_keyword(self, keyword):
        """Remove a keyword from the database."""
        result = self.keywords_collection.delete_one({'keyword': keyword.lower().strip()})
        if result.deleted_count > 0:
            print(f"Removed keyword: {keyword}")
            # Recompile the pattern without the removed keyword
            self._compile_keyword_pattern()
            return True
        else:
            print(f"Keyword not found: {keyword}")
            return False

    def get_keywords(self):
        """Get all keywords from the database."""
        return [doc['keyword'] for doc in self.keywords_collection.find({}, {'keyword': 1, '_id': 0})]

    def list_keywords(self):
        """List all keywords in the database with details."""
        keywords = list(self.keywords_collection.find({}, {'_id': 0}))
        for keyword in keywords:
            print(f"Keyword: {keyword['keyword']}")
            if keyword.get('category'):
                print(f"Category: {keyword['category']}")
            if keyword.get('description'):
                print(f"Description: {keyword['description']}")
            print(f"Default: {'Yes' if keyword.get('is_default') else 'No'}")
            print(f"Added: {keyword['added_at'].strftime('%Y-%m-%d %H:%M:%S')}")
            print("-" * 40)
        return keywords

    def import_keywords(self, keywords_list):
        """Import a list of keywords to the database."""
        added_count = 0
        for keyword in keywords_list:
            if isinstance(keyword, dict):
                # If it's a dictionary with metadata
                self.add_keyword(
                    keyword['keyword'], 
                    category=keyword.get('category'),
                    description=keyword.get('description')
                )
            else:
                # If it's just a string
                self.add_keyword(keyword)
            added_count += 1
        
        print(f"Imported {added_count} keywords")
        return added_count

    def add_page_id(self, page_id, name=None, description=None):
        """Add a page ID to the database."""
        try:
            # Check if the page exists on Facebook
            page_info = self.graph.get_object(page_id, fields='name,about')
            
            # Prepare document for MongoDB
            page_doc = {
                'page_id': page_id,
                'name': name or page_info.get('name', ''),
                'description': description or page_info.get('about', ''),
                'added_at': datetime.now(),
                'last_scraped': None
            }
            
            # Insert or update page ID in MongoDB
            result = self.page_ids_collection.update_one(
                {'page_id': page_id},
                {'$set': page_doc},
                upsert=True
            )
            
            if result.upserted_id:
                print(f"Added new page ID: {page_id} ({page_doc['name']})")
            else:
                print(f"Updated existing page ID: {page_id} ({page_doc['name']})")
                
            return True
        except facebook.GraphAPIError as e:
            print(f"Error adding page ID {page_id}: {e}")
            return False

    def remove_page_id(self, page_id):
        """Remove a page ID from the database."""
        result = self.page_ids_collection.delete_one({'page_id': page_id})
        if result.deleted_count > 0:
            print(f"Removed page ID: {page_id}")
            return True
        else:
            print(f"Page ID not found: {page_id}")
            return False

    def get_page_ids(self):
        """Get all page IDs from the database."""
        return [doc['page_id'] for doc in self.page_ids_collection.find({}, {'page_id': 1, '_id': 0})]

    def list_pages(self):
        """List all pages in the database with details."""
        pages = list(self.page_ids_collection.find({}, {'_id': 0}))
        for page in pages:
            last_scraped = page.get('last_scraped', 'Never')
            if last_scraped:
                last_scraped = last_scraped.strftime('%Y-%m-%d %H:%M:%S')
            print(f"Page ID: {page['page_id']}")
            print(f"Name: {page.get('name', 'Unknown')}")
            print(f"Last scraped: {last_scraped}")
            print("-" * 40)
        return pages

    def update_page_last_scraped(self, page_id):
        """Update the last_scraped timestamp for a page."""
        self.page_ids_collection.update_one(
            {'page_id': page_id},
            {'$set': {'last_scraped': datetime.now()}}
        )

    def get_page_posts(self, page_id, limit=100, days_back=30):
        """Fetch posts from a Facebook page, filtering out already scraped posts."""
        try:
            # Get list of already scraped post IDs for this page
            scraped_post_ids = set(
                doc['post_id'] for doc in self.scraped_posts.find(
                    {'page_id': page_id}, 
                    {'post_id': 1, '_id': 0}
                )
            )
            
            # Calculate date threshold for fetching posts
            since_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            
            # Fetch posts from Facebook
            posts = self.graph.get_connections(
                id=page_id,
                connection_name='posts',
                fields='id,message,created_time,comments.limit(100){id,message,created_time,from}',
                limit=limit,
                since=since_date
            )
            
            # Filter out already scraped posts
            new_posts = []
            for post in posts['data']:
                post_id = post.get('id')
                if post_id not in scraped_post_ids:
                    new_posts.append(post)
                    # Mark this post as scraped
                    self.scraped_posts.update_one(
                        {'post_id': post_id},
                        {
                            '$set': {
                                'post_id': post_id,
                                'page_id': page_id,
                                'created_time': datetime.strptime(post.get('created_time'), '%Y-%m-%dT%H:%M:%S+0000'),
                                'last_scraped': datetime.now()
                            }
                        },
                        upsert=True
                    )
            
            print(f"Found {len(new_posts)} new posts out of {len(posts['data'])} total posts for page {page_id}")
            return new_posts
            
        except facebook.GraphAPIError as e:
            print(f"Error fetching posts for page {page_id}: {e}")
            return []

    def process_comments(self, comments_data, post_id, page_id):
        """Process comments and save Avon-related comments to MongoDB."""
        if not comments_data:
            return 0
        
        # Get list of already processed comment IDs for this post
        existing_comment_ids = set(
            doc['comment_id'] for doc in self.collection.find(
                {'post_id': post_id}, 
                {'comment_id': 1, '_id': 0}
            )
        )
        
        saved_count = 0
        new_comments_count = 0
        
        for comment in comments_data:
            comment_id = comment.get('id')
            
            # Skip already processed comments
            if comment_id in existing_comment_ids:
                continue
                
            new_comments_count += 1
            comment_message = comment.get('message', '')
            
            # Check if comment is related to Avon
            if self.is_avon_related(comment_message):
                # Prepare document for MongoDB
                comment_doc = {
                    'comment_id': comment_id,
                    'post_id': post_id,
                    'page_id': page_id,
                    'message': comment_message,
                    'created_time': datetime.strptime(comment.get('created_time'), '%Y-%m-%dT%H:%M:%S+0000'),
                    'from_id': comment.get('from', {}).get('id'),
                    'from_name': comment.get('from', {}).get('name'),
                    'scraped_at': datetime.now()
                }
                
                # Insert comment in MongoDB
                self.collection.insert_one(comment_doc)
                saved_count += 1
        
        print(f"Processed {new_comments_count} new comments for post {post_id}, saved {saved_count} Avon-related comments")
        return saved_count

    def get_all_comments(self, post):
        """Get all comments for a post, handling pagination."""
        if 'comments' not in post:
            return []
        
        comments = post['comments']['data']
        next_page = post['comments'].get('paging', {}).get('next')
        
        # Handle pagination to get all comments
        while next_page:
            try:
                next_comments = self.graph.request(next_page)
                comments.extend(next_comments['data'])
                next_page = next_comments.get('paging', {}).get('next')
            except facebook.GraphAPIError as e:
                print(f"Error fetching next page of comments: {e}")
                break
        
        return comments

    def scrape_pages(self, page_ids=None, days_back=30):
        """
        Scrape posts and comments from a list of Facebook page IDs.
        If no page_ids are provided, use the ones stored in the database.
        """
        if page_ids is None:
            page_ids = self.get_page_ids()
            if not page_ids:
                print("No page IDs found in the database. Please add some page IDs first.")
                return 0, 0, 0
        
        total_posts = 0
        total_comments = 0
        total_saved_comments = 0
        
        print(f"Starting to scrape {len(page_ids)} Facebook pages...")
        
        for page_id in page_ids:
            print(f"Scraping page: {page_id}")
            posts = self.get_page_posts(page_id, days_back=days_back)
            total_posts += len(posts)
            
            for post in posts:
                post_id = post.get('id')
                comments = self.get_all_comments(post)
                total_comments += len(comments)
                
                saved_comments = self.process_comments(comments, post_id, page_id)
                total_saved_comments += saved_comments
                
                # Respect rate limits
                time.sleep(1)
            
            # Update last_scraped timestamp for this page
            self.update_page_last_scraped(page_id)
        
        print(f"Scraping completed. Processed {total_posts} new posts and {total_comments} comments.")
        print(f"Saved {total_saved_comments} new Avon-related comments to MongoDB.")
        
        return total_posts, total_comments, total_saved_comments

if __name__ == "__main__":
    # Example usage
    scraper = FacebookScraper()
    
    # Example: Add a page ID
    # scraper.add_page_id("AvonInsider")
    
    # Example: List all pages
    # scraper.list_pages()
    
    # Example: Scrape all pages in the database
    # scraper.scrape_pages()
