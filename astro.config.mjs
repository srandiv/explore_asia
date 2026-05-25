// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.exploreasiatravels.com",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
