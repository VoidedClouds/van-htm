import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: 'true',
    __TEST__: 'true',
    // Code Paths
    __CONTROL_FLOWS__: 'true',
    __HTML_ENTITY_DECODING__: 'true'
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
