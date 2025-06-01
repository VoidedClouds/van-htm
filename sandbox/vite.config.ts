import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  define: {
    __DEV__: 'true',
    __TEST__: 'true',
    // Code Paths
    __HTML_ENTITY_DECODING__: 'true'
  },
  root: __dirname,
  resolve: {
    alias: {
      'vanjs-htm': path.resolve(__dirname, '../src/index.ts'),
      '@': path.resolve(__dirname, '../')
    }
  },
  server: {
    port: 5555,
    open: true
  }
});
