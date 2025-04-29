const FacebookCredential = require('../models/FacebookCredential');
const AppSettings = require('../models/AppSettings');
const HuggingFaceModel = require('../models/HuggingFaceModel');
const crypto = require('crypto');

const ENCRYPTION_KEY = (process.env.FB_CRED_ENCRYPTION_KEY || 'default_fb_cred_key_32b!').padEnd(32, '!').slice(0, 32); // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size is 16 bytes for aes-256-cbc

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

exports.getFacebookCredentials = async (req, res) => {
  try {
    const cred = await FacebookCredential.findOne();
    if (!cred) return res.json({});
    res.json({
      facebook_app_id: decrypt(cred.facebook_app_id),
      facebook_app_secret: decrypt(cred.facebook_app_secret)
      // facebook_access_token is intentionally omitted for security
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveFacebookCredentials = async (req, res) => {
  try {
    const { facebook_app_id, facebook_app_secret } = req.body;
    // Request a long-lived app access token from Facebook
    const fetch = require('node-fetch');
    // const tokenRes = await fetch(
    //   `https://graph.facebook.com/oauth/access_token?client_id=${encodeURIComponent(facebook_app_id)}&client_secret=${encodeURIComponent(facebook_app_secret)}&grant_type=client_credentials`
    // );
    const tokenData = { access_token: ';{ARf4Ax4]!4]+f5kC,tACcT1y0}1wBk' };
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to fetch Facebook app access token' });
    }
    let cred = await FacebookCredential.findOne();
    if (!cred) {
      cred = new FacebookCredential({
        facebook_app_id: encrypt(facebook_app_id),
        facebook_app_secret: encrypt(facebook_app_secret),
        facebook_access_token: encrypt(tokenData.access_token)
      });
    } else {
      cred.facebook_app_id = encrypt(facebook_app_id);
      cred.facebook_app_secret = encrypt(facebook_app_secret);
      cred.facebook_access_token = encrypt(tokenData.access_token);
      cred.updatedAt = Date.now();
    }
    await cred.save();
    // Reinitialize facebookScraper service if available
    if (req.app && req.app.locals && req.app.locals.facebookScraper) {
      try {
        await req.app.locals.facebookScraper.initializeFB();
      } catch (e) {
        console.error('Failed to reinitialize FacebookScraper:', e);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Google Cloud NLP API Key Management ---
exports.getGoogleCloudNLPKeyStatus = async (req, res) => {
  try {
    const settings = await AppSettings.findOne();
    res.json({ googleCloudNLPKeyExists: !!(settings && settings.google_cloud_nlp_api_key) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveGoogleCloudNLPKey = async (req, res) => {
  try {
    const { google_cloud_nlp_api_key } = req.body;
    if (!google_cloud_nlp_api_key) return res.status(400).json({ error: 'API key required' });
    // Encrypt before saving
    const encrypted = encrypt(google_cloud_nlp_api_key);
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = new AppSettings({ google_cloud_nlp_api_key: encrypted });
    } else {
      settings.google_cloud_nlp_api_key = encrypted;
      settings.updatedAt = Date.now();
    }
    await settings.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Hugging Face API Key and Model Management ---
exports.getHuggingFaceKeyStatus = async (req, res) => {
  try {
    const settings = await AppSettings.findOne();
    res.json({ huggingFaceKeyExists: !!(settings && settings.huggingface_api_key) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveHuggingFaceKeyAndModel = async (req, res) => {
  try {
    const { huggingface_api_key, huggingface_model_id } = req.body;
    if (!huggingface_api_key && !huggingface_model_id) return res.status(400).json({ error: 'API key or model required' });
    let settings = await AppSettings.findOne();
    let changed = false;
    if (huggingface_api_key) {
      // Encrypt before saving
      const encrypted = encrypt(huggingface_api_key);
      if (!settings) {
        settings = new AppSettings({ huggingface_api_key: encrypted });
      } else {
        settings.huggingface_api_key = encrypted;
        changed = true;
      }
    }
    if (huggingface_model_id) {
      settings.huggingface_model_id = huggingface_model_id;
      changed = true;
    }
    if (changed || !settings._id) {
      settings.updatedAt = Date.now();
      await settings.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHuggingFaceModels = async (req, res) => {
  try {
    const models = await HuggingFaceModel.find({}, '-_id model_id name description');
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHuggingFaceSelection = async (req, res) => {
  try {
    const settings = await AppSettings.findOne();
    res.json({ huggingface_model_id: settings?.huggingface_model_id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
