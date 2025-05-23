import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: 'true',
    __TEST__: 'true',
    // Code Paths
    __HTML_ENTITY_DECODING__: 'true'
  },
  test: {
    coverage: {
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: ['src/**/*.d.{js,ts,jsx,tsx}', '**/vitest.js']
    },
    environment: 'jsdom',
    globals: true
  }
});
