// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import auth from 'auth-astro';

// https://astro.build/config
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://januscore.com',
  output: 'server',
  adapter: node({ mode: "standalone" }),
  server: { port: 3000, host: true },
  integrations: [react(), sitemap(), auth()],

  vite: {
    plugins: [tailwindcss()],
  },
});
