import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://kevinniuwu.com",
  compressHTML: true,
  integrations: [
    mdx({
      processor: unified({
        remarkPlugins: [remarkToc, remarkMath],
        rehypePlugins: [rehypeKatex],
      }),
    }),
    sitemap({
      filter: (page) =>
        page !== "https://kevinniuwu.com/countdown/" &&
        page !== "https://kevinniuwu.com/resume/",
    }),
  ],
});
