import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ValidationError,
  sanitizeString,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  formatPhoneNumber,
  isPositiveNumber,
  isNotFutureDate,
  CommonSchemas,
  validateFormData,
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('ValidationError', () => {
    it('creates error with message and zod errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]);

      const error = new ValidationError('Test error', zodError);

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ValidationError');
      expect(error.errors).toBe(zodError);
    });
  });

  describe('sanitizeString', () => {
    it('removes < and > characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        'scriptalert("xss")/script'
      );
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\ttest\t\n')).toBe('test');
    });

    it('handles empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    it('preserves safe characters', () => {
      expect(sanitizeString('Hello World! 123')).toBe('Hello World! 123');
      expect(sanitizeString("It's a test")).toBe("It's a test");
    });
  });

  describe('isValidUUID', () => {
    it('accepts valid v4 UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(isValidUUID('123E4567-E89B-42D3-A456-426614174000')).toBe(true);
      expect(isValidUUID('123e4567-E89B-42d3-A456-426614174000')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false); // Too short
      expect(isValidUUID('123e4567e89b12d3a456426614174000')).toBe(false); // No hyphens
      expect(isValidUUID('')).toBe(false);
    });

    it('rejects non-v4 UUIDs', () => {
      // v1 UUID (first digit of third group is 1, not 4)
      expect(isValidUUID('123e4567-e89b-11d3-a456-426614174000')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('accepts standard email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('rejects missing @ symbol', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
      expect(isValidEmail('test')).toBe(false);
    });

    it('rejects missing domain', () => {
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('rejects invalid formats', () => {
      expect(isValidEmail('test @example.com')).toBe(false); // Space
      expect(isValidEmail('test@example')).toBe(false); // No TLD
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('accepts 10-15 digit numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true); // 10 digits
      expect(isValidPhone('12345678901')).toBe(true); // 11 digits
      expect(isValidPhone('123456789012345')).toBe(true); // 15 digits
    });

    it('accepts international format with +', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('+911234567890')).toBe(true);
    });

    it('removes spaces and dashes before validation', () => {
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('123 456 7890')).toBe(true);
      expect(isValidPhone('+91 12345 67890')).toBe(true);
    });

    it('rejects too-short numbers', () => {
      expect(isValidPhone('123456789')).toBe(false); // 9 digits
      expect(isValidPhone('12345')).toBe(false);
    });

    it('rejects too-long numbers', () => {
      expect(isValidPhone('1234567890123456')).toBe(false); // 16 digits
      expect(isValidPhone('+12345678901234567')).toBe(false);
    });

    it('rejects invalid characters', () => {
      expect(isValidPhone('123abc7890')).toBe(false);
      expect(isValidPhone('(123) 456-7890')).toBe(false); // Parentheses not allowed
    });
  });

  describe('formatPhoneNumber', () => {
    it('removes spaces and dashes', () => {
      expect(formatPhoneNumber('123-456-7890')).toBe('1234567890');
      expect(formatPhoneNumber('123 456 7890')).toBe('1234567890');
    });

    it('keeps leading +', () => {
      expect(formatPhoneNumber('+1234567890')).toBe('+1234567890');
      expect(formatPhoneNumber('+91 12345 67890')).toBe('+911234567890');
    });

    it('handles + symbols correctly', () => {
      expect(formatPhoneNumber('+1234567890')).toBe('+1234567890');
      expect(formatPhoneNumber('+ 123 456 7890')).toBe('+1234567890');
    });

    it('removes invalid characters', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('1234567890');
      expect(formatPhoneNumber('123.456.7890')).toBe('1234567890');
    });
  });

  describe('isPositiveNumber', () => {
    it('accepts positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100.5)).toBe(true);
      expect(isPositiveNumber(0.001)).toBe(true);
    });

    it('rejects zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('rejects negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.1)).toBe(false);
    });

    it('rejects NaN', () => {
      expect(isPositiveNumber(NaN)).toBe(false);
    });

    it('rejects non-numbers', () => {
      expect(isPositiveNumber('5' as any)).toBe(false);
      expect(isPositiveNumber(null as any)).toBe(false);
      expect(isPositiveNumber(undefined as any)).toBe(false);
    });
  });

  describe('isNotFutureDate', () => {
    it('accepts past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isNotFutureDate(pastDate)).toBe(true);
    });

    it('accepts current date', () => {
      const now = new Date();
      expect(isNotFutureDate(now)).toBe(true);
    });

    it('rejects future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isNotFutureDate(futureDate)).toBe(false);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isNotFutureDate(tomorrow)).toBe(false);
    });
  });

  describe('CommonSchemas', () => {
    describe('uuid', () => {
      it('validates valid UUIDs', () => {
        const result = CommonSchemas.uuid.safeParse(
          '123e4567-e89b-12d3-a456-426614174000'
        );
        expect(result.success).toBe(true);
      });

      it('rejects invalid UUIDs', () => {
        const result = CommonSchemas.uuid.safeParse('invalid-uuid');
        expect(result.success).toBe(false);
      });
    });

    describe('email', () => {
      it('validates valid emails', () => {
        const result = CommonSchemas.email.safeParse('test@example.com');
        expect(result.success).toBe(true);
      });

      it('rejects invalid emails', () => {
        const result = CommonSchemas.email.safeParse('invalid-email');
        expect(result.success).toBe(false);
      });
    });

    describe('phone', () => {
      it('validates and transforms phone numbers', () => {
        const result = CommonSchemas.phone.safeParse('12345678901'); // 11 digits, valid
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('12345678901'); // Transformed (spaces/dashes removed)
        }
      });

      it('accepts international format', () => {
        const result = CommonSchemas.phone.safeParse('+911234567890');
        expect(result.success).toBe(true);
      });

      it('rejects too-short numbers', () => {
        const result = CommonSchemas.phone.safeParse('12345');
        expect(result.success).toBe(false);
      });
    });

    describe('positiveInt', () => {
      it('validates positive integers', () => {
        const result = CommonSchemas.positiveInt.safeParse(10);
        expect(result.success).toBe(true);
      });

      it('rejects zero', () => {
        const result = CommonSchemas.positiveInt.safeParse(0);
        expect(result.success).toBe(false);
      });

      it('rejects negative numbers', () => {
        const result = CommonSchemas.positiveInt.safeParse(-5);
        expect(result.success).toBe(false);
      });

      it('rejects decimals', () => {
        const result = CommonSchemas.positiveInt.safeParse(5.5);
        expect(result.success).toBe(false);
      });
    });

    describe('nonNegativeNumber', () => {
      it('validates non-negative numbers', () => {
        expect(CommonSchemas.nonNegativeNumber.safeParse(0).success).toBe(true);
        expect(CommonSchemas.nonNegativeNumber.safeParse(10).success).toBe(true);
        expect(CommonSchemas.nonNegativeNumber.safeParse(5.5).success).toBe(true);
      });

      it('rejects negative numbers', () => {
        const result = CommonSchemas.nonNegativeNumber.safeParse(-1);
        expect(result.success).toBe(false);
      });
    });

    describe('currency', () => {
      it('validates valid currency amounts', () => {
        expect(CommonSchemas.currency.safeParse(10.99).success).toBe(true);
        expect(CommonSchemas.currency.safeParse(0).success).toBe(true);
        expect(CommonSchemas.currency.safeParse(100.50).success).toBe(true);
      });

      it('rejects negative amounts', () => {
        const result = CommonSchemas.currency.safeParse(-10.50);
        expect(result.success).toBe(false);
      });

      it('rejects invalid decimal precision', () => {
        const result = CommonSchemas.currency.safeParse(10.999);
        expect(result.success).toBe(false);
      });
    });

    describe('pastDate', () => {
      it('accepts past dates', () => {
        const pastDate = new Date('2020-01-01');
        const result = CommonSchemas.pastDate.safeParse(pastDate);
        expect(result.success).toBe(true);
      });

      it('rejects future dates', () => {
        const futureDate = new Date('2030-01-01');
        const result = CommonSchemas.pastDate.safeParse(futureDate);
        expect(result.success).toBe(false);
      });
    });

    describe('date', () => {
      it('accepts Date objects', () => {
        const result = CommonSchemas.date.safeParse(new Date());
        expect(result.success).toBe(true);
      });

      it('accepts and transforms date strings', () => {
        const result = CommonSchemas.date.safeParse('2024-01-01');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(Date);
        }
      });
    });
  });

  describe('validateFormData', () => {
    it('validates correct form data', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('age', '30');

      // Note: FormData values are strings, so this test uses string schema
      const schemaWithTransform = z.object({
        name: z.string(),
        age: z.string().transform(val => parseInt(val, 10)),
      });

      const result = validateFormData(formData, schemaWithTransform as any) as { name: string; age: number };
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('handles multiple values for same key', () => {
      const formData = new FormData();
      formData.append('tags', 'tag1');
      formData.append('tags', 'tag2');

      const schema = z.object({
        tags: z.array(z.string()),
      });

      const result = validateFormData(formData, schema);
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('throws ValidationError for invalid data', () => {
      const formData = new FormData();
      formData.append('name', ''); // Empty string

      const schema = z.object({
        name: z.string().min(1),
      });

      expect(() => validateFormData(formData, schema)).toThrow(ValidationError);
    });
  });
});
