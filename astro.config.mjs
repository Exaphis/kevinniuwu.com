import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import mdx from "@astrojs/mdx";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://kevinniuwu.com",
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    mdx({
      remarkPlugins: [remarkToc, remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    sitemap({
      filter: (page) =>
        page !== "https://kevinniuwu.com/countdown/" &&
        page !== "https://kevinniuwu.com/resume/",
    }),
  ],
});
