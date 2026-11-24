export type EdgeWebhookEnv = {
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  PAYSTACK_SECRET: string;
  WEBHOOK_SHARED_SECRET: string;
  SUPABASE_FUNCTION_URL: string;
  SERVICE_NAME?: string;
};

export function requireSecret(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required secret: ${name}`);
  }
  return value;
}
