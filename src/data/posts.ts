import { parseFrontmatter } from "@astrojs/markdown-remark";
import { normalizeDate } from "./dates";
export interface BlogPost {
  url: string;
  frontmatter: { title: string; date: string };
}

// Read only frontmatter: importing MDX modules also pulls their layout CSS into
// the homepage and archive, including the article-only KaTeX stylesheet.
const sources = import.meta.glob<string>("../pages/blog/*.mdx", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const posts: BlogPost[] = Object.entries(sources)
  .map(([path, source]) => {
    const { frontmatter } = parseFrontmatter(source);
    if (
      typeof frontmatter.title !== "string" ||
      typeof frontmatter.date !== "string"
    ) {
      throw new Error(`Missing title or date in ${path}`);
    }
    const slug = path
      .split("/")
      .pop()!
      .replace(/\.mdx$/, "");
    return {
      url: `/blog/${slug}/`,
      frontmatter: { title: frontmatter.title, date: frontmatter.date },
    };
  })
  .sort((a, b) =>
    normalizeDate(b.frontmatter.date).localeCompare(
      normalizeDate(a.frontmatter.date),
    ),
  );
