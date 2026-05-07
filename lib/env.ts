function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.local.example to .env.local and fill in values.`,
    );
  }
  return value;
}

export const env = {
  // Convex
  NEXT_PUBLIC_CONVEX_URL: required(
    "NEXT_PUBLIC_CONVEX_URL",
    process.env.NEXT_PUBLIC_CONVEX_URL,
  ),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: required(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
  CLERK_SECRET_KEY: required("CLERK_SECRET_KEY", process.env.CLERK_SECRET_KEY),
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET ?? "",

  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
