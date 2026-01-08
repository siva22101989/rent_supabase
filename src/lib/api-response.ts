
export type ApiResponse<T = void> = {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>; // Field validation errors
};

export function successResponse<T>(message: string, data?: T): ApiResponse<T> {
    return {
        success: true,
        message,
        data
    };
}

export function errorResponse(message: string, errors?: Record<string, string[]>): ApiResponse<void> {
    return {
        success: false,
        message,
        errors
    };
}
