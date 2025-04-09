const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');
const { mock } = require('jest-mock-extended');

// app.set('port', 3001);

describe('Page Routes', () => {
  beforeAll(async () => {
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
    // Restore the original mongoose connect method
    mongoose.connect.mockRestore();
    
    // Clean up
    app.locals.db = null;
  });

  it('should get all pages', async () => {
    const res = await request(app).get('/api/pages');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should add a new page', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({
        pageId: '12345',
        name: 'Test Page',
        description: 'Test Description'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });

  it('should not add a new page without pageId', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({
        name: 'Test Page',
        description: 'Test Description'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should remove a page', async () => {
    // First, add a page to be removed
    const addRes = await request(app)
      .post('/api/pages')
      .send({
        pageId: '54321',
        name: 'Test Page to Remove',
        description: 'Test Description'
      });
    expect(addRes.statusCode).toEqual(201);

    // Then, remove the added page
    const res = await request(app).delete('/api/pages/54321');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should import pages', async () => {
    const res = await request(app)
      .post('/api/pages/import')
      .send({
        pageIds: ['67890', '09876']
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });
});
