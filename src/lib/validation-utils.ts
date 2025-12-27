import { z } from 'zod';

/**
 * Interface for consistent form state across the application
 */
export type FormState = {
    message: string;
    success: boolean;
    errors?: Record<string, string[] | undefined>;
    data?: Record<string, any>;
};

/**
 * Formats Zod validation errors into a flat record of field names and error messages.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[] | undefined> {
    return error.flatten().fieldErrors;
}

/**
 * Returns a human-readable joined string of validation errors.
 */
export function getFriendlyErrorMessage(errors: Record<string, string[]>): string {
    return Object.values(errors).flat().join(', ');
}
