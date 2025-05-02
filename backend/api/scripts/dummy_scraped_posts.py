import json
import random
from datetime import datetime, timedelta

page_ids = [
    "AvonInsider", "AvonUK", "AvonUSA", "141628782532797", "YourBeautyWithAvon", "Avon"
]
reaction_types = ["LIKE", "LOVE", "HAHA", "SAD", "ANGRY", "WOW"]

posts = []

good_messages = [
    "I love this Avon product!",
    "Amazing quality and fast shipping.",
    "Great customer service!",
    "Highly recommend to everyone.",
    "Very satisfied with my purchase.",
    "This is the best product I've tried from Avon.",
    "Exceeded my expectations!",
    "Fast delivery and excellent packaging.",
    "Five stars, will buy again.",
    "Absolutely wonderful experience!",
    "The fragrance is so refreshing and lasts all day.",
    "My skin feels so smooth after using this lotion.",
    "The lipstick color is vibrant and stays on for hours.",
    "Customer support resolved my issue quickly.",
    "Love the packaging design, very elegant.",
    "Got a free sample, and it was amazing!",
    "Easy to order and track shipment.",
    "Great value for the price.",
    "My friends keep asking where I got this from.",
    "Definitely buying more for gifts."
]
bad_messages = [
    "Very disappointed with the product.",
    "Customer service was unhelpful.",
    "Poor quality, not worth the money.",
    "Item arrived damaged.",
    "Would not recommend.",
    "The product stopped working after a week.",
    "Not as described, very misleading.",
    "Shipping took far too long.",
    "Packaging was terrible, item leaked.",
    "Waste of money, avoid this.",
    "The scent was overpowering and unpleasant.",
    "I had an allergic reaction to the cream.",
    "Difficult to get a refund.",
    "The bottle was half empty on arrival.",
    "Instructions were missing from the box.",
    "The shade did not match the description.",
    "Customer support never replied to my emails.",
    "Too expensive for the quality received.",
    "The applicator broke after first use.",
    "Left my skin feeling dry and irritated."
]
neutral_messages = [
    "The product is okay.",
    "Received as expected.",
    "Average experience.",
    "Nothing special, nothing bad.",
    "It's fine for the price.",
    "Product matches the description.",
    "Neither good nor bad, just average.",
    "Arrived on time, works as intended.",
    "The packaging was standard, nothing fancy.",
    "Used it a few times, results are decent.",
    "Shipping time was average.",
    "No issues, but nothing stood out.",
    "Color is close to what I expected.",
    "The size is as described.",
    "It does the job, but not remarkable.",
    "I might buy again if on sale.",
    "Instructions were clear and easy to follow.",
    "Blends in with my other products just fine.",
    "Met my basic expectations."
]

keywords = [
    "avon true", "avon naturals", "avon care", "anew clinical", "avon representative",
    "avon brochure", "avon campaign", "avon order", "avon delivery", "avon discount"
]

for i in range(300):
    post_id = f"{1000001 + i}"
    page_id = page_ids[i % len(page_ids)]
    # Randomly assign a created_time between today and three months ago
    days_ago = random.randint(0, 90)
    created_time = datetime.utcnow() - timedelta(days=days_ago)
    likes = random.randint(0, 50)
    num_reactions = random.randint(0, 5)
    reactions = [
        {"type": random.choice(reaction_types), "user": f"user{random.randint(1, 350)}"}
        for _ in range(num_reactions)
    ]
    scraped_at = created_time + timedelta(minutes=random.randint(1, 10))
    # Randomly assign sentiment
    sentiment = random.choice(['good', 'bad', 'neutral'])
    if sentiment == 'good':
        message = random.choice(good_messages)
    elif sentiment == 'bad':
        message = random.choice(bad_messages)
    else:
        message = random.choice(neutral_messages)
    matched_keywords = random.sample(keywords, k=random.randint(1, 3))
    posts.append({
        "post_id": post_id,
        "page_id": page_id,
        "created_time": created_time.isoformat() + "Z",
        "likes": likes,
        "reactions": reactions,
        "scraped_at": scraped_at.isoformat() + "Z",
        "message": message,
        "matched_keywords": matched_keywords
    })

with open("./dummy_scraped_posts.json", "w") as f:
    json.dump(posts, f, indent=2)
print(f"Dummy scraped posts generation complete. {len(posts)} posts written to dummy_scraped_posts.json.")