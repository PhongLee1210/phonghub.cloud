<script lang="ts" setup>
import { defineAsyncComponent } from "vue";

const AboutMe = defineAsyncComponent(() => import("./about-me"));
const Career = defineAsyncComponent(() => import("./career"));
const FooterComponent = defineAsyncComponent(() => import("./footer"));
const Welcome = defineAsyncComponent(() => import("./welcome"));

useHead({
  title: "Phong Lee - Software Engineer",
  meta: [
    {
      name: "description",
      content:
        "Welcome to my personal portfolio. I am Phong Lee, a Software Engineer passionate about building scalable web applications, cloud-native solutions, and enterprise software architectures focused on performance and user experience.",
    },
    {
      name: "keywords",
      content:
        "Phong Lee, Software Engineer, Full Stack Developer, Vue.js, Node.js, AWS, Microservices, TypeScript, Web Development, Portfolio",
    },
  ],
});
</script>

<template>
  <Welcome />
  <AboutMe />
  <Career />
  <FooterComponent />
</template>
