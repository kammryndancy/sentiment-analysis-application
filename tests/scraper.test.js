const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');
const { mock } = require('jest-mock-extended');

// app.set('port', 3001);

describe('Scraper Routes', () => {
  beforeAll(async () => {
    // Connect to a test database
    // Mock the mongoose connect method
    mongoose.connect = jest.fn().mockResolvedValue();
    app.listen = jest.fn();
    
    // Mock the MongoDB collections with comprehensive methods
    const mockCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      insertMany: jest.fn().mockResolvedValue({ insertedIds: ['123'] }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 }),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      project: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };
    
    // Set up app.locals.db
    app.locals.db = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
  });

  afterAll(async () => {
    // Disconnect from the test database
    mongoose.connect.mockRestore();
    
    // Clean up
    app.locals.db = null;
  });

  it('should run the scraper', async () => {
    const res = await request(app)
      .post('/api/scraper/run')
      .send({
        pageIds: ['12345']
      });
    expect(res.statusCode).toEqual(202);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });

  it('should get the scraper status', async () => {
    const res = await request(app).get('/api/scraper/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get comments', async () => {
    const res = await request(app).get('/api/scraper/comments');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get stats', async () => {
    const res = await request(app).get('/api/scraper/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
});
