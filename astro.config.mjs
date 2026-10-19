import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://frydomexpress.com',
  output: 'static',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
