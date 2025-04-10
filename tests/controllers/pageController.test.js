const { getAllPages, addPage, removePage, importPages } = require('../../controllers/pageController');

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
      params: {}
    };

    res = {
      status: statusMock,
      json: jsonMock
    };
  });

  describe('getAllPages', () => {
    it('should return all pages successfully', async () => {
      const mockPages = [
        { page_id: '123', name: 'Test Page 1' },
        { page_id: '456', name: 'Test Page 2' }
      ];
      mockPageManager.getAllPages.mockResolvedValue(mockPages);

      await getAllPages(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockPages
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockPageManager.getAllPages.mockRejectedValue(error);

      await getAllPages(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('addPage', () => {
    beforeEach(() => {
      req.body = {
        page_id: '789',
        name: 'New Test Page',
        description: 'New Test Description'
      };
    });

    it('should add a page successfully', async () => {
      const expectedResponse = { 
        success: true, 
        page: { 
          page_id: '789', 
          name: 'New Test Page',
          description: 'New Test Description' 
        } 
      };
      
      mockPageManager.addPage.mockResolvedValue(expectedResponse);

      await addPage(req, res);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should validate required fields', async () => {
      req.body = { name: 'New Test Page' }; // Missing page_id

      await addPage(req, res);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Both page_id and name are required'
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockPageManager.addPage.mockRejectedValue(error);

      await addPage(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('removePage', () => {
    it('should remove a page successfully', async () => {
      req.params.page_id = '123';
      mockPageManager.removePage.mockResolvedValue({ 
        success: true, 
        page_id: '123' 
      });

      await removePage(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Page removed successfully'
      });
      expect(mockPageManager.removePage).toHaveBeenCalledWith('123');
    });

    it('should handle non-existent pages', async () => {
      req.params.page_id = 'nonexistent';
      mockPageManager.removePage.mockResolvedValue({
        success: false,
        error: 'Page not found'
      });

      await removePage(req, res);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Page not found'
      });
    });

    it('should handle errors', async () => {
      req.params.page_id = '123';
      const error = new Error('Database error');
      mockPageManager.removePage.mockRejectedValue(error);

      await removePage(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('importPages', () => {
    const pageIds = ['123', '456', '789'];

    it('should import pages successfully', async () => {
      req.body = { pageIds };
      mockPageManager.importPages.mockResolvedValue({ 
        success: true, 
        imported: 3 
      });

      await importPages(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Pages imported successfully'
      });
      expect(mockPageManager.importPages).toHaveBeenCalledWith(pageIds);
    });

    it('should validate the request body', async () => {
      req.body = {}; // Missing pageIds

      await importPages(req, res);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'pageIds array is required'
      });
    });

    it('should handle errors', async () => {
      req.body = { pageIds };
      const error = new Error('Import error');
      mockPageManager.importPages.mockRejectedValue(error);

      await importPages(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Import error'
      });
    });
  });
});
