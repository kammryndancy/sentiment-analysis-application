import sys
import json
import argparse
from facebook_scraper import FacebookScraper

def main():
    """
    Run the Facebook scraper with page IDs from MongoDB or command line.
    """
    parser = argparse.ArgumentParser(description='Facebook scraper for Avon product comments')
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Scrape command
    scrape_parser = subparsers.add_parser('scrape', help='Scrape Facebook pages')
    scrape_parser.add_argument('--ids', nargs='+', help='List of Facebook page IDs to scrape (optional, uses stored IDs if not provided)')
    scrape_parser.add_argument('--days', type=int, default=30, help='Number of days back to scrape (default: 30)')
    
    # Page management commands
    add_parser = subparsers.add_parser('add-page', help='Add a Facebook page ID to the database')
    add_parser.add_argument('page_id', help='Facebook page ID to add')
    add_parser.add_argument('--name', help='Optional name for the page')
    add_parser.add_argument('--description', help='Optional description for the page')
    
    remove_parser = subparsers.add_parser('remove-page', help='Remove a Facebook page ID from the database')
    remove_parser.add_argument('page_id', help='Facebook page ID to remove')
    
    list_parser = subparsers.add_parser('list-pages', help='List all Facebook page IDs in the database')
    
    import_pages_parser = subparsers.add_parser('import-pages', help='Import Facebook page IDs from a JSON file')
    import_pages_parser.add_argument('file', help='Path to JSON file containing page IDs')
    
    # Keyword management commands
    add_keyword_parser = subparsers.add_parser('add-keyword', help='Add a keyword to the database')
    add_keyword_parser.add_argument('keyword', help='Keyword to add')
    add_keyword_parser.add_argument('--category', help='Optional category for the keyword')
    add_keyword_parser.add_argument('--description', help='Optional description for the keyword')
    
    remove_keyword_parser = subparsers.add_parser('remove-keyword', help='Remove a keyword from the database')
    remove_keyword_parser.add_argument('keyword', help='Keyword to remove')
    
    list_keywords_parser = subparsers.add_parser('list-keywords', help='List all keywords in the database')
    
    import_keywords_parser = subparsers.add_parser('import-keywords', help='Import keywords from a JSON file')
    import_keywords_parser.add_argument('file', help='Path to JSON file containing keywords')
    
    args = parser.parse_args()
    
    # Initialize the scraper
    scraper = FacebookScraper()
    
    if args.command == 'scrape':
        # Run the scraper with provided IDs or use stored IDs
        scraper.scrape_pages(page_ids=args.ids, days_back=args.days)
    
    elif args.command == 'add-page':
        # Add a page ID to the database
        scraper.add_page_id(args.page_id, name=args.name, description=args.description)
    
    elif args.command == 'remove-page':
        # Remove a page ID from the database
        scraper.remove_page_id(args.page_id)
    
    elif args.command == 'list-pages':
        # List all page IDs in the database
        pages = scraper.list_pages()
        if not pages:
            print("No pages found in the database.")
        else:
            for page in pages:
                print(f"Page ID: {page['page_id']}, Name: {page['name']}, Description: {page['description']}")
    
    elif args.command == 'import-pages':
        # Import page IDs from a JSON file
        try:
            with open(args.file, 'r') as f:
                page_ids = json.load(f)
                if not isinstance(page_ids, list):
                    print("Error: The JSON file should contain a list of page IDs")
                    return
                
                print(f"Importing {len(page_ids)} page IDs...")
                for page_id in page_ids:
                    scraper.add_page_id(page_id)
                print("Import completed.")
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Error reading page IDs file: {e}")
    
    elif args.command == 'add-keyword':
        # Add a keyword to the database
        scraper.add_keyword(args.keyword, category=args.category, description=args.description)
    
    elif args.command == 'remove-keyword':
        # Remove a keyword from the database
        scraper.remove_keyword(args.keyword)
    
    elif args.command == 'list-keywords':
        # List all keywords in the database
        keywords = scraper.list_keywords()
        if not keywords:
            print("No keywords found in the database.")
        else:
            for keyword in keywords:
                print(f"Keyword: {keyword['keyword']}, Category: {keyword['category']}, Description: {keyword['description']}")
    
    elif args.command == 'import-keywords':
        # Import keywords from a JSON file
        try:
            with open(args.file, 'r') as f:
                keywords = json.load(f)
                if not isinstance(keywords, list):
                    print("Error: The JSON file should contain a list of keywords")
                    return
                
                scraper.import_keywords(keywords)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Error reading keywords file: {e}")
    
    else:
        # If no command is provided, show help
        parser.print_help()

if __name__ == "__main__":
    main()
