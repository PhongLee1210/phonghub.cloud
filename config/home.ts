import { Icons } from "@/components/common/icons";
import { siteConfig } from "@/config/site";

export interface ExploringTopic {
  label: string;
  icon: keyof typeof Icons;
}

export const exploringTopics: ExploringTopic[] = [
  { label: "Full-stack web", icon: "nextjs" },
  { label: "Cloud & DevOps", icon: "googlecloud" },
  { label: "AI engineering", icon: "aurora" },
  { label: "System design", icon: "settings" },
  { label: "Creative code", icon: "retro" },
];

export interface CollageItem {
  src: string;
  caption: string;
  rotate: number;
  className: string;
}

export const collageItems: CollageItem[] = [
  {
    src: "/me.JPG",
    caption: "me :)",
    rotate: -3,
    className: "absolute left-[6%] top-[2%] z-30 w-36 sm:w-44",
  },
  {
    src: "/experience/hiliosai/hiliosai-team.JPG",
    caption: "hiliosai team",
    rotate: 4,
    className: "absolute left-[42%] top-0 z-20 w-32 sm:w-40",
  },
  {
    src: "/experience/ltv/ltv-meeting.JPG",
    caption: "LTV meeting",
    rotate: -4,
    className: "absolute right-[1%] top-[16%] z-10 w-32 sm:w-40",
  },
  {
    src: "/experience/hiliosai/hiliosai-workspace.jpg",
    caption: "workspace",
    rotate: 3,
    className: "absolute left-0 top-[48%] z-10 w-32 sm:w-40",
  },
  {
    src: "/projects/gymintelops/dashboard.png",
    caption: "GymIntelOps",
    rotate: -2,
    className: "absolute left-[30%] top-[54%] z-20 w-36 sm:w-44",
  },
  {
    src: "/projects/ai-agent-sales/chat-ui.png",
    caption: "AI Agent Sales",
    rotate: 2,
    className: "absolute right-[3%] top-[60%] z-30 w-32 sm:w-40",
  },
];

export const heroCopy = {
  greeting: "hello there! I'm",
  name: siteConfig.authorName,
  intro:
    "Senior software engineer building scalable web apps, cloud infrastructure, and AI-powered products. Always learning, always shipping.",
};
