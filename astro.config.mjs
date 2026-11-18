import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  session: false,
  devToolbar: {
    enabled: false,
  },
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [
    react({
      include: ['**/admin/**', '**/components/admin/**'],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Ensure Prisma client resolves properly in edge/Workers environments
      },
    },
  },
  server: {
    host: true,
    port: 4321,
  },
});
