import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("❌ Missing Upstash Redis configurations in .env");
    process.exit(1);
}

// Initialize the serverless connection
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log("⚡ Redis connection initialized");