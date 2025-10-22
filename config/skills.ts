import { Icons } from "@/components/common/icons";

export enum SkillCategoryEnum {
  FRONTEND = "frontend",
  BACKEND = "backend",
  CLOUD_DEVOPS = "cloud-devops",
  COLLABORATION_TOOLS = "collaboration-tools",
}

export interface skillsInterface {
  name: string;
  description: string;
  rating: number;
  icon: any;
  category: SkillCategoryEnum;
}

export interface SkillCategory {
  title: string;
  description: string;
  skills: skillsInterface[];
}

export const skillsUnsorted: skillsInterface[] = [
  {
    name: "React",
    description:
      "Craft interactive user interfaces using components, state, props, and virtual DOM.",
    rating: 5,
    icon: Icons.react,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Next.js",
    description:
      "Effortlessly build dynamic apps with routing, layouts, loading UI, and API routes.",
    rating: 5,
    icon: Icons.nextjs,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Node.js",
    description:
      "Run JavaScript on the server side, enabling dynamic and responsive applications.",
    rating: 5,
    icon: Icons.nodejs,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "Typescript",
    description:
      "Enhance JavaScript with static types, making code more understandable and reliable.",
    rating: 5,
    icon: Icons.typescript,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Javascript",
    description:
      "Create interactive and dynamic web experiences with the versatile scripting language.",
    rating: 5,
    icon: Icons.javascript,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "MongoDB",
    description:
      "Store and retrieve data seamlessly with a flexible and scalable NoSQL database.",
    rating: 5,
    icon: Icons.mongodb,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "GraphQL",
    description:
      "Fetch data precisely with a powerful query language for APIs and runtime execution.",
    rating: 4,
    icon: Icons.graphql,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "Nest.js",
    description:
      "Create scalable and modular applications with a progressive Node.js framework.",
    rating: 4,
    icon: Icons.nestjs,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "express.js",
    description:
      "Build web applications and APIs quickly using a fast, unopinionated Node.js framework.",
    rating: 4,
    icon: Icons.express,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "React Native",
    description:
      "Develop cross-platform mobile apps using React for consistent and engaging experiences.",
    rating: 4,
    icon: Icons.react,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "HTML 5",
    description:
      "Structure web content beautifully with the latest version of HyperText Markup Language.",
    rating: 4,
    icon: Icons.html5,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "CSS 3",
    description:
      "Style web pages creatively with the latest iteration of Cascading Style Sheets.",
    rating: 4,
    icon: Icons.css3,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "AWS",
    description:
      "Utilize Amazon Web Services to build and deploy scalable, reliable, and secure applications.",
    rating: 4,
    icon: Icons.amazonaws,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Redux",
    description:
      "Manage app state effectively using a predictable and centralized state container.",
    rating: 4,
    icon: Icons.redux,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Zustand",
    description:
      "Lightweight state management library for React with minimal boilerplate and TypeScript support.",
    rating: 4,
    icon: Icons.settings,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Tailwind CSS",
    description:
      "Design beautiful, modern websites faster with a utility-first CSS framework.",
    rating: 4,
    icon: Icons.tailwindcss,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Bun.js",
    description:
      "Fast JavaScript runtime and bundler with native TypeScript support and improved performance.",
    rating: 4,
    icon: Icons.bun,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Vue.js",
    description:
      "Progressive JavaScript framework for building user interfaces with reactive data binding.",
    rating: 4,
    icon: Icons.vue,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "FastAPI",
    description:
      "Modern, fast web framework for building APIs with Python, featuring automatic documentation and async support.",
    rating: 4,
    icon: Icons.fastapi,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "Docker",
    description:
      "Platform for developing, shipping, and running applications in containers for consistent deployment.",
    rating: 4,
    icon: Icons.docker,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "CI/CD",
    description:
      "Continuous Integration and Continuous Deployment practices for automating software delivery pipelines.",
    rating: 3,
    icon: Icons.settings,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "LangChain",
    description:
      "Framework for developing applications powered by language models with composable components.",
    rating: 3,
    icon: Icons.cyberpunk,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "Langfuse",
    description:
      "Open-source LLM observability platform for monitoring and debugging language model applications.",
    rating: 3,
    icon: Icons.laptop,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "Firebase",
    description:
      "Google's mobile and web application development platform with real-time database and authentication.",
    rating: 4,
    icon: Icons.firebase,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Google Cloud",
    description:
      "Suite of cloud computing services for building, testing, and deploying applications on Google's infrastructure.",
    rating: 3,
    icon: Icons.googlecloud,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Redis",
    description:
      "In-memory data structure store used as a database, cache, and message broker for high-performance applications.",
    rating: 4,
    icon: Icons.redis,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "Vite",
    description:
      "Fast build tool and development server for modern web projects with instant hot module replacement.",
    rating: 4,
    icon: Icons.vite,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Nx Monorepo",
    description:
      "Build system with advanced monorepo support for managing multiple applications and libraries.",
    rating: 4,
    icon: Icons.nx,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Turbo Repo",
    description:
      "High-performance build system for JavaScript and TypeScript monorepos with intelligent caching.",
    rating: 4,
    icon: Icons.turborepo,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Pinia",
    description:
      "Intuitive state management for Vue.js applications with TypeScript support and devtools integration.",
    rating: 4,
    icon: Icons.settings,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Apollo",
    description:
      "Comprehensive GraphQL client for React, JavaScript, and native platforms with caching and state management.",
    rating: 4,
    icon: Icons.apollo,
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    name: "Prisma",
    description:
      "Next-generation ORM for Node.js and TypeScript with type-safe database access and migrations.",
    rating: 4,
    icon: Icons.prisma,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "Supabase",
    description:
      "Open source Firebase alternative with real-time database, authentication, and instant APIs.",
    rating: 4,
    icon: Icons.supabase,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Vercel",
    description:
      "Frontend cloud platform for static sites and serverless functions with global CDN and edge computing.",
    rating: 4,
    icon: Icons.vercel,
    category: SkillCategoryEnum.CLOUD_DEVOPS,
  },
  {
    name: "Git",
    description:
      "Distributed version control system for tracking changes in source code during software development.",
    rating: 5,
    icon: Icons.git,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "GitHub",
    description:
      "Development platform for version control, collaboration, and project management using Git.",
    rating: 5,
    icon: Icons.github,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "SQL",
    description:
      "Standard language for managing and manipulating relational databases with powerful querying capabilities.",
    rating: 4,
    icon: Icons.mysql,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "DBeaver",
    description:
      "Universal database management tool for developers, analysts, and database administrators.",
    rating: 3,
    icon: Icons.dbeaver,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "Artificial Intelligence (AI)",
    description:
      "Developing AI-powered applications, machine learning workflows, and intelligent automation systems.",
    rating: 4,
    icon: Icons.cyberpunk,
    category: SkillCategoryEnum.BACKEND,
  },
  {
    name: "Sales",
    description:
      "Sales techniques, customer relationship management, and business development strategies.",
    rating: 3,
    icon: Icons.settings,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "Advertising Sales",
    description:
      "Digital advertising, marketing strategies, and promotional sales techniques.",
    rating: 3,
    icon: Icons.settings,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "Customer Service",
    description:
      "Customer support, relationship management, and service excellence practices.",
    rating: 4,
    icon: Icons.settings,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
  {
    name: "Technical Support",
    description:
      "Technical troubleshooting, helpdesk operations, and IT support services.",
    rating: 3,
    icon: Icons.settings,
    category: SkillCategoryEnum.COLLABORATION_TOOLS,
  },
];

export const skills = skillsUnsorted
  .slice()
  .sort((a, b) => b.rating - a.rating);

export const featuredSkills = skills.slice(0, 6);

// Group skills by category
export const skillCategories: SkillCategory[] = [
  {
    title: "Frontend Development",
    description:
      "Technologies for building user interfaces and client-side applications",
    skills: skills.filter(
      (skill) => skill.category === SkillCategoryEnum.FRONTEND
    ),
  },
  {
    title: "Backend Development",
    description: "Server-side technologies, databases, and API development",
    skills: skills.filter(
      (skill) => skill.category === SkillCategoryEnum.BACKEND
    ),
  },
  {
    title: "Cloud & DevOps",
    description:
      "Cloud platforms, deployment tools, and development infrastructure",
    skills: skills.filter(
      (skill) => skill.category === SkillCategoryEnum.CLOUD_DEVOPS
    ),
  },
  {
    title: "Collaboration & Tools",
    description: "Version control, databases management, and development tools",
    skills: skills.filter(
      (skill) => skill.category === SkillCategoryEnum.COLLABORATION_TOOLS
    ),
  },
];
