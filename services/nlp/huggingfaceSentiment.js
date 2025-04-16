// Hugging Face Sentiment Analysis Service
// Requires HUGGINGFACE_API_KEY in your .env file
import fetch from 'node-fetch';

const API_URL = 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

export async function analyzeSentimentHuggingFace(text) {
  if (!API_KEY) throw new Error('HUGGINGFACE_API_KEY not set in environment');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: text })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }
  const result = await response.json();
  return result;
}
