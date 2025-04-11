const { addPage, removePage, importPages, listPages } = require('../../controllers/pageController');

// Create simple mock objects for the tests
describe('Page Controller', () => {
  let req;
  let res;
  let mockPageManager;
  let jsonMock;
  let statusMock;

  beforeEach(() => {
    // Create mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockPageManager = {
      getPageIds: jest.fn(),
      listPages: jest.fn(),
      addPageId: jest.fn(),
      removePageId: jest.fn(),
      updatePageLastScraped: jest.fn(),
      getPagePosts: jest.fn(),
      savePost: jest.fn(),
      getAllPages: jest.fn(),
      addPage: jest.fn(),
      removePage: jest.fn(),
      importPages: jest.fn()
    };

    req = {
      app: {
        locals: {
          pageManager: mockPageManager
        }
      },
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: statusMock,
      json: jsonMock
    };
  });

  describe('listPages', () => {
    it('should return all pages successfully', async () => {
      const mockPages = [
        { page_id: '12345', name: 'Test Page 1', description: 'Description 1' },
        { page_id: '67890', name: 'Test Page 2', description: 'Description 2' }
      ];

      mockPageManager.listPages.mockResolvedValue(mockPages);

      await listPages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPages
      });
      expect(mockPageManager.listPages).toHaveBeenCalled();
    });

    it('should handle errors when getting pages', async () => {
      const error = new Error('Database error');
      mockPageManager.listPages.mockRejectedValue(error);

      await listPages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
      expect(mockPageManager.listPages).toHaveBeenCalled();
    });
  });

  describe('addPage', () => {
    it('should add a page successfully', async () => {
      const mockPage = {
        page_id: '12345',
        name: 'Test Page',
        description: 'Description'
      };

      mockPageManager.addPageId.mockResolvedValue({ success: true, page: mockPage });

      req.body = {
        page_id: '12345',
        name: 'Test Page',
        description: 'Description'
      };

      await addPage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Page added successfully',
        data: mockPage
      });
      expect(mockPageManager.addPageId).toHaveBeenCalledWith('12345', 'Test Page', 'Description');
    });

    it('should handle missing required fields', async () => {
      req.body = {
        name: 'Test Page'
      };

      await addPage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Both page_id and name are required'
      });
      expect(mockPageManager.addPageId).not.toHaveBeenCalled();
    });

    it('should handle page already exists error', async () => {
      mockPageManager.addPageId.mockResolvedValue({ success: false, error: 'Page already exists' });

      req.body = {
        page_id: '12345',
        name: 'Test Page'
      };

      await addPage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page already exists'
      });
      expect(mockPageManager.addPageId).toHaveBeenCalled();
    });
  });

  describe('removePage', () => {
    it('should remove a page successfully', async () => {
      mockPageManager.removePageId.mockResolvedValue({ success: true });

      req.params = {
        page_id: '12345'
      };

      await removePage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Page removed successfully'
      });
      expect(mockPageManager.removePageId).toHaveBeenCalledWith('12345');
    });

    it('should handle missing page_id', async () => {
      req.params = {};

      await removePage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page ID is required'
      });
      expect(mockPageManager.removePageId).not.toHaveBeenCalled();
    });

    it('should handle page not found error', async () => {
      mockPageManager.removePageId.mockResolvedValue({ success: false, error: 'Page not found' });

      req.params = {
        page_id: '12345'
      };

      await removePage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page not found'
      });
      expect(mockPageManager.removePageId).toHaveBeenCalled();
    });
  });

  describe('importPages', () => {
    it('should import pages successfully', async () => {
      const mockPages = [
        { success: true, page: { page_id: '12345', name: 'Test Page 1' } },
        { success: false, error: 'Page already exists' }
      ];

      mockPageManager.addPageId.mockImplementation((pageId, name) => 
        pageId === '12345' ? { success: true, page: { page_id: '12345', name: 'Test Page 1' } } : 
        { success: false, error: 'Page already exists' }
      );

      req.body = {
        pageIds: ['12345', '67890']
      };

      await importPages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Pages imported successfully',
        data: {
          total: 2,
          success: 1,
          failed: 1,
          results: mockPages
        }
      });
      expect(mockPageManager.addPageId).toHaveBeenCalledTimes(2);
    });

    it('should handle missing pageIds', async () => {
      req.body = {};

      await importPages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'pageIds array is required'
      });
      expect(mockPageManager.addPageId).not.toHaveBeenCalled();
    });

    it('should handle invalid pageIds format', async () => {
      req.body = {
        pageIds: 'not-an-array'
      };

      await importPages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'pageIds array is required'
      });
      expect(mockPageManager.addPageId).not.toHaveBeenCalled();
    });
  });
});
