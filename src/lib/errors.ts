export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public details?: any;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Erro no banco de dados', details?: any) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Muitas requisições. Tente novamente mais tarde.') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}

export function handleApiError(error: unknown): ApiResponse {
    console.error('[API Error]:', error);

    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                message: error.message,
                code: error.code,
                details: error.details,
            },
        };
    }

    // Handle generic errors
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return {
        success: false,
        error: {
            message,
            code: 'INTERNAL_ERROR',
        },
    };
}
