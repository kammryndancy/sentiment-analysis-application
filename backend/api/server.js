const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const DataProcessor = require('./services/utils/dataProcessorManager').default; 
const PageManager = require('./services/utils/PageManager');
const KeywordManager = require('./services/utils/KeywordManager');
const FacebookScraper = require('./services/facebookScraper');
const session = require('express-session');
const authMiddleware = require('./middleware/authMiddleware');
const User = require('./models/User');
const HuggingFaceModel = require('./models/HuggingFaceModel');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

// Import routes
const pageRoutes = require('./routes/pageRoutes');
const keywordRoutes = require('./routes/keywordRoutes');
const scraperRoutes = require('./routes/scraperRoutes');
const dataProcessorRoutes = require('./routes/dataProcessorRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Backend (if serving frontend in prod)
  ],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboardcat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGO_DB
}).then(async () => {
  console.log('Connected to MongoDB');

  // Ensure at least one admin user exists
  const adminCount = await User.countDocuments({ roles: 'admin' });
  if (adminCount === 0) {
    const defaultAdmin = {
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10),
      enabled: true,
      roles: ['admin'],
      approved: true
    };
    await User.create(defaultAdmin);
    console.log('Default admin user created:', defaultAdmin.username);
  }

  const nativeDb = mongoose.connection.db; // Get native db object
  app.locals.db = nativeDb; // Store native db object
  
  // --- Insert Hugging Face models from JSON config if not present ---
  const modelsPath = path.join(__dirname, 'scripts', 'util', 'huggingface_models.json');
  if (fs.existsSync(modelsPath)) {
    const modelsData = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));
    for (const model of modelsData) {
      await HuggingFaceModel.updateOne(
        { model_id: model.model_id },
        { $set: model },
        { upsert: true }
      );
    }
  }

  // Initialize managers and their data
  const pageManager = new PageManager(nativeDb);
  const keywordManager = new KeywordManager(nativeDb);
  const dataProcessorInstance = new DataProcessor(nativeDb);
  const facebookScraper = new FacebookScraper(nativeDb);

  // Initialize managers with their data
  await Promise.all([
    pageManager.initializePageIds(),
    keywordManager.initializeKeywords(),
    facebookScraper.ensureFBInitialized()
  ]);

  // Store managers in app locals
  app.locals.pageManager = pageManager;
  app.locals.keywordManager = keywordManager;
  app.locals.dataProcessor = dataProcessorInstance;
  app.locals.facebookScraper = facebookScraper;

  // Initialize routes after database is ready
  app.use('/api/pages', authMiddleware, pageRoutes);
  app.use('/api/keywords', authMiddleware, keywordRoutes);
  app.use('/api/scraper', authMiddleware, scraperRoutes);
  app.use('/api/data-processor', authMiddleware, dataProcessorRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/settings', authMiddleware, settingsRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Check MongoDB connection
      await mongoose.connection.db.admin().ping();
      res.status(200).json({ message: 'API is healthy and MongoDB is connected' });
    } catch (error) {
      res.status(500).json({ message: 'API is unhealthy', error: error.message });
    }
  });

  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'Facebook Sentiment Analysis Scraper API',
      endpoints: {
        pages: '/api/pages',
        keywords: '/api/keywords',
        scraper: '/api/scraper',
        dataProcessor: '/api/data-processor',
        auth: '/api/auth'
      }
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // Start server
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    process.exit(0);
  });

  // Export app for testing
  module.exports = { app };
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});
