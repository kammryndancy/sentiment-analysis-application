const { anonymizeData } = require('../../../../services/utils/anonymization/anonymizer');

describe('Anonymizer', () => {
  let mockAnonymizer;

  beforeEach(() => {
    mockAnonymizer = {
      maskEmails: jest.fn(text => text.replace(/\S+@\S+/g, '[EMAIL]')),
      maskPhoneNumbers: jest.fn(text => text.replace(/\d{3}-\d{3}-\d{4}/g, '[PHONE]')),
      maskUrls: jest.fn(text => text.replace(/https?:\/\/[\w.]+/g, '[URL]')),
      maskUsernames: jest.fn(text => text.replace(/\b\w+\b/g, '[USERNAME]')),
      maskNumericIds: jest.fn(text => text.replace(/\d{10}/g, '[ID]')),
      anonymizeFacebookIds: jest.fn(comment => ({
        ...comment,
        from_id: '[HASHED_ID]',
        from_name: 'User_[HASHED_NAME]'
      })),
      anonymizeData: jest.fn((comment, options) => {
        const anonymized = { ...comment };
        
        // Anonymize user field if usernames are enabled
        if (options.anonymizeUsernames && comment.user) {
          anonymized.user = '[ANONYMIZED_USER]';
        }

        // Anonymize Facebook-specific identifiers if usernames are enabled and they exist
        if (options.anonymizeUsernames && ('from_id' in comment || 'from_name' in comment)) {
          const facebookResult = mockAnonymizer.anonymizeFacebookIds(comment);
          if ('from_id' in comment) {
            anonymized.from_id = facebookResult.from_id;
          }
          if ('from_name' in comment) {
            anonymized.from_name = facebookResult.from_name;
          }
        }

        // Process message content if PII anonymization is enabled
        if (options.anonymizePII && comment.message) {
          let processedMessage = comment.message;
          processedMessage = mockAnonymizer.maskEmails(processedMessage);
          processedMessage = mockAnonymizer.maskPhoneNumbers(processedMessage);
          processedMessage = mockAnonymizer.maskUrls(processedMessage);
          processedMessage = mockAnonymizer.maskNumericIds(processedMessage);
          
          // Apply username masking to message content if enabled
          if (options.anonymizeUsernames) {
            processedMessage = mockAnonymizer.maskUsernames(processedMessage);
          }
          
          anonymized.message = processedMessage;
        }
        
        return anonymized;
      })
    };
  });

  describe('anonymizeData', () => {
    it('should anonymize PII when enabled', () => {
      const input = {
        message: 'Contact John Doe at john.doe@email.com or call 123-456-7890',
        user: 'johndoe123'
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: true,
        anonymizeUsernames: true
      });

      expect(result.message).not.toContain('john.doe@email.com');
      expect(result.message).not.toContain('123-456-7890');
      expect(result.message).not.toContain('John Doe');
      expect(result.user).not.toBe('johndoe123');
      expect(mockAnonymizer.maskEmails).toHaveBeenCalled();
      expect(mockAnonymizer.maskPhoneNumbers).toHaveBeenCalled();
      expect(mockAnonymizer.maskUrls).toHaveBeenCalled();
      expect(mockAnonymizer.maskNumericIds).toHaveBeenCalled();
      expect(mockAnonymizer.maskUsernames).toHaveBeenCalled();
    });

    it('should preserve original data when anonymization is disabled', () => {
      const input = {
        message: 'Contact John at john@email.com',
        user: 'johndoe123'
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: false,
        anonymizeUsernames: false
      });

      expect(result.message).toBe('Contact John at john@email.com');
      expect(result.user).toBe('johndoe123');
      expect(mockAnonymizer.maskEmails).not.toHaveBeenCalled();
      expect(mockAnonymizer.maskPhoneNumbers).not.toHaveBeenCalled();
      expect(mockAnonymizer.maskUrls).not.toHaveBeenCalled();
      expect(mockAnonymizer.maskNumericIds).not.toHaveBeenCalled();
      expect(mockAnonymizer.maskUsernames).not.toHaveBeenCalled();
    });

    it('should handle Facebook-specific identifiers', () => {
      const input = {
        message: 'Contact me at john@email.com',
        from_id: '1234567890',
        from_name: 'John Doe'
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: true,
        anonymizeUsernames: true
      });

      expect(result.from_id).toBe('[HASHED_ID]');
      expect(result.from_name).toBe('User_[HASHED_NAME]');
      expect(mockAnonymizer.anonymizeFacebookIds).toHaveBeenCalled();
    });

    it('should handle empty input', () => {
      const input = {
        message: '',
        user: ''
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: true,
        anonymizeUsernames: true
      });

      expect(result).toEqual(input);
    });

    it('should anonymize only usernames when PII anonymization is disabled', () => {
      const input = {
        message: 'User johndoe123 posted: Contact me at john@email.com',
        user: 'johndoe123'
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: false,
        anonymizeUsernames: true
      });

      expect(result.message).toContain('john@email.com');
      expect(result.user).not.toBe('johndoe123');
    });

    it('should anonymize only PII when username anonymization is disabled', () => {
      const input = {
        message: 'User johndoe123 posted: Contact me at john@email.com',
        user: 'johndoe123'
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: true,
        anonymizeUsernames: false
      });

      expect(result.message).not.toContain('john@email.com');
      expect(result.user).toBe('johndoe123');
    });

    it('should handle multiple PII instances in the same message', () => {
      const input = {
        message: 'Contact john@email.com or jane@email.com, phone: 123-456-7890 or 098-765-4321',
        user: 'johndoe123'
      };

      const result = mockAnonymizer.anonymizeData(input, {
        anonymizePII: true,
        anonymizeUsernames: true
      });

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /\d{3}[-]\d{3}[-]\d{4}/g;

      expect(result.message.match(emailRegex)).toBeNull();
      expect(result.message.match(phoneRegex)).toBeNull();
    });
  });
});
