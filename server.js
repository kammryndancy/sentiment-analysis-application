const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const DataProcessor = require('./services/utils/dataProcessorManager').default; 

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

  // Load initial data from JSON files
  const loadInitialData = async (db) => { // Pass native db object
    const pageIdsCollection = db.collection('page_ids');
    const keywordsCollection = db.collection('keywords');

    // Load page IDs from JSON and add new ones to the database
    const pageIdsPath = path.join(__dirname, 'page_ids.json');
    const pageIdsData = JSON.parse(fs.readFileSync(pageIdsPath, 'utf8'));

    for (const pageId of pageIdsData) {
      const existingPage = await pageIdsCollection.findOne({ page_id: pageId });
      if (!existingPage) {
        await pageIdsCollection.insertOne({ page_id: pageId });
        console.log(`Added new page ID: ${pageId}`);
      }
    }
    console.log('Page IDs loaded and updated');

    // Load keywords from JSON and add new ones to the database
    const keywordsPath = path.join(__dirname, 'keywords.json');
    const keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));

    for (const keyword of keywordsData) {
      const existingKeyword = await keywordsCollection.findOne({ keyword: keyword });
      if (!existingKeyword) {
        await keywordsCollection.insertOne({ keyword: keyword });
        console.log(`Added new keyword: ${keyword}`);
      }
    }
    console.log('Keywords loaded and updated');
  };

  await loadInitialData(nativeDb); // Pass native db object

  // Initialize DataProcessor
  const dataProcessorInstance = new DataProcessor(nativeDb); // Pass the native db instance
  app.locals.dataProcessor = dataProcessorInstance; // Make instance available to routes

// Routes
app.use('/api/pages', pageRoutes);
app.use('/api/keywords', keywordRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/dataProcessor', dataProcessorRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ message: 'API is healthy and MongoDB is connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ message: 'API is unhealthy or MongoDB is not connected' });
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
      dataProcessor: '/api/dataProcessor'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server only if this file is run directly, not when imported by tests
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
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
