/**
 * Email Service Configuration
 * Handles environment variables and configuration validation
 */

export interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface EmailEnvironment {
  RESEND_API_KEY: string;
  EMAIL_DEV_MODE: boolean;
  DEV_EMAIL?: string;
  VERIFIED_DOMAIN?: string;
  SENDER_EMAIL?: string;
  SENDER_NAME: string;
}

/**
 * Load and validate email configuration from environment variables
 */
export function loadEmailConfig(): EmailEnvironment | null {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY not configured. Email functionality disabled.");
    return null;
  }

  // Parse dev mode - handle string "true"/"false" and boolean
  const devModeStr = process.env.EMAIL_DEV_MODE;
  const emailDevMode = devModeStr === "true" || devModeStr === true;

  return {
    RESEND_API_KEY: apiKey,
    EMAIL_DEV_MODE: emailDevMode,
    DEV_EMAIL: process.env.DEV_EMAIL,
    VERIFIED_DOMAIN: process.env.VERIFIED_DOMAIN,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    SENDER_NAME: process.env.SENDER_NAME || "HireFlow",
  };
}

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get the sender email address
 * Uses SENDER_EMAIL if configured, otherwise falls back to default
 */
export function getSenderEmail(config: EmailEnvironment): string {
  if (config.SENDER_EMAIL) {
    return `${config.SENDER_NAME} <${config.SENDER_EMAIL}>`;
  }
  
  // Fallback to Resend default for testing
  return `${config.SENDER_NAME} <onboarding@resend.dev>`;
}

/**
 * Determine the recipient email based on mode
 */
export function getRecipientEmail(originalRecipient: string, config: EmailEnvironment): string {
  if (config.EMAIL_DEV_MODE) {
    const devEmail = config.DEV_EMAIL || "delivered@resend.dev";
    console.log(`📧 DEV MODE: Redirecting email from ${originalRecipient} to ${devEmail}`);
    return devEmail;
  }
  
  return originalRecipient;
}
