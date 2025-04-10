const { preprocessText } = require('../../../../services/utils/dataProcessing/text-preprocessor-shim');
const natural = require('natural');

jest.mock('natural', () => ({
  WordTokenizer: jest.fn().mockImplementation(() => ({
    tokenize: jest.fn(text => text.split(' '))
  })),
  PorterStemmer: {
    stem: jest.fn(word => word + '_stemmed')
  },
  WordNet: jest.fn().mockImplementation(() => ({
    lookup: jest.fn().mockResolvedValue([{ lemma: 'lemmatized' }])
  }))
}));

describe('Text Preprocessor', () => {
  const defaultOptions = {
    removeStopwords: true,
    performLemmatization: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('preprocessText', () => {
    it('should preprocess text with default options', () => {
      const input = 'This is a test message';
      const result = preprocessText(input, defaultOptions);

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('tokens');
      expect(Array.isArray(result.tokens)).toBe(true);
    });

    it('should handle empty input', () => {
      const result = preprocessText('', defaultOptions);

      expect(result.text).toBe('');
      expect(result.tokens).toEqual([]);
    });

    it('should preserve text when no processing options are enabled', () => {
      const input = 'This is a test message';
      const result = preprocessText(input, {
        removeStopwords: false,
        performLemmatization: false
      });

      expect(result.text).toBe(input.toLowerCase());
    });

    it('should remove stopwords when enabled', () => {
      const input = 'this is a test message';
      const result = preprocessText(input, {
        ...defaultOptions,
        removeStopwords: true
      });

      // Assuming 'test message' remains after stopword removal
      expect(result.text).not.toContain('this');
      expect(result.text).not.toContain('is');
      expect(result.text).not.toContain('a');
    });

    it('should handle special characters and whitespace', () => {
      const input = '  This!  is@#$ a test...  ';
      const result = preprocessText(input, defaultOptions);

      expect(result.text).not.toContain('!');
      expect(result.text).not.toContain('@#$');
      expect(result.text).not.toContain('...');
    });

    it('should normalize case', () => {
      const input = 'ThIs Is A tEsT';
      const result = preprocessText(input, {
        removeStopwords: false,
        performLemmatization: false
      });

      expect(result.text).toBe('this is a test');
    });
  });
});
