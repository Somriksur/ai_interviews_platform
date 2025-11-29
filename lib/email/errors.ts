/**
 * Email Error Classes and Error Codes
 * Provides structured error handling for email operations
 */

export const ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  MISSING_CONFIG: 'MISSING_CONFIG',
  DOMAIN_NOT_VERIFIED: 'DOMAIN_NOT_VERIFIED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export class EmailError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recipient?: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'EmailError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailError);
    }
  }
}

/**
 * Create an actionable error message with suggestions
 */
export function createActionableError(
  code: ErrorCode,
  recipient?: string,
  originalError?: string
): { error: string; code: ErrorCode; suggestion?: string; recipient?: string } {
  const suggestions: Record<ErrorCode, string> = {
    [ERROR_CODES.INVALID_EMAIL]: 'Please check the email address format. It should be like: user@example.com',
    [ERROR_CODES.MISSING_CONFIG]: 'Add RESEND_API_KEY to your .env.local file. Get your key from https://resend.com/api-keys',
    [ERROR_CODES.DOMAIN_NOT_VERIFIED]: 'Verify your domain at https://resend.com/domains. For testing, set EMAIL_DEV_MODE=true in .env.local',
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 'The email service is temporarily unavailable. Please try again in a few minutes.',
    [ERROR_CODES.DELIVERY_FAILED]: 'Email delivery failed. Check the recipient address and try again.',
  };

  const errorMessages: Record<ErrorCode, string> = {
    [ERROR_CODES.INVALID_EMAIL]: 'Invalid email address format',
    [ERROR_CODES.MISSING_CONFIG]: 'Email service not configured',
    [ERROR_CODES.DOMAIN_NOT_VERIFIED]: 'Domain not verified',
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Email service unavailable',
    [ERROR_CODES.DELIVERY_FAILED]: 'Email delivery failed',
  };

  return {
    error: originalError || errorMessages[code],
    code,
    suggestion: suggestions[code],
    recipient,
  };
}

/**
 * Log email error with full context
 */
export function logEmailError(
  code: ErrorCode,
  recipient: string,
  error: string | Error
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  
  console.error('❌ Email Error:');
  console.error('   Code:', code);
  console.error('   Recipient:', recipient);
  console.error('   Error:', errorMessage);
  
  const actionable = createActionableError(code, recipient);
  if (actionable.suggestion) {
    console.error('   💡 Suggestion:', actionable.suggestion);
  }
}
