import { createClient } from 'redis';
import { getReservistCacheKey } from '../../../domains/reservists/constants/cach.js';

const cacheClient = createClient({
  url: process.env.CACHE_URL,
  socket: {
    reconnectStrategy: (retries: number) => {
      const delay = Math.min(retries * 50, 2000);
      return delay;
    },
  },
});

export async function cacheClientConnect() {
  try {
    await cacheClient.connect();
  } catch (error) {
    console.error('Redis initial connection failed:', error);
    throw error;
  }
}

export async function getReservistCache(reservistId: string): Promise<string | null> {
  const reservistCache = await cacheClient.get(getReservistCacheKey(reservistId));
  return reservistCache;
}
