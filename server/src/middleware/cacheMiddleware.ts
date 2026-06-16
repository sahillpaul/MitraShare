import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import type { AuthRequest } from './authMiddleware.js';

interface CacheOptions {
  userAware?: boolean; // Append userId to cache key (for per-user responses like /me)
}

/**
 * Build the cache key for a profile endpoint.
 * Exported so controllers can call redis.del(profileCacheKey(userId)) for invalidation.
 */
export const profileCacheKey = (userId: string) => `cache:/api/users/me:${userId}`;
export const publicProfileCacheKey = (userId: string) => `cache:/api/users/${userId}`;

export const cacheRequest = (durationInSeconds: number, options?: CacheOptions) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        // 1. Create a unique cache key based on the exact URL and query parameters
        // e.g., "cache:/api/files/library?semester=4&subject=DBMS"
        let key = `cache:${req.originalUrl || req.url}`;

        // For user-aware routes (like /me), append the userId so each user gets their own cache
        if (options?.userAware) {
            const userId = (req as AuthRequest).user?.userId;
            if (userId) {
                key += `:${userId}`;
            }
        }

        try {
            // 2. Check if this exact request is already saved in Redis RAM (Cache Hit)
            const cachedData = await redis.get(key);

            if (cachedData) {
                // We found it! Send it instantly. Do NOT call next().
                return res.status(200).json(cachedData);
            }

            // 3. CACHE MISS. The data is not in RAM. We must ask MongoDB.


            // We "hijack" the res.json function. When the controller finally calls res.json() with the MongoDB data, 
            // we intercept it, save a copy to Redis, and THEN send it to the user.
            const originalSend = res.json;
            res.json = function (body): any {
                // Save the fresh MongoDB data to Redis, and set it to expire/delete itself after X seconds
                redis.setex(key, durationInSeconds, body);

                // Return control back to the normal express flow
                return originalSend.call(this, body);
            };

            // Proceed to the controller (MongoDB)
            next();
        } catch (error) {
            // If Redis crashes for any reason, don't break the app. Just skip the cache and go straight to Mongo.
            console.error("Redis Cache Error:", error);
            next();
        }
    };
};