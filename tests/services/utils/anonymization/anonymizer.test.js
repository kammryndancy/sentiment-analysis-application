const { anonymizeData } = require('../../../../services/utils/anonymization/anonymizer');

describe('Anonymizer', () => {
  describe('anonymizeData', () => {
    it('should anonymize PII when enabled', () => {
      const input = {
        message: 'Contact John Doe at john.doe@email.com or call 123-456-7890',
        user: 'johndoe123'
      };

      const result = anonymizeData(input, {
        anonymizePII: true,
        anonymizeUsernames: true
      });

      expect(result.message).not.toContain('john.doe@email.com');
      expect(result.message).not.toContain('123-456-7890');
      expect(result.message).not.toContain('John Doe');
      expect(result.user).not.toBe('johndoe123');
    });

    it('should preserve original data when anonymization is disabled', () => {
      const input = {
        message: 'Contact John at john@email.com',
        user: 'johndoe123'
      };

      const result = anonymizeData(input, {
        anonymizePII: false,
        anonymizeUsernames: false
      });

      expect(result).toEqual(input);
    });

    it('should handle empty input', () => {
      const input = {
        message: '',
        user: ''
      };

      const result = anonymizeData(input, {
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

      const result = anonymizeData(input, {
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

      const result = anonymizeData(input, {
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

      const result = anonymizeData(input, {
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
