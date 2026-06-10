// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://januscore.com',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: { port: 3000 },
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
