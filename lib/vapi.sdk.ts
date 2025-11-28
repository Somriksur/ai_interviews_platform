/* eslint-disable @typescript-eslint/no-explicit-any */
import Vapi from "@vapi-ai/web";

// Get the public web token from environment
const VAPI_WEB_TOKEN = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!VAPI_WEB_TOKEN) {
    console.error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not defined in environment variables");
}

// Handle both default and named exports
const VapiConstructor = (Vapi as any).default || Vapi;

// Initialize Vapi client with your public key
export const vapi = new (VapiConstructor as any)(VAPI_WEB_TOKEN!);
