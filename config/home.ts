import { Icons } from "@/components/common/icons";

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
    rotate: -5,
    className: "absolute left-[215px] top-[0px] z-30",
  },
  {
    src: "/experience/hiliosai/hiliosai-team.JPG",
    caption: "hiliosai team",
    rotate: 5,
    className: "absolute right-[0px] top-[85px] z-20",
  },
  {
    src: "/experience/ltv/ltv-meeting.JPG",
    caption: "LTV meeting",
    rotate: -7,
    className: "absolute left-[0px] top-[170px] z-[15]",
  },
  {
    src: "/experience/hiliosai/hiliosai-workspace.jpg",
    caption: "workspace",
    rotate: 3,
    className: "absolute left-[215px] top-[255px] z-[25]",
  },
  {
    src: "/projects/gymintelops/dashboard.png",
    caption: "GymIntelOps",
    rotate: -3,
    className: "absolute left-[20px] top-[340px] z-20",
  },
  {
    src: "/projects/ai-agent-sales/chat-ui.png",
    caption: "AI Agent Sales",
    rotate: 5,
    className: "absolute right-[36px] bottom-6 z-10",
  },
];

export const heroCopy = {
  greeting: "hello there! I'm",
  name: "Phong Lee",
  intro:
    "I'm a software engineer specializing in web applications. I hope to keep seeing, learning, building, and loving.",
  scrollHint: "Scroll to explore",
};
