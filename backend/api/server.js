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

// Load environment variables
dotenv.config();

// Import routes
const pageRoutes = require('./routes/pageRoutes');
const keywordRoutes = require('./routes/keywordRoutes');
const scraperRoutes = require('./routes/scraperRoutes');
const dataProcessorRoutes = require('./routes/dataProcessorRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGO_DB
}).then(async () => {
  console.log('Connected to MongoDB');

  const nativeDb = mongoose.connection.db; // Get native db object
  app.locals.db = nativeDb; // Store native db object
  
  // Initialize managers and their data
  const pageManager = new PageManager(nativeDb);
  const keywordManager = new KeywordManager(nativeDb);
  const dataProcessorInstance = new DataProcessor(nativeDb);

  // Initialize managers with their data
  await Promise.all([
    pageManager.initializePageIds(),
    keywordManager.initializeKeywords()
  ]);

  // Store managers in app locals
  app.locals.pageManager = pageManager;
  app.locals.keywordManager = keywordManager;
  app.locals.dataProcessor = dataProcessorInstance;

  // Initialize routes after database is ready
  app.use('/api/pages', pageRoutes);
  app.use('/api/keywords', keywordRoutes);
  app.use('/api/scraper', scraperRoutes);
  app.use('/api/data-processor', dataProcessorRoutes);

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
        dataProcessor: '/api/data-processor'
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
