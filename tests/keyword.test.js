const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');
const { mock } = require('jest-mock-extended');

// app.set('port', 3001);

describe('Keyword Routes', () => {
  beforeAll(async () => {
    // Connect to a test database
    // Mock the mongoose connect method
    mongoose.connect = jest.fn().mockResolvedValue();
    app.listen = jest.fn();
    jest.useFakeTimers();
    
    // Mock the MongoDB collections
    const mockCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      insertMany: jest.fn().mockResolvedValue({ insertedIds: ['123'] })
    };
    
    // Set up app.locals.db
    app.locals.db = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
  });

  afterAll(async () => {
    // Restore the original mongoose connect method
    mongoose.connect.mockRestore();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should get all keywords', async () => {
    const res = await request(app).get('/api/keywords');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should add a new keyword', async () => {
    const res = await request(app)
      .post('/api/keywords')
      .send({
        keyword: 'lipstick',
        category: 'cosmetics',
        description: 'Test Keyword'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });

  it('should not add a new keyword without keyword', async () => {
    const res = await request(app)
      .post('/api/keywords')
      .send({
        category: 'cosmetics',
        description: 'Test Keyword'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
  });

  it('should remove a keyword', async () => {
    // First, add a keyword to be removed
    const addRes = await request(app)
      .post('/api/keywords')
      .send({
        keyword: 'foundation',
        category: 'cosmetics',
        description: 'Test Keyword'
      });
    expect(addRes.statusCode).toEqual(201);

    // Then, remove the added keyword
    const res = await request(app).delete('/api/keywords/foundation');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should import keywords', async () => {
    const res = await request(app)
      .post('/api/keywords/import')
      .send({
        keywords: [{
          keyword: 'mascara',
          category: 'cosmetics',
          description: 'Test Keyword'
        }, {
          keyword: 'eyeliner',
          category: 'cosmetics',
          description: 'Test Keyword'
        }]
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });
});
