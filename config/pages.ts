import { ValidPages } from "./constants";

type PagesConfig = {
  [key in ValidPages]: {
    title: string;
    description: string;
    metadata: {
      title: string;
      description: string;
    };
  };
};

export const pagesConfig: PagesConfig = {
  home: {
    title: "Home",
    description: "Welcome to my portfolio website.",
    metadata: {
      title: "Home",
      description: "Phong Lee's portfolio website.",
    },
  },
  skills: {
    title: "Skills",
    description: "Key skills that define my professional identity.",
    metadata: {
      title: "Skills",
      description:
        "Phong Lee's key skills that define his professional identity.",
    },
  },
  projects: {
    title: "Projects",
    description: "Showcasing impactful projects and technical achievements.",
    metadata: {
      title: "Projects",
      description: "Phong Lee's projects in building web applications.",
    },
  },
  contact: {
    title: "Contact",
    description: "Let's connect and explore collaborations.",
    metadata: {
      title: "Contact",
      description: "Contact Le Thanh Phong.",
    },
  },
  resume: {
    title: "Resume",
    description: "Le Thanh Phong's resume.",
    metadata: {
      title: "Resume",
      description: "Le Thanh Phong's resume.",
    },
  },
  experience: {
    title: "Experience",
    description: "Professional journey and career timeline.",
    metadata: {
      title: "Experience",
      description:
        "Phong Lee's professional journey and experience timeline.",
    },
  },
  list100: {
    title: "List 100",
    description:
      "Things I want to do before I die. Please let me know if you have any recommendation.",
    metadata: {
      title: "List 100 - Bucket List",
      description:
        "Phong Lee's bucket list - 100 things I want to do before I die.",
    },
  },
  blogs: {
    title: "Blog",
    description:
      "Insights, tutorials, and updates from Phong Lee. Explore posts about web development, technology, and personal growth.",
    metadata: {
      title: "Phong Lee's Blog",
      description:
        "Read the latest blog posts from Phong Lee on software engineering, technology trends, productivity, and thoughts on personal and career development.",
    },
  },
};
