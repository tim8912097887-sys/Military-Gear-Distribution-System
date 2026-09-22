import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable globals like 'describe', 'it', 'expect' (optional)
    globals: true,
    environment: 'node',
    include: ['./src/**/*.{test,spec}.ts'],
    exclude: [
      ...configDefaults.exclude,
      'src/__tests__/setup.ts',
      'dist',
      'coverage',
      'src/__tests__/utils/*.ts',
      'src/__tests__/global-setup.ts',
    ], // Exclude setup file from test files
    // Setup file for environment variables or global mocks
    setupFiles: ['./src/__tests__/setup.ts'],
    globalSetup: './src/__tests__/global-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
    fileParallelism: false,
  },
});
