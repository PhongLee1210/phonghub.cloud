<script lang="ts" setup>
const appConfig = useAppConfig();

interface SocialLink {
  icon: string;
  href: string;
  label: string;
}

const allSocialLinks: SocialLink[] = [
  {
    icon: "ph:linkedin-logo",
    href: appConfig.socialLinks.linkedin,
    label: "LinkedIn",
  },
  {
    icon: "ph:github-logo",
    href: appConfig.socialLinks.github,
    label: "GitHub",
  },
  {
    icon: "ph:twitter-logo",
    href: appConfig.socialLinks.twitter,
    label: "Twitter",
  },
  {
    icon: "ph:medium-logo",
    href: appConfig.socialLinks.medium,
    label: "Medium",
  },
  {
    icon: "ph:instagram-logo",
    href: appConfig.socialLinks.instagram,
    label: "Instagram",
  },
  {
    icon: "ph:youtube-logo",
    href: appConfig.socialLinks.youtube,
    label: "YouTube",
  },
];

// Filter out social links without URLs
const socialLinks = computed(() =>
  allSocialLinks.filter((link) => link.href && link.href.trim() !== "")
);
</script>

<template>
  <div class="mx-auto">
    <TooltipProvider>
      <div class="flex gap-6 justify-center flex-wrap">
        <template v-for="{ icon, href, label } in socialLinks" :key="href">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                :href="href"
                target="_blank"
                class="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon :name="icon" :size="28" />
              </a>
            </TooltipTrigger>

            <TooltipContent>
              <p>{{ label }}</p>
            </TooltipContent>
          </Tooltip>
        </template>
      </div>
    </TooltipProvider>
  </div>
</template>
