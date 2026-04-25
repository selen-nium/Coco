import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Skip validation in development to avoid ngrok URL mismatch issues
  if (
    process.env.NODE_ENV === "development" || 
    url.includes("localhost") || 
    url.includes("127.0.0.1")
  ) {
    console.log("[twilio] Skipping signature validation for local development");
    return true;
  }

  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
