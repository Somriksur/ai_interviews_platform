/**
 * Email Validation
 * Validates email addresses and provides detailed error messages
 */

import { ERROR_CODES, createActionableError } from './errors';

export interface EmailValidation {
  isValid: boolean;
  email: string;
  errors: string[];
}

/**
 * Comprehensive email validation regex
 * Supports:
 * - Standard email formats
 * - Subdomains
 * - Plus addressing (user+tag@domain.com)
 * - International domains
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmed = email.trim();

  // Check length constraints
  if (trimmed.length === 0 || trimmed.length > 254) {
    return false;
  }

  // Check for whitespace
  if (/\s/.test(trimmed)) {
    return false;
  }

  // Check basic format
  if (!EMAIL_REGEX.test(trimmed)) {
    return false;
  }

  // Additional validation: check local and domain parts
  const [local, domain] = trimmed.split('@');
  
  if (!local || !domain) {
    return false;
  }

  // Local part (before @) should not exceed 64 characters
  if (local.length > 64) {
    return false;
  }

  // Domain should have at least one dot and valid TLD
  if (!domain.includes('.')) {
    return false;
  }

  return true;
}

/**
 * Validate email with detailed error messages
 * @param email - Email address to validate
 * @returns Validation result with errors
 */
export function validateEmailDetailed(email: string): EmailValidation {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, email: email || '', errors };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    errors.push('Email cannot be empty');
  }

  if (trimmed.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }

  if (/\s/.test(trimmed)) {
    errors.push('Email cannot contain whitespace');
  }

  if (!trimmed.includes('@')) {
    errors.push('Email must contain @ symbol');
  } else {
    const [local, domain] = trimmed.split('@');
    
    if (!local) {
      errors.push('Email must have a local part before @');
    } else if (local.length > 64) {
      errors.push('Local part is too long (max 64 characters)');
    }

    if (!domain) {
      errors.push('Email must have a domain after @');
    } else if (!domain.includes('.')) {
      errors.push('Domain must include a top-level domain (e.g., .com)');
    }
  }

  if (errors.length === 0 && !EMAIL_REGEX.test(trimmed)) {
    errors.push('Email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    email: trimmed,
    errors,
  };
}

/**
 * Validate email and return error response if invalid
 * @param email - Email address to validate
 * @returns Error response or null if valid
 */
export function validateEmailForSending(email: string): { success: false; error: string; code: string; suggestion: string } | null {
  if (!validateEmail(email)) {
    const validation = validateEmailDetailed(email);
    const errorResponse = createActionableError(
      ERROR_CODES.INVALID_EMAIL,
      email,
      validation.errors.join(', ')
    );
    
    return {
      success: false,
      ...errorResponse,
    };
  }

  return null;
}
