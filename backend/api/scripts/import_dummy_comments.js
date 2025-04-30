// Script to import dummy_scraped_comments.json into the MongoDB comments collection
import fs from 'fs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'tonique';
const collectionName = process.env.MONGO_SCRAPED_COMMENTS_COLLECTION || 'scraped_comments';

async function importDummyComments() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const comments = JSON.parse(fs.readFileSync('./scripts/dummy_scraped_comments.json', 'utf-8'));
    // Remove all existing dummy comments (optional, comment out if not desired)
    await collection.deleteMany({});
    await collection.insertMany(comments);
    console.log(`${comments.length} dummy comments imported into collection '${collectionName}'.`);
    await client.close();
  } catch (err) {
    console.error('Failed to import dummy comments:', err);
    process.exit(1);
  }
}

importDummyComments();
