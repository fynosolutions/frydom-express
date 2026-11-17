import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://frydomexpressny.com',
  output: 'static',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
