# Implementation Plan

- [-] 1. Set up email service infrastructure and configuration
  - Create email configuration interface and types
  - Implement environment variable loading and validation
  - Create email error classes with error codes
  - Set up logging utilities for email operations
  - _Requirements: 5.1, 5.2, 3.3, 3.4_

- [ ] 1.1 Write unit tests for configuration validation
  - Test with complete configuration
  - Test with missing API key
  - Test with missing domain configuration
  - Test default mode behavior
  - _Requirements: 5.1, 5.2, 3.4_

- [-] 2. Implement email validation functionality
  - Create email validation function with regex pattern
  - Implement validation error response formatting
  - Add validation for edge cases (unicode, long emails)
  - _Requirements: 2.2_

- [ ] 2.1 Write property test for invalid email rejection
  - **Property 3: Invalid email rejection**
  - **Validates: Requirements 2.2**

- [ ] 2.2 Write unit tests for email validation
  - Test valid email formats
  - Test invalid formats (missing @, spaces, special characters)
  - Test edge cases (very long emails, unicode characters)
  - _Requirements: 2.2_

- [-] 3. Implement dual-mode email routing system
  - Create mode determination logic from environment variables
  - Implement development mode email redirection
  - Implement production mode direct sending
  - Add mode-specific logging
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.1 Write property test for development mode redirection
  - **Property 5: Development mode redirection**
  - **Validates: Requirements 3.1**

- [ ] 3.2 Write property test for production mode preservation
  - **Property 6: Production mode preservation**
  - **Validates: Requirements 3.2**

- [ ] 3.3 Write property test for mode determination
  - **Property 7: Mode determination from environment**
  - **Validates: Requirements 3.3**

- [ ] 3.4 Write unit tests for mode switching
  - Test with EMAIL_DEV_MODE=true
  - Test with EMAIL_DEV_MODE=false
  - Test with undefined/missing configuration
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 4. Implement core email sending service
  - Create sendEmail function with Resend API integration
  - Implement proper from address formatting with verified domain
  - Add sender name "HireFlow" to all emails
  - Implement reply-to header inclusion
  - Add success response with email ID
  - _Requirements: 1.1, 6.1, 6.2, 6.3, 2.4_

- [ ] 4.1 Write property test for universal email delivery
  - **Property 1: Universal email delivery**
  - **Validates: Requirements 1.1**

- [ ] 4.2 Write property test for verified domain usage
  - **Property 9: Verified domain usage**
  - **Validates: Requirements 6.1**

- [ ] 4.3 Write property test for consistent sender name
  - **Property 10: Consistent sender name**
  - **Validates: Requirements 6.2**

- [ ] 4.4 Write property test for reply-to header inclusion
  - **Property 11: Reply-to header inclusion**
  - **Validates: Requirements 6.3**

- [ ] 4.5 Write property test for success confirmation structure
  - **Property 4: Success confirmation structure**
  - **Validates: Requirements 2.4**

- [ ] 5. Implement comprehensive error handling
  - Add error logging with recipient details
  - Implement actionable error messages with suggestions
  - Create error response formatting
  - Add specific handling for domain verification errors
  - Add specific handling for service unavailability errors
  - _Requirements: 2.1, 2.3, 7.4, 6.4_

- [ ] 5.1 Write property test for error logging completeness
  - **Property 2: Error logging completeness**
  - **Validates: Requirements 2.1**

- [ ] 5.2 Write property test for actionable error messages
  - **Property 12: Actionable error messages**
  - **Validates: Requirements 7.4**

- [ ] 5.3 Write unit tests for error handling
  - Test error messages include recipient information
  - Test error messages include actionable suggestions
  - Test different error types produce appropriate messages
  - Test domain not verified error handling
  - _Requirements: 2.1, 2.3, 7.4, 6.4_

- [ ] 6. Implement concurrent email processing
  - Ensure sendEmail function is fully async
  - Add support for Promise.all for batch sending
  - Implement non-blocking concurrent execution
  - _Requirements: 4.2_

- [ ] 6.1 Write property test for concurrent email processing
  - **Property 8: Concurrent email processing**
  - **Validates: Requirements 4.2**

- [ ] 7. Update notification service to use new email system
  - Update notifyInterviewAssigned to use new email service
  - Update notifyInterviewCompleted to use new email service
  - Update notifyFeedbackReady to use new email service
  - Maintain backward compatibility during migration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Create test script for manual email testing
  - Create interactive test script with email input prompt
  - Add support for testing different email providers
  - Display clear delivery status and email ID
  - Show actionable error messages on failure
  - Add instructions for domain verification if needed
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Update environment configuration
  - Add VERIFIED_DOMAIN to .env.local
  - Add SENDER_EMAIL to .env.local
  - Add SENDER_NAME to .env.local
  - Update EMAIL_DEV_MODE documentation
  - Create .env.example with all required variables
  - _Requirements: 5.1, 6.1, 6.2_

- [x] 10. Create domain verification documentation
  - Document step-by-step domain verification process
  - Include free domain options (Freenom, GitHub Pages)
  - Add DNS record configuration instructions
  - Include troubleshooting guide
  - Add quick setup guide for 10-minute setup
  - _Requirements: 6.1, 6.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Install fast-check for property-based testing
  - Add fast-check to package.json dependencies
  - Configure Jest to work with fast-check
  - _Requirements: All property tests_

- [ ] 13. Integration testing with real email providers
  - Test sending to Gmail addresses
  - Test sending to Yahoo addresses
  - Test sending to Outlook addresses
  - Test sending to custom domain addresses
  - Verify delivery times are under 2 minutes
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 4.1_

- [ ] 14. Final checkpoint - Verify complete system
  - Ensure all tests pass, ask the user if questions arise.
