import solidJs from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';
import path from 'node:path';

export default defineConfig({
  base: '/25d-renderer/',
  integrations: [solidJs()],
  vite: {
    resolve: {
      alias: {
        '@app': path.resolve('./src'),
      },
    },
  },
});
