import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Le Thanh Phong | Software Engineer",
    short_name: "Phong Lee",
    description:
      "Le Thanh Phong's software engineer portfolio showcasing full-stack development, DevOps, and AI engineering expertise",
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
    ],
    lang: "en",
    dir: "ltr",
    scope: "/",
  };
}
