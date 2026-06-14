import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_ENDPOINT || !process.env.B2_BUCKET_NAME) {
  console.error("❌ Missing B2 Environment Variables");
  process.exit(1);
}

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_ENDPOINT = process.env.B2_ENDPOINT.startsWith('http')
  ? process.env.B2_ENDPOINT
  : `https://${process.env.B2_ENDPOINT}`;
const B2_REGION = new URL(B2_ENDPOINT).hostname.split('.')[1];

if (!B2_REGION) {
  throw new Error("B2_ENDPOINT must use the Backblaze S3 endpoint format");
}

// Backblaze uses standard S3 architecture
export const s3Client = new S3Client({
  region: B2_REGION,
  endpoint: B2_ENDPOINT,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
});
