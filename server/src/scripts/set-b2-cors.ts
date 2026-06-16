/**
 * ONE-TIME SCRIPT: Configure CORS on Backblaze B2 bucket via S3 API.
 *
 * Backblaze B2 does not expose CORS settings in its web UI.
 * This script uses the AWS SDK v3 PutBucketCorsCommand to inject
 * a CORS configuration directly into the bucket, allowing the
 * browser to upload files via Presigned URLs from allowed origins.
 *
 * Usage:  npx tsx src/scripts/set-b2-cors.ts
 */

import "dotenv/config";
import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
  type CORSRule,
} from "@aws-sdk/client-s3";

// ─── Configuration ──────────────────────────────────────────────────────────

const ALLOWED_ORIGINS: string[] = [
  "https://mitrashare.vercel.app", // Production (Vercel)
  "http://localhost:5173",          // Local dev  (Vite)
];

const ALLOWED_METHODS: string[] = ["PUT", "POST", "GET", "HEAD", "DELETE"];

const ALLOWED_HEADERS: string[] = ["*"]; // Let the browser send any header

const EXPOSE_HEADERS: string[] = ["ETag"]; // Needed for multipart upload completion

const MAX_AGE_SECONDS = 3600; // Cache preflight response for 1 hour

// ─── Validate env vars ─────────────────────────────────────────────────────

const requiredEnvVars = [
  "B2_KEY_ID",
  "B2_APPLICATION_KEY",
  "B2_ENDPOINT",
  "B2_BUCKET_NAME",
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]?.trim()) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const B2_KEY_ID = process.env.B2_KEY_ID!.trim();
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY!.trim();
const B2_ENDPOINT = process.env.B2_ENDPOINT!.trim();
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!.trim();

// ─── S3 Client (pointed at Backblaze B2) ────────────────────────────────────

const s3 = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region: "us-east-005", // B2 ignores this, but the SDK requires it
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
});

// ─── CORS Rule ──────────────────────────────────────────────────────────────

const corsRule: CORSRule = {
  AllowedOrigins: ALLOWED_ORIGINS,
  AllowedMethods: ALLOWED_METHODS,
  AllowedHeaders: ALLOWED_HEADERS,
  ExposeHeaders: EXPOSE_HEADERS,
  MaxAgeSeconds: MAX_AGE_SECONDS,
};

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("━".repeat(60));
  console.log("🪣  Backblaze B2 CORS Configurator");
  console.log("━".repeat(60));
  console.log(`   Bucket:   ${B2_BUCKET_NAME}`);
  console.log(`   Endpoint: ${B2_ENDPOINT}`);
  console.log(`   Origins:  ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`   Methods:  ${ALLOWED_METHODS.join(", ")}`);
  console.log("━".repeat(60));

  // 1. Apply the CORS configuration
  console.log("\n⏳ Applying CORS configuration...");

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: B2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [corsRule],
      },
    })
  );

  console.log("✅ CORS configuration applied successfully!\n");

  // 2. Verify by reading it back
  console.log("🔍 Verifying — reading CORS config back from bucket...\n");

  const { CORSRules } = await s3.send(
    new GetBucketCorsCommand({ Bucket: B2_BUCKET_NAME })
  );

  if (!CORSRules || CORSRules.length === 0) {
    console.error("⚠️  Verification failed: No CORS rules found on bucket.");
    process.exit(1);
  }

  console.log("📋 Active CORS Rules:");
  console.log(JSON.stringify(CORSRules, null, 2));
  console.log("\n✅ Verification passed. CORS is now configured on your B2 bucket.");
  console.log("   Browsers at the allowed origins can now upload files via Presigned URLs.\n");
}

main().catch((err: unknown) => {
  console.error("\n❌ Script failed:\n", err);
  process.exit(1);
});
