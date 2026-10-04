import { beforeAll, beforeEach, vitest } from 'vitest';
import { cacheClientClose, cacheClientConnect } from './utils/common/cache.js';
import { afterAll } from 'vitest';

beforeEach(() => {
  vitest.resetAllMocks();
  vitest.restoreAllMocks();
  vitest.clearAllMocks();
});

beforeAll(async () => {
  await cacheClientConnect();
});

afterAll(async () => {
  await cacheClientClose();
});
