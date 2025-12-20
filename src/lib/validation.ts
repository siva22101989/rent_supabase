import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Input Validation Middleware
 * Provides reusable validation utilities for API routes and server actions
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error);
    }
    throw error;
  }
}

/**
 * Validate FormData against a Zod schema
 */
export function validateFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): T {
  const data: Record<string, any> = {};
  
  formData.forEach((value, key) => {
    // Handle multiple values for same key
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  });

  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Form validation failed', error);
    }
    throw error;
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validate date is not in future
 */
export function isNotFutureDate(date: Date): boolean {
  return date <= new Date();
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  uuid: z.string().uuid('Invalid ID format'),
  
  email: z.string().email('Invalid email address'),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  
  positiveInt: z.number()
    .int('Must be a whole number')
    .positive('Must be greater than 0'),
  
  nonNegativeNumber: z.number()
    .nonnegative('Cannot be negative'),
  
  currency: z.number()
    .nonnegative('Amount cannot be negative')
    .multipleOf(0.01, 'Invalid currency amount'),
  
  date: z.date()
    .or(z.string().transform(str => new Date(str))),
  
  pastDate: z.date()
    .refine(date => date <= new Date(), 'Date cannot be in the future'),
};

/**
 * Create a validated API response
 */
export function createValidatedResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  errors?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

/**
 * Middleware wrapper for API routes with validation
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const data = await validateRequestBody(request, schema);
      return await handler(data, request);
    } catch (error) {
      if (error instanceof ValidationError) {
        return createErrorResponse(
          error.message,
          400,
          error.errors.errors
        );
      }
      
      return createErrorResponse(
        'Internal server error',
        500
      );
    }
  };
}
