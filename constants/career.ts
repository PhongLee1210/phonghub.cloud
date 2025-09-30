import type {
  CareerTabs,
  Education,
  Project,
  SkillCategory,
  WorkExperience,
} from "~/types/career";

export const careerTabs: CareerTabs[] = [
  "Skills",
  "Experience",
  "Education",
  "Projects",
];

export const experiences: WorkExperience[] = [
  {
    company: "HiliosAI",
    currentPosition: "Software Engineer",
    period: "October 2023 - Present",
    location: "Vietnam · Hybrid",
    description: [
      "I'm immersed in a fast-evolving environment where continuous learning, adaptability, and innovation are paramount. My role bridges cross-functional skills and emerging technologies, with a strong focus on embracing AI-first workflows to solve real-world challenges, rapid adaptation to diverse tools, frameworks, and platforms, and building systems that respond to the rising demand in AI-powered automation and intelligence.",
    ],
    technologies: [
      "Artificial Intelligence",
      "Vue.js",
      "Node.js",
      "TypeScript",
      "Python",
      "Machine Learning",
      "AI Workflows",
      "Automation",
      "Cloud Technologies",
    ],
    positions: [
      {
        title: "Software Engineer",
        duration: "Oct 2023 - Present",
      },
    ],
  },
  {
    company: "LTV",
    currentPosition: "Full-stack Web Developer",
    period: "February 2022 - June 2025",
    location: "Nha Trang, Khanh Hoa, Vietnam · Remote",
    description: [
      "Proficient in Vue.js, Node.js, AWS with strong understanding of microservice architecture. Experienced in Agile methodology and Testing processes. Demonstrated ability to work effectively in a team remotely environment across multiple projects including OASIS, My Garment, Project Template, JetCare, and SVTech Cloudcam.",
    ],
    technologies: [
      "Vue.js",
      "Node.js",
      "TypeScript",
      "Microservices",
      "MolecularJS",
      "GraphQL",
      "PostgreSQL",
      "Amazon Web Services",
      "TailwindCSS",
      "Element-Plus",
      "Jest",
      "Agile Methodology",
    ],
    positions: [
      {
        title: "Full-stack Web Developer",
        duration: "Feb 2022 - Jun 2025",
      },
    ],
  },
];

export const educationList: Education[] = [
  {
    school: "Nha Trang University",
    degree: "Bachelor's Degree",
    year: "2015 - 2019",
    description: "Information Technology",
    achievements: [
      "Software Engineering",
      "Computer Networks",
      "Database Management",
      "Web Development",
      "Data Structures & Algorithms",
      "Operating Systems",
      "Software Testing",
      "Computer Architecture",
      "Programming Languages",
      "System Analysis & Design",
    ],
  },
];

export const skillCategories: SkillCategory[] = [
  {
    name: "Favorites",
    icon: "lucide:star",
    skills: [
      {
        name: "Vue",
        description: "JavaScript Framework",
        icon: "simple-icons:vuedotjs",
      },
      {
        name: "Nuxt",
        description: "Full Stack Vue Framework",
        icon: "simple-icons:nuxt",
      },
      {
        name: "TypeScript",
        description: "JavaScript Superset",
        icon: "simple-icons:typescript",
      },
      {
        name: "Vite",
        description: "Build Tool",
        icon: "simple-icons:vite",
      },
      {
        name: "Bun",
        description: "JavaScript Runtime",
        icon: "simple-icons:bun",
      },
      {
        name: "Lit",
        description: "Web Components",
        icon: "simple-icons:lit",
      },
      {
        name: "BEM",
        description: "CSS Methodology",
        icon: "simple-icons:bem",
      },
      {
        name: "Hono",
        description: "Minimalist Web Framework",
        icon: "simple-icons:hono",
      },
      {
        name: "Supabase",
        description: "Database",
        icon: "simple-icons:supabase",
      },
      {
        name: "Drizzle",
        description: "Database ORM",
        icon: "simple-icons:drizzle",
      },
      {
        name: "Cloudflare",
        description: "Web Services",
        icon: "simple-icons:cloudflare",
      },
      {
        name: "Vercel",
        description: "Web Services",
        icon: "simple-icons:vercel",
      },
      {
        name: "Vitest",
        description: "Unit Testing Framework",
        icon: "simple-icons:vitest",
      },
      {
        name: "Cypress",
        description: "End-to-End Testing Framework",
        icon: "simple-icons:cypress",
      },
    ],
  },
  {
    name: "Frontend Development",
    icon: "lucide:panel-top",
    skills: [
      {
        name: "Vue",
        description: "JavaScript Framework",
        icon: "simple-icons:vuedotjs",
      },
      {
        name: "Nuxt",
        description: "Full Stack Vue Framework",
        icon: "simple-icons:nuxt",
      },
      {
        name: "React",
        description: "JavaScript Framework",
        icon: "simple-icons:react",
      },
      {
        name: "Next",
        description: "Full Stack React Framework",
        icon: "simple-icons:nextdotjs",
      },
      {
        name: "TypeScript",
        description: "JavaScript Superset",
        icon: "simple-icons:typescript",
      },
      {
        name: "Tailwind",
        description: "CSS Framework",
        icon: "simple-icons:tailwindcss",
      },
      {
        name: "Styled Components",
        description: "CSS-in-JS Library",
        icon: "simple-icons:styledcomponents",
      },
      {
        name: "BEM",
        description: "CSS Methodology",
        icon: "simple-icons:bem",
      },
      {
        name: "SASS",
        description: "CSS Preprocessor",
        icon: "simple-icons:sass",
      },
      {
        name: "Bun",
        description: "JavaScript Runtime",
        icon: "simple-icons:bun",
      },
      {
        name: "pnpm",
        description: "Package Manager",
        icon: "simple-icons:pnpm",
      },
      {
        name: "Lit",
        description: "Web Components",
        icon: "simple-icons:lit",
      },
      {
        name: "Vitest",
        description: "Unit Testing Framework",
        icon: "simple-icons:vitest",
      },
      {
        name: "Jest",
        description: "Unit Testing Framework",
        icon: "simple-icons:jest",
      },
      {
        name: "Cypress",
        description: "End-to-End Testing Framework",
        icon: "simple-icons:cypress",
      },
      {
        name: "Playwright",
        description: "End-to-End Testing Framework",
        icon: "simple-icons:playwright",
      },
    ],
  },
  {
    name: "Backend Development",
    icon: "mdi:server",
    skills: [
      {
        name: "Hono",
        description: "Minimalist Web Framework",
        icon: "simple-icons:hono",
      },
      {
        name: "Node.js",
        description: "JavaScript Runtime",
        icon: "simple-icons:nodedotjs",
      },
      {
        name: "Express",
        description: "JavaScript Framework",
        icon: "simple-icons:express",
      },
      {
        name: "MongoDB",
        description: "Database",
        icon: "simple-icons:mongodb",
      },
      {
        name: "PostgreSQL",
        description: "Database",
        icon: "simple-icons:postgresql",
      },
      {
        name: "MySQL",
        description: "Database",
        icon: "simple-icons:mysql",
      },
      {
        name: "Drizzle",
        description: "Database ORM",
        icon: "simple-icons:drizzle",
      },
    ],
  },
  {
    name: "DevOps",
    icon: "mdi:cloud",
    skills: [
      {
        name: "Docker",
        description: "Containerization",
        icon: "simple-icons:docker",
      },
      {
        name: "Nginx",
        description: "Web Server",
        icon: "simple-icons:nginx",
      },
      {
        name: "Vercel",
        description: "Web Services",
        icon: "simple-icons:vercel",
      },
      {
        name: "Cloudflare",
        description: "Web Services",
        icon: "simple-icons:cloudflare",
      },
      {
        name: "Linux",
        description: "Operating System",
        icon: "simple-icons:linux",
      },
      {
        name: "Git",
        description: "Version Control System",
        icon: "simple-icons:git",
      },
      {
        name: "GitHub",
        description: "Version Control System",
        icon: "simple-icons:github",
      },
      {
        name: "GitHub Actions",
        description: "CI/CD",
        icon: "simple-icons:githubactions",
      },
      {
        name: "GitLab",
        description: "Version Control System",
        icon: "simple-icons:gitlab",
      },
    ],
  },
  {
    name: "AI",
    icon: "lucide:brain",
    skills: [
      {
        name: "ChatGPT",
        description: "Chatbot",
        icon: "simple-icons:openai",
      },
      {
        name: "Claude",
        description: "Chatbot",
        icon: "simple-icons:claude",
      },
      {
        name: "Cursor",
        description: "Code Editor",
        icon: "lucide:brain",
      },
      {
        name: "v0",
        description: "Code Editor",
        icon: "simple-icons:v0",
      },
      {
        name: "GitHub Copilot",
        description: "Code Assistant",
        icon: "simple-icons:github",
      },
    ],
  },
  {
    name: "Design",
    icon: "lucide:palette",
    skills: [
      {
        name: "Figma",
        description: "UI Design Tool",
        icon: "simple-icons:figma",
      },
      {
        name: "Adobe XD",
        description: "UI Design Tool",
        icon: "simple-icons:adobexd",
      },
      {
        name: "Canva",
        description: "UI Design Tool",
        icon: "simple-icons:canva",
      },
    ],
  },
  {
    name: "Languages",
    icon: "lucide:earth",
    skills: [
      {
        name: "Vietnamese",
        description: "Native",
        icon: "circle-flags:vn",
      },
      {
        name: "English",
        description: "Professional Working Proficiency",
        icon: "circle-flags:us",
      },
    ],
  },
];

export const projectsList: Project[] = [
  {
    name: "OASIS",
    description:
      "A comprehensive web application built with Vue.js and Node.js microservices architecture. Focused on frontend development with UI design based on templates and remote team collaboration.",
    tech: ["Vue.js", "TypeScript", "Node.js", "MolecularJS", "Microservices"],
    features: [
      "Microservices Architecture",
      "Remote Collaboration",
      "UI Template Design",
      "Frontend Development",
    ],
    status: "Active",
  },
  {
    name: "My Garment",
    description:
      "Full-stack web application utilizing AWS cloud services, Node.js backend, PostgreSQL database, and Vue.js frontend for garment management solutions.",
    tech: ["Vue.js", "TypeScript", "Node.js", "AWS", "PostgreSQL"],
    features: [
      "AWS Cloud Integration",
      "Full-stack Development",
      "Database Management",
      "Scalable Architecture",
    ],
    status: "Active",
  },
  {
    name: "Project Template",
    description:
      "Frontend web application built with Vue.js, TailwindCSS, and Element-Plus library. Designed and implemented UI based on Figma designs with remote team collaboration.",
    tech: ["Vue.js", "TypeScript", "TailwindCSS", "Element-Plus", "Figma"],
    features: [
      "UI/UX Design Implementation",
      "Component Library Integration",
      "Responsive Design",
      "Figma to Code",
    ],
    status: "Completed",
  },
  {
    name: "JetCare",
    description:
      "Full-stack web application featuring Node.js microservices, GraphQL API, PostgreSQL database, and Vue.js frontend. Focused on code optimization, refactoring, and UI development.",
    tech: [
      "Vue.js",
      "TypeScript",
      "Node.js",
      "MolecularJS",
      "GraphQL",
      "PostgreSQL",
    ],
    features: [
      "GraphQL API",
      "Microservices Architecture",
      "Code Optimization",
      "UI Mockup Implementation",
    ],
    status: "Completed",
  },
  {
    name: "SVTech Cloudcam",
    description:
      "Cloud-based camera management system built with Vue.js and Node.js. Developed user-friendly interfaces with Element-plus and TailwindCSS, implemented comprehensive testing with Jest.",
    tech: [
      "Vue.js",
      "Node.js",
      "TypeScript",
      "Element-Plus",
      "TailwindCSS",
      "Jest",
    ],
    features: [
      "Cloud Camera Management",
      "User Interface Design",
      "Unit Testing",
      "Performance Optimization",
    ],
    status: "Completed",
  },
];
