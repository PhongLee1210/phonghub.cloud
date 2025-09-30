const appConfig = {
  socialLinks: {
    linkedin: process.env.LINKEDIN_PROFILE_URL,
    github: process.env.GITHUB_PROFILE_URL,
    instagram: process.env.INSTAGRAM_PROFILE_URL,
    youtube: process.env.YOUTUBE_PROFILE_URL,
  },

  flippingWords: process.env.FLIPPING_WORDS,
  version: process.env.npm_package_version || "Unknown",
};

const runtimeConfig = {
  lifetime_stats: {
    birthday: process.env.MY_BIRTHDAY_DATE,
    first_work_experience: process.env.FIRST_WORK_EXPERIENCE_DATE,
  },
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/image",
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
    "@nuxtjs/color-mode",
    "@vueuse/motion/nuxt",
    "@nuxt/icon",
  ],
  appConfig,
  runtimeConfig,
  app: {
    head: {
      title: process.env.NUXT_APP_TITLE,
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "format-detection", content: "telephone=no" },
        {
          name: "description",
          content:
            process.env.NUXT_APP_DESCRIPTION ||
            "Portfolio of Phong Lee, a passionate software engineer specializing in Vue.js, Node.js, and cloud technologies with focus on microservices and AI-first workflows.",
        },
        {
          name: "keywords",
          content:
            "Phong Lee, Software Engineer, Full Stack Developer, Vue.js, Node.js, AWS, Microservices, TypeScript, Web Development, Portfolio, AI Workflows",
        },
        { name: "author", content: "Phong Lee" },
        {
          property: "og:title",
          content:
            process.env.NUXT_APP_TITLE || "Phong Lee - Software Engineer",
        },
        {
          property: "og:description",
          content:
            process.env.NUXT_APP_DESCRIPTION ||
            "Portfolio of Phong Lee, a passionate software engineer specializing in Vue.js, Node.js, and cloud technologies with focus on microservices and AI-first workflows.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: process.env.NUXT_APP_URL },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "canonical", href: process.env.NUXT_APP_URL },
      ],
    },
  },
  devtools: {
    enabled: true,
  },
  compatibilityDate: "2025-01-02",
  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },
  colorMode: {
    classSuffix: "",
    preference: "dark",
  },
});
