import { beforeAll, beforeEach, vitest } from 'vitest';
import { cacheClientConnect } from './utils/reservists/cache.js';

beforeEach(() => {
  vitest.resetAllMocks();
  vitest.restoreAllMocks();
  vitest.clearAllMocks();
});

beforeAll(async () => {
  await cacheClientConnect();
});
