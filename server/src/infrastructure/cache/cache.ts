import { createClient, type RedisClientType } from 'redis';
import { env } from '../../configs/env/index.js';
import { logger } from '../../configs/logger/index.js';
import { subscribeShutdown } from '../../utils/shutdown/index.js';

class CacheClient {
  private static instance: RedisClientType;
  private static isConnected = false;

  // Prevent outside instantiation
  private constructor() {}

  public static getInstance(): RedisClientType {
    if (!this.instance) {
      this.instance = createClient({
        url: env.CACHE_URL,
        socket: {
          reconnectStrategy: (retries: number) => {
            const delay = Math.min(retries * 50, 2000);
            return delay;
          },
        },
      });

      CacheClient.setupEventListeners();

      // Connect immediately
      this.instance.connect().catch((error) => {
        logger.error('Redis initial connection failed:', error);
      });
      subscribeShutdown(async () => {
        await CacheClient.closeConnection();
      });
    }

    return this.instance;
  }

  private static setupEventListeners(): void {
    CacheClient.instance.on('connect', () => {
      logger.info('Connected to Redis');
    });

    CacheClient.instance.on('ready', () => {
      CacheClient.isConnected = true;
      logger.info('Redis client is ready');
    });

    CacheClient.instance.on('error', (error: unknown) => {
      CacheClient.isConnected = false;
      logger.error('Redis connection error:', error);
    });

    CacheClient.instance.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });

    CacheClient.instance.on('end', () => {
      CacheClient.isConnected = false;
      logger.info('Redis connection ended');
    });
  }

  public static async closeConnection(): Promise<void> {
    if (this.instance) {
      try {
        await CacheClient.instance.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error(`Redis connection close error: `, error);
      }
    }
  }

  public static isReady(): boolean {
    return CacheClient.isConnected;
  }
}

const cacheInstance = CacheClient.getInstance();

export { cacheInstance, CacheClient };
