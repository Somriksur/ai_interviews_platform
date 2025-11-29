# Design Document

## Overview

This design implements a universal email sending system for the HireFlow application that can deliver emails to any email address across all providers (Gmail, Yahoo, Outlook, custom domains). The system uses Resend API with proper domain verification to enable unrestricted email delivery while maintaining security, reliability, and ease of testing.

The key innovation is implementing a dual-mode system: development mode for safe testing and production mode for universal delivery. The system includes comprehensive error handling, logging, and validation to ensure reliable email delivery.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Application   │
│   Components    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Service   │
│   Interface     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│  Dev   │ │Production│
│ Mode   │ │  Mode    │
└───┬────┘ └────┬─────┘
    │           │
    ▼           ▼
┌─────────────────┐
│   Resend API    │
└─────────────────┘
```

### Component Interaction Flow

1. **Application Layer**: Components trigger email notifications (interview invitations, completions, feedback)
2. **Email Service Interface**: Validates input, determines mode, formats email content
3. **Mode Handler**: Routes to development or production mode based on configuration
4. **Resend API**: Delivers emails with proper authentication and tracking

## Components and Interfaces

### 1. Email Service Interface

```typescript
interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

interface EmailService {
  sendEmail(config: EmailConfig): Promise<EmailResult>;
  validateEmail(email: string): boolean;
  isConfigured(): boolean;
}
```

### 2. Environment Configuration

```typescript
interface EmailEnvironment {
  RESEND_API_KEY: string;
  EMAIL_DEV_MODE: boolean;
  DEV_EMAIL?: string;
  VERIFIED_DOMAIN: string;
  SENDER_EMAIL: string;
  SENDER_NAME: string;
}
```

### 3. Email Notification Interface

```typescript
interface NotificationService {
  notifyInterviewAssigned(
    candidateEmail: string,
    candidateName: string,
    role: string,
    questionsCount: number,
    interviewId: string
  ): Promise<EmailResult>;
  
  notifyInterviewCompleted(
    recruiterEmail: string,
    candidateName: string,
    role: string,
    interviewId: string
  ): Promise<EmailResult>;
  
  notifyFeedbackReady(
    candidateEmail: string,
    candidateName: string,
    role: string,
    interviewId: string
  ): Promise<EmailResult>;
}
```

## Data Models

### Email Message Model

```typescript
interface EmailMessage {
  id?: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}
```

### Email Validation Model

```typescript
interface EmailValidation {
  isValid: boolean;
  email: string;
  errors: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Universal email delivery

*For any* valid email address with any domain (Gmail, Yahoo, Outlook, custom), when the system sends an email, the recipient address passed to the email service should match the input address exactly.

**Validates: Requirements 1.1**

### Property 2: Error logging completeness

*For any* email sending failure, the system should log an error message that includes the recipient email address and error details.

**Validates: Requirements 2.1**

### Property 3: Invalid email rejection

*For any* string that does not match valid email format (missing @, invalid characters, malformed domain), the validation function should return false and the system should return a validation error.

**Validates: Requirements 2.2**

### Property 4: Success confirmation structure

*For any* successfully sent email, the return value should have success=true and include a non-empty email ID string.

**Validates: Requirements 2.4**

### Property 5: Development mode redirection

*For any* recipient email address, when EMAIL_DEV_MODE is true, the actual recipient passed to the email API should be the DEV_EMAIL address, not the original recipient.

**Validates: Requirements 3.1**

### Property 6: Production mode preservation

*For any* recipient email address, when EMAIL_DEV_MODE is false, the actual recipient passed to the email API should match the original recipient exactly.

**Validates: Requirements 3.2**

### Property 7: Mode determination from environment

*For any* value of EMAIL_DEV_MODE environment variable (true, false, "true", "false"), the system should correctly interpret it as a boolean and route emails accordingly.

**Validates: Requirements 3.3**

### Property 8: Concurrent email processing

*For any* set of N email requests sent simultaneously, all N requests should complete and return results without blocking each other, and the completion time should not be N times the single email time.

**Validates: Requirements 4.2**

### Property 9: Verified domain usage

*For any* email sent by the system, the from address should contain the VERIFIED_DOMAIN from configuration and match the pattern "name@domain".

**Validates: Requirements 6.1**

### Property 10: Consistent sender name

*For any* email sent by the system, the from field should include "HireFlow" as the sender name in the format "HireFlow <email@domain>".

**Validates: Requirements 6.2**

### Property 11: Reply-to header inclusion

*For any* email sent by the system, the email headers should include a reply-to field that allows recipients to respond.

**Validates: Requirements 6.3**

### Property 12: Actionable error messages

*For any* error that occurs during email sending, the error message should include specific information about what failed and how to resolve it (e.g., "Domain not verified - visit resend.com/domains").

**Validates: Requirements 7.4**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid email format
   - Missing required fields
   - Invalid configuration

2. **Service Errors**
   - API key missing or invalid
   - Domain not verified
   - Rate limiting
   - Network failures

3. **Delivery Errors**
   - Recipient address rejected
   - Bounce notifications
   - Timeout errors

### Error Handling Strategy

```typescript
class EmailError extends Error {
  constructor(
    message: string,
    public code: string,
    public recipient?: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

// Error codes
const ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  MISSING_CONFIG: 'MISSING_CONFIG',
  DOMAIN_NOT_VERIFIED: 'DOMAIN_NOT_VERIFIED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
};
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  suggestion?: string;
  recipient?: string;
}
```

### Logging Strategy

- **Info Level**: Successful email sends with recipient and email ID
- **Warn Level**: Configuration issues, development mode usage
- **Error Level**: Failed sends with full error details and recipient
- **Debug Level**: Email content, headers, API responses

## Testing Strategy

### Unit Testing

We will use **Jest** as the testing framework for unit tests.

**Unit test coverage:**

1. **Email validation function**
   - Test with valid email formats
   - Test with invalid formats (missing @, spaces, special characters)
   - Test edge cases (very long emails, unicode characters)

2. **Mode determination**
   - Test with EMAIL_DEV_MODE=true
   - Test with EMAIL_DEV_MODE=false
   - Test with undefined/missing configuration

3. **Error message formatting**
   - Test that errors include recipient information
   - Test that errors include actionable suggestions
   - Test different error types produce appropriate messages

4. **Configuration validation**
   - Test with complete configuration
   - Test with missing API key
   - Test with missing domain configuration

### Property-Based Testing

We will use **fast-check** as the property-based testing library for TypeScript.

**Property-based testing requirements:**

- Each property-based test MUST run a minimum of 100 iterations
- Each test MUST be tagged with a comment referencing the correctness property
- Tag format: `// Feature: universal-email-sending, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property test coverage:**

1. **Property 1: Universal email delivery**
   - Generate random email addresses with various domains
   - Verify recipient address preservation

2. **Property 2: Error logging completeness**
   - Generate random error scenarios
   - Verify all errors are logged with recipient details

3. **Property 3: Invalid email rejection**
   - Generate invalid email strings
   - Verify all are rejected with validation errors

4. **Property 4: Success confirmation structure**
   - Generate random valid email configurations
   - Verify all successful sends return proper structure

5. **Property 5: Development mode redirection**
   - Generate random recipient addresses
   - Verify all are redirected in dev mode

6. **Property 6: Production mode preservation**
   - Generate random recipient addresses
   - Verify all are preserved in production mode

7. **Property 7: Mode determination**
   - Generate various environment variable values
   - Verify correct boolean interpretation

8. **Property 8: Concurrent processing**
   - Generate random sets of email requests
   - Verify non-blocking concurrent execution

9. **Property 9: Verified domain usage**
   - Generate random email content
   - Verify all use verified domain in from address

10. **Property 10: Consistent sender name**
    - Generate random email content
    - Verify all include "HireFlow" sender name

11. **Property 11: Reply-to header inclusion**
    - Generate random email configurations
    - Verify all include reply-to headers

12. **Property 12: Actionable error messages**
    - Generate various error scenarios
    - Verify all error messages include helpful information

### Integration Testing

Integration tests will verify:

1. **Resend API integration**
   - Test actual email sending with Resend API
   - Verify API responses are handled correctly
   - Test with different email providers

2. **Environment configuration**
   - Test loading configuration from .env files
   - Test configuration validation on startup

3. **End-to-end email flow**
   - Test complete flow from notification trigger to email delivery
   - Verify email content formatting
   - Test with real email addresses (in test environment)

## Implementation Notes

### Domain Verification Setup

To enable universal email sending, a domain must be verified with Resend:

1. **Obtain a domain** (free options available: Freenom, GitHub Pages)
2. **Add domain to Resend** at resend.com/domains
3. **Configure DNS records** (TXT, MX, DKIM)
4. **Verify domain** in Resend dashboard
5. **Update configuration** with verified domain

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxx

# Domain configuration
VERIFIED_DOMAIN=yourdomain.com
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=HireFlow

# Mode configuration
EMAIL_DEV_MODE=false  # Set to true for development
DEV_EMAIL=test@example.com  # Used when EMAIL_DEV_MODE=true
```

### Migration from Current System

1. Keep existing email functions for backward compatibility
2. Add new universal email service alongside
3. Gradually migrate notification functions to use new service
4. Remove old implementation once migration is complete
5. Update all environment configurations

### Performance Considerations

- Use async/await for non-blocking email sending
- Implement connection pooling for Resend API
- Add retry logic for transient failures
- Consider queue system for high-volume sending
- Monitor API rate limits and implement backoff

### Security Considerations

- Never log email content in production
- Validate all email addresses before sending
- Use environment variables for sensitive configuration
- Implement rate limiting to prevent abuse
- Monitor for suspicious sending patterns
- Use TLS for all API communications (handled by Resend)

## Dependencies

- **Resend API**: Email delivery service
- **fast-check**: Property-based testing library
- **Jest**: Unit testing framework
- **Node.js fetch API**: HTTP client for API calls
- **Environment variables**: Configuration management

## Future Enhancements

1. **Email templates**: Rich HTML templates with variables
2. **Attachment support**: Send PDFs, documents with emails
3. **Batch sending**: Optimize for sending to multiple recipients
4. **Email tracking**: Track opens, clicks, bounces
5. **Queue system**: Redis-based queue for high volume
6. **Retry mechanism**: Automatic retry with exponential backoff
7. **Email scheduling**: Send emails at specific times
8. **Webhook handling**: Process Resend webhooks for delivery status
