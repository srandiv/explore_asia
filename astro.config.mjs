// @ts-check
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.exploreasiatravels.com",
  adapter: netlify(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
