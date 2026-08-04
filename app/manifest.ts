import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Phong Lee | Software Engineer",
    short_name: "Phong Lee",
    description:
      "Phong Lee's software engineer portfolio showcasing full-stack development, DevOps, and AI engineering expertise",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "64x64",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: [
      "portfolio",
      "software engineer",
      "fullstack developer",
      "devops",
      "ai engineering",
      "typescript",
      "javascript",
      "web development",
      "blog",
      "tech blog",
      "programming tutorials",
      "software development",
      "technology",
      "ai",
      "cybersecurity",
      "cloud computing",
      "leadership",
      "business",
    ],
    lang: "en",
    dir: "ltr",
    scope: "/",
  };
}
