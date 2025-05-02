// Hugging Face Sentiment Analysis Service
// Requires HUGGINGFACE_API_KEY in your .env file
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import AppSettings from '../../models/AppSettings.js';

// --- Decrypt logic copied from settingsController.js ---
import crypto from 'crypto';
const ENCRYPTION_KEY = (process.env.DATA_ENCRYPTION_KEY || 'default_fb_cred_key_32b!').padEnd(32, '!').slice(0, 32); // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size is 16 bytes for aes-256-cbc

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function getHuggingFaceModelUrl() {
  // Get model id from appsettings collection
  let settings;
  try {
    // Try to get the first (or only) settings doc
    settings = await AppSettings.findOne();
  } catch (e) {
    throw new Error('Unable to access AppSettings collection: ' + e.message);
  }
  if (!settings || !settings.huggingface_model_id) {
    throw new Error('huggingface_model_id not set in AppSettings');
  }
  return `https://api-inference.huggingface.co/models/${settings.huggingface_model_id}`;
}

async function getHuggingFaceApiKey() {
  let settings;
  try {
    settings = await AppSettings.findOne();
  } catch (e) {
    throw new Error('Unable to access AppSettings collection: ' + e.message);
  }
  if (!settings || !settings.huggingface_api_key) {
    throw new Error('huggingface_api_key not set in AppSettings');
  }
  return decrypt(settings.huggingface_api_key);
}

export async function analyzeSentimentHuggingFace(text) {
  const API_KEY = await getHuggingFaceApiKey();
  if (!mongoose.connection.readyState) throw new Error('Mongoose/MongoDB is not connected');
  if (!text) throw new Error('Text must be provided');
  
  // Dynamically get the model API URL
  const apiUrl = await getHuggingFaceModelUrl();
  const response = await fetch(apiUrl, {
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
