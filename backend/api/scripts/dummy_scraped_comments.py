import json
import random
from datetime import datetime, timedelta

# Load posts from dummy_scraped_posts.json
with open("./dummy_scraped_posts.json", "r") as f:
    posts = json.load(f)

usernames = [f"user{i}" for i in range(1, 401)]

comment_messages = [
    # Good
    "This is so helpful!",
    "Thank you for sharing!",
    "I agree 100%!",
    "Great review.",
    "Love this!",
    "Very informative.",
    "Absolutely loved this insight!",
    "So glad I found this post.",
    "Your feedback made my day!",
    "This worked perfectly for me.",
    "Super easy to follow, thanks!",
    "I learned something new today.",
    "Best explanation I've seen.",
    "You just saved me a lot of trouble.",
    "A+ for this review.",
    "Can't wait to try this myself!",
    # Bad
    "I had a bad experience too.",
    "Not impressed.",
    "This didn't work for me.",
    "Disappointed.",
    "Would not recommend.",
    "Mine arrived broken.",
    "Support was not helpful at all.",
    "Quality was not as expected.",
    "I regret buying this.",
    "Not worth the money.",
    "Instructions were confusing.",
    "Shipping took forever.",
    "The results were underwhelming.",
    "Packaging was damaged.",
    "It stopped working after a few days.",
    # Neutral
    "Thanks for the info.",
    "Interesting.",
    "Okay, noted.",
    "Just my opinion.",
    "Meh.",
    "It is what it is.",
    "Neither good nor bad.",
    "Arrived as described.",
    "Haven't tried it yet.",
    "Will see how it goes.",
    "No strong feelings either way.",
    "Just received mine.",
    "Still testing it out.",
    "Seems average so far.",
    "Might update later."
]

comments = []
comment_id_counter = 1

for post in posts:
    num_comments = random.randint(0, 12)
    for i in range(num_comments):
        # Randomly assign a comment_time between the post's created_time and up to 90 days after (but not in the future)
        post_created_time = datetime.fromisoformat(post["created_time"].replace("Z", ""))
        days_after = random.randint(0, 90)
        comment_time = post_created_time + timedelta(days=days_after, minutes=random.randint(1, 1440))
        # Ensure comment_time is not in the future
        now = datetime.utcnow()
        if comment_time > now:
            comment_time = now
        comment = {
            "comment_id": f"c{comment_id_counter:06d}",
            "post_id": post["post_id"],
            "page_id": post["page_id"],
            "created_time": comment_time.isoformat() + "Z",
            "message": random.choice(comment_messages),
            "likes": random.randint(0, 20),
            "reactions": [
                {"type": random.choice(["LIKE", "LOVE", "HAHA", "SAD", "ANGRY", "WOW"]), "user": random.choice(usernames)}
                for _ in range(random.randint(0, 3))
            ],
            "matched_keywords": post["matched_keywords"],
            "scraped_at": comment_time.isoformat() + "Z"
        }
        comments.append(comment)
        comment_id_counter += 1

with open("./dummy_scraped_comments.json", "w") as f:
    json.dump(comments, f, indent=2)
print(f"Dummy scraped comments generation complete. {len(comments)} comments written to dummy_scraped_comments.json.")
