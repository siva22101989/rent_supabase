
import { describe, it, expect } from 'vitest';
import { 
  isApiSuccess, 
  isApiError, 
  isDefined 
} from '@/types/utils';

describe('Utility Types & Guards', () => {
  
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('hello')).toBe(true);
      expect(isDefined(123)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('API Response Guards', () => {
    it('should identify successful responses', () => {
      const success = { success: true, data: { id: 1 } };
      // @ts-ignore - testing runtime check
      expect(isApiSuccess(success)).toBe(true);
      // @ts-ignore - testing runtime check
      expect(isApiError(success)).toBe(false);
    });

    it('should identify error responses', () => {
      const error = { success: false, error: 'Failed' };
      // @ts-ignore - testing runtime check
      expect(isApiSuccess(error)).toBe(false);
      // @ts-ignore - testing runtime check
      expect(isApiError(error)).toBe(true);
    });
  });

});
