// Google Cloud Natural Language API Integration (Phase 3)
// Retrieves Google Cloud NLP API key from MongoDB and decrypts it
const fetch = require('node-fetch');
const AppSettings = require('../../models/AppSettings');
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'default_fb_cred_key_32b!'; // 32 bytes
const IV_LENGTH = 32;

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  // Use utf8 encoding for the key, as in your .env
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
  if (keyBuffer.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 32 bytes for aes-256-cbc, but got ${keyBuffer.length} bytes. Check your .env and use a 32-character key.`);
  }
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function getGoogleCloudNLPApiKey() {
  const settings = await AppSettings.findOne();
  if (!settings || !settings.google_cloud_nlp_api_key) throw new Error('Google Cloud NLP API key not set');
  return decrypt(settings.google_cloud_nlp_api_key);
}

async function analyzeSentimentGoogle(text) {
  const API_KEY = await getGoogleCloudNLPApiKey();
  const API_URL = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${API_KEY}`;
  const body = {
    document: { type: 'PLAIN_TEXT', content: text },
    encodingType: 'UTF8'
  };
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

module.exports = { analyzeSentimentGoogle };
