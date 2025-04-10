const { jest } = require('@jest/globals');
const PageManager = require('../../../services/utils/PageManager.cjs');

// Simple mock functions
const mockToArray = jest.fn().mockResolvedValue([]);
const mockFindOne = jest.fn().mockResolvedValue(null);
const mockInsertOne = jest.fn().mockResolvedValue({ insertedId: '123' });
const mockDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

// Mock database
const mockCollection = jest.fn().mockReturnValue({
  find: mockFind,
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  deleteOne: mockDeleteOne,
  updateOne: mockUpdateOne
});

const mockDb = { collection: mockCollection };

describe('PageManager', () => {
  let pageManager;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new instance
    pageManager = new PageManager(mockDb);
  });
  
  test('getPageIds should return page IDs', async () => {
    mockToArray.mockResolvedValueOnce([
      { page_id: '123' },
      { page_id: '456' }
    ]);
    
    const result = await pageManager.getPageIds();
    
    expect(result).toEqual(['123', '456']);
    expect(mockCollection).toHaveBeenCalledWith('page_ids');
    expect(mockFind).toHaveBeenCalled();
  });
  
  test('getPageIds should handle errors', async () => {
    mockToArray.mockRejectedValueOnce(new Error('DB error'));
    
    const result = await pageManager.getPageIds();
    
    expect(result).toEqual([]);
  });
  
  test('listPages should return pages', async () => {
    const mockPages = [
      { page_id: '123', name: 'Page 1' },
      { page_id: '456', name: 'Page 2' }
    ];
    mockToArray.mockResolvedValueOnce(mockPages);
    
    const result = await pageManager.listPages();
    
    expect(result).toEqual(mockPages);
    expect(mockCollection).toHaveBeenCalledWith('page_ids');
  });
  
  test('listPages should handle errors', async () => {
    mockToArray.mockRejectedValueOnce(new Error('DB error'));
    
    const result = await pageManager.listPages();
    
    expect(result).toEqual([]);
  });
  
  test('addPageId should add a page', async () => {
    const result = await pageManager.addPageId('123', 'Test Page', 'Description');
    
    expect(result.success).toBe(true);
    expect(mockCollection).toHaveBeenCalledWith('page_ids');
    expect(mockInsertOne).toHaveBeenCalled();
  });
  
  test('addPageId should not add invalid page ID', async () => {
    const result = await pageManager.addPageId('');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid');
  });
  
  test('addPageId should not add duplicate page', async () => {
    mockFindOne.mockResolvedValueOnce({ page_id: '123' });
    
    const result = await pageManager.addPageId('123');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('exists');
  });
  
  test('removePageId should remove a page', async () => {
    const result = await pageManager.removePageId('123');
    
    expect(result.success).toBe(true);
    expect(mockCollection).toHaveBeenCalledWith('page_ids');
    expect(mockDeleteOne).toHaveBeenCalledWith({ page_id: '123' });
  });
  
  test('removePageId should handle not found', async () => {
    mockDeleteOne.mockResolvedValueOnce({ deletedCount: 0 });
    
    const result = await pageManager.removePageId('123');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });
});
