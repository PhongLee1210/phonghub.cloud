export enum SkillCategoryEnum {
  LANGUAGES = "languages",
  FRAMEWORKS = "frameworks",
  FRONTEND = "frontend",
  BACKEND = "backend",
  DATABASES = "databases",
  CLOUD = "cloud",
  AI_LLM = "ai-llm",
  DEVOPS = "devops",
  DEVELOPER_TOOLS = "developer-tools",
  DESIGN = "design",
  BUSINESS = "business",
  SOFT_SKILLS = "soft-skills",
}

export interface ISkill {
  key: string;
  name: string;
  description: string;
  rating: number;
  icon: string;
  category: SkillCategoryEnum;
}

export interface SkillCategory {
  title: string;
  description: string;
  skills: ISkill[];
}

export const skillsUnsorted = [
  {
    key: "typescript",
    name: "TypeScript",
    description:
      "Enhance JavaScript with static types, making code more understandable and reliable.",
    rating: 5,
    icon: "typescript",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    key: "javascript",
    name: "JavaScript",
    description:
      "Create interactive and dynamic web experiences with the versatile scripting language.",
    rating: 5,
    icon: "javascript",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    key: "python",
    name: "Python",
    description:
      "Versatile programming language for web development, data science, automation, and AI/ML applications.",
    rating: 4,
    icon: "python",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    key: "sql",
    name: "SQL",
    description:
      "Standard language for managing and manipulating relational databases with powerful querying capabilities.",
    rating: 4,
    icon: "mysql",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    key: "html5",
    name: "HTML 5",
    description:
      "Structure web content beautifully with the latest version of HyperText Markup Language.",
    rating: 4,
    icon: "html5",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    key: "css3",
    name: "CSS 3",
    description:
      "Style web pages creatively with the latest iteration of Cascading Style Sheets.",
    rating: 4,
    icon: "css3",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    key: "react",
    name: "React",
    description:
      "Craft interactive user interfaces using components, state, props, and virtual DOM.",
    rating: 5,
    icon: "react",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "nextjs",
    name: "Next.js",
    description:
      "Effortlessly build dynamic apps with routing, layouts, loading UI, and API routes.",
    rating: 5,
    icon: "nextjs",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "vuejs",
    name: "Vue.js",
    description:
      "Progressive JavaScript framework for building user interfaces with reactive data binding.",
    rating: 4,
    icon: "vue",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "reactnative",
    name: "React Native",
    description:
      "Develop cross-platform mobile apps using React for consistent and engaging experiences.",
    rating: 4,
    icon: "react",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "nestjs",
    name: "Nest.js",
    description:
      "Create scalable and modular applications with a progressive Node.js framework.",
    rating: 4,
    icon: "nestjs",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "expressjs",
    name: "express.js",
    description:
      "Build web applications and APIs quickly using a fast, unopinionated Node.js framework.",
    rating: 4,
    icon: "express",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "fastapi",
    name: "FastAPI",
    description:
      "Modern, fast web framework for building APIs with Python, featuring automatic documentation and async support.",
    rating: 4,
    icon: "fastapi",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    key: "redux",
    name: "Redux",
    description:
      "Manage app state effectively using a predictable and centralized state container.",
    rating: 4,
    icon: "redux",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "zustand",
    name: "Zustand",
    description:
      "Lightweight state management library for React with minimal boilerplate and TypeScript support.",
    rating: 4,
    icon: "settings",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "pinia",
    name: "Pinia",
    description:
      "Intuitive state management for Vue.js applications with TypeScript support and devtools integration.",
    rating: 4,
    icon: "settings",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "apollo",
    name: "Apollo",
    description:
      "Comprehensive GraphQL client for React, JavaScript, and native platforms with caching and state management.",
    rating: 4,
    icon: "apollo",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "materialui",
    name: "Material UI",
    description:
      "Popular React UI framework implementing Google's Material Design with a comprehensive component library.",
    rating: 4,
    icon: "materialui",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "tailwindcss",
    name: "Tailwind CSS",
    description:
      "Design beautiful, modern websites faster with a utility-first CSS framework.",
    rating: 4,
    icon: "tailwindcss",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "nodejs",
    name: "Node.js",
    description:
      "Run JavaScript on the server side, enabling dynamic and responsive applications.",
    rating: 5,
    icon: "nodejs",
    category: SkillCategoryEnum.BACKEND,
  },
  {
    key: "graphql",
    name: "GraphQL",
    description:
      "Fetch data precisely with a powerful query language for APIs and runtime execution.",
    rating: 4,
    icon: "graphql",
    category: SkillCategoryEnum.BACKEND,
  },
  {
    key: "prisma",
    name: "Prisma",
    description:
      "Next-generation ORM for Node.js and TypeScript with type-safe database access and migrations.",
    rating: 4,
    icon: "prisma",
    category: SkillCategoryEnum.BACKEND,
  },
  {
    key: "mongodb",
    name: "MongoDB",
    description:
      "Store and retrieve data seamlessly with a flexible and scalable NoSQL database.",
    rating: 5,
    icon: "mongodb",
    category: SkillCategoryEnum.DATABASES,
  },
  {
    key: "postgresql",
    name: "PostgreSQL",
    description:
      "Powerful open-source relational database system with advanced features for complex queries and data integrity.",
    rating: 4,
    icon: "postgresql",
    category: SkillCategoryEnum.DATABASES,
  },
  {
    key: "redis",
    name: "Redis",
    description:
      "In-memory data structure store used as a database, cache, and message broker for high-performance applications.",
    rating: 4,
    icon: "redis",
    category: SkillCategoryEnum.DATABASES,
  },
  {
    key: "supabase",
    name: "Supabase",
    description:
      "Open source Firebase alternative with real-time database, authentication, and instant APIs.",
    rating: 4,
    icon: "supabase",
    category: SkillCategoryEnum.DATABASES,
  },
  {
    key: "aws",
    name: "AWS",
    description:
      "Utilize Amazon Web Services to build and deploy scalable, reliable, and secure applications.",
    rating: 4,
    icon: "amazonaws",
    category: SkillCategoryEnum.CLOUD,
  },
  {
    key: "googlecloud",
    name: "Google Cloud",
    description:
      "Suite of cloud computing services for building, testing, and deploying applications on Google's infrastructure.",
    rating: 3,
    icon: "googlecloud",
    category: SkillCategoryEnum.CLOUD,
  },
  {
    key: "firebase",
    name: "Firebase",
    description:
      "Google's mobile and web application development platform with real-time database and authentication.",
    rating: 4,
    icon: "firebase",
    category: SkillCategoryEnum.CLOUD,
  },
  {
    key: "vercel",
    name: "Vercel",
    description:
      "Frontend cloud platform for static sites and serverless functions with global CDN and edge computing.",
    rating: 4,
    icon: "vercel",
    category: SkillCategoryEnum.CLOUD,
  },
  {
    key: "ai",
    name: "Artificial Intelligence (AI)",
    description:
      "Developing AI-powered applications, machine learning workflows, and intelligent automation systems.",
    rating: 4,
    icon: "cyberpunk",
    category: SkillCategoryEnum.AI_LLM,
  },
  {
    key: "langchain",
    name: "LangChain",
    description:
      "Framework for developing applications powered by language models with composable components.",
    rating: 3,
    icon: "cyberpunk",
    category: SkillCategoryEnum.AI_LLM,
  },
  {
    key: "langfuse",
    name: "Langfuse",
    description:
      "Open-source LLM observability platform for monitoring and debugging language model applications.",
    rating: 3,
    icon: "laptop",
    category: SkillCategoryEnum.AI_LLM,
  },
  {
    key: "docker",
    name: "Docker",
    description:
      "Platform for developing, shipping, and running applications in containers for consistent deployment.",
    rating: 4,
    icon: "docker",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    key: "cicd",
    name: "CI/CD",
    description:
      "Continuous Integration and Continuous Deployment practices for automating software delivery pipelines.",
    rating: 3,
    icon: "settings",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    key: "bunjs",
    name: "Bun.js",
    description:
      "Fast JavaScript runtime and bundler with native TypeScript support and improved performance.",
    rating: 4,
    icon: "bun",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    key: "vite",
    name: "Vite",
    description:
      "Fast build tool and development server for modern web projects with instant hot module replacement.",
    rating: 4,
    icon: "vite",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    key: "nx",
    name: "Nx Monorepo",
    description:
      "Build system with advanced monorepo support for managing multiple applications and libraries.",
    rating: 4,
    icon: "nx",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    key: "turborepo",
    name: "Turbo Repo",
    description:
      "High-performance build system for JavaScript and TypeScript monorepos with intelligent caching.",
    rating: 4,
    icon: "turborepo",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    key: "git",
    name: "Git",
    description:
      "Distributed version control system for tracking changes in source code during software development.",
    rating: 5,
    icon: "git",
    category: SkillCategoryEnum.DEVELOPER_TOOLS,
  },
  {
    key: "github",
    name: "GitHub",
    description:
      "Development platform for version control, collaboration, and project management using Git.",
    rating: 5,
    icon: "github",
    category: SkillCategoryEnum.DEVELOPER_TOOLS,
  },
  {
    key: "jest",
    name: "Jest",
    description:
      "Delightful JavaScript testing framework with focus on simplicity and support for large web applications.",
    rating: 4,
    icon: "jest",
    category: SkillCategoryEnum.DEVELOPER_TOOLS,
  },
  {
    key: "dbeaver",
    name: "DBeaver",
    description:
      "Universal database management tool for developers, analysts, and database administrators.",
    rating: 3,
    icon: "dbeaver",
    category: SkillCategoryEnum.DEVELOPER_TOOLS,
  },
  {
    key: "sales",
    name: "Sales",
    description:
      "Sales techniques, customer relationship management, and business development strategies.",
    rating: 3,
    icon: "settings",
    category: SkillCategoryEnum.BUSINESS,
  },
  {
    key: "customer-service",
    name: "Customer Service",
    description:
      "Customer support, relationship management, and service excellence practices.",
    rating: 4,
    icon: "settings",
    category: SkillCategoryEnum.SOFT_SKILLS,
  },
] as const satisfies readonly ISkill[];

export type ValidSkills = (typeof skillsUnsorted)[number]["name"];

export const SKILLS: ISkill[] = [...skillsUnsorted].sort(
  (a, b) => b.rating - a.rating
);

export const featuredSkills = SKILLS.slice(0, 6);
