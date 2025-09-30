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
    period: "June 2023 - Present",
    location: "Finland · Remote",
    description: [
      "Integrated multiple open-source frontend projects, utilizing TypeScript and component architecture to establish a unified and reliable UI/UX.",
      "Developed and participated in integrating the core RAG system for custom B2B AI Agents, handling data orchestration and FastAPI integration with LangChain, Qdrant, and specialized backend GraphQL API services.",
      "Debugged and optimized the RAG pipeline using Langfuse for LLM tracing, monitoring performance.",
      "Implemented IaC using Terraform (AWS) and deployed declarative CI/CD pipelines via ArgoCD for automated release.",
    ],
    technologies: [
      "TypeScript",
      "Vue.js",
      "React.js",
      "NextJS",
      "RAG System",
      "LangChain",
      "Qdrant",
      "FastAPI",
      "GraphQL",
      "Apache Pulsar",
      "Redis",
      "Terraform",
      "ArgoCD",
      "AWS",
      "Langfuse",
      "n8n",
    ],
    positions: [
      {
        title: "Software Engineer",
        duration: "Jun 2023 - Present",
      },
    ],
  },
  {
    company: "OTBZone",
    currentPosition: "Frontend Engineer",
    period: "October 2022 - April 2023",
    location: "Nha Trang · On-site",
    description: [
      "Frontend development for both the SSR E-commerce platform and the CRM Admin Panel using Vue.js, TypeScript, and Vite.",
      "Implemented SSR and optimized applications for SEO and marketing integration, improving organic search performance.",
      "Participated with the Design UI/UX team to develop component-driven delivery and optimize UI/UX for real user cases.",
    ],
    technologies: [
      "Vue.js",
      "TypeScript",
      "Vite",
      "SSR",
      "SEO",
      "TailwindCSS",
      "Component Architecture",
    ],
    positions: [
      {
        title: "Frontend Engineer",
        duration: "Oct 2022 - Apr 2023",
      },
    ],
  },
  {
    company: "LTV Software Co.",
    currentPosition: "Software Engineer",
    period: "February 2021 - October 2022",
    location: "Ho Chi Minh City · Remote",
    description: [
      "Designed and developed scalable software solutions using Vue.js and TypeScript to meet complex business requirements.",
      "Contributed across the full Software Development Life Cycle, including requirements gathering, design, coding, testing, and deployment.",
      "Collaborated with cross-functional teams, including product managers, project managers, and QC/QA engineers, to ensure the successful delivery of high-quality software.",
      "Participated in code reviews and provided constructive feedback to peers, significantly improving the overall quality and maintainability of the codebase.",
    ],
    technologies: [
      "Vue.js",
      "TypeScript",
      "Vite",
      "TailwindCSS",
      "Component Architecture",
      "Jest",
      "Git",
      "Jira",
    ],
    positions: [
      {
        title: "Software Engineer",
        duration: "Feb 2021 - Oct 2022",
      },
    ],
  },
];

export const educationList: Education[] = [
  {
    school: "Nha Trang University",
    degree: "Engineer's Degree",
    year: "2018 - 2022",
    description: "Information Technology",
    achievements: [
      "Science Research Project: Online Proctoring System (Xây dựng công cụ hỗ trợ giám sát thi trực tuyến tại Trường Đại học Nha Trang)",
      "Software Engineering",
      "Web Development",
      "Database Management",
      "Data Structures & Algorithms",
      "Computer Networks",
      "Operating Systems",
    ],
  },
];

export const skillCategories: SkillCategory[] = [
  {
    name: "AI & LLM",
    icon: "lucide:brain",
    skills: [
      {
        name: "RAG System",
        description: "Retrieval-Augmented Generation",
        icon: "lucide:brain",
      },
      {
        name: "LangChain",
        description: "LLM Framework",
        icon: "simple-icons:chainlink",
      },
      {
        name: "Qdrant",
        description: "Vector Database",
        icon: "lucide:database",
      },
      {
        name: "Langfuse",
        description: "LLM Tracing & Monitoring",
        icon: "lucide:activity",
      },
      {
        name: "n8n",
        description: "Workflow Automation",
        icon: "lucide:workflow",
      },
      {
        name: "ChatGPT",
        description: "OpenAI Language Model",
        icon: "simple-icons:openai",
      },
      {
        name: "Claude",
        description: "Anthropic Language Model",
        icon: "simple-icons:anthropic",
      },
      {
        name: "Apache Pulsar",
        description: "Distributed Messaging",
        icon: "lucide:message-square",
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
        name: "FastAPI",
        description: "Python Web Framework",
        icon: "simple-icons:fastapi",
      },
      {
        name: "GraphQL",
        description: "API Query Language",
        icon: "simple-icons:graphql",
      },
      {
        name: "REST API",
        description: "API Architecture",
        icon: "lucide:api",
      },
      {
        name: "PostgreSQL",
        description: "Relational Database",
        icon: "simple-icons:postgresql",
      },
      {
        name: "Redis",
        description: "In-Memory Data Store",
        icon: "simple-icons:redis",
      },
      {
        name: "Node.js",
        description: "JavaScript Runtime",
        icon: "simple-icons:nodedotjs",
      },
    ],
  },
  {
    name: "DevOps & Infrastructure",
    icon: "mdi:cloud",
    skills: [
      {
        name: "Terraform",
        description: "Infrastructure as Code",
        icon: "simple-icons:terraform",
      },
      {
        name: "ArgoCD",
        description: "GitOps CD Tool",
        icon: "simple-icons:argo",
      },
      {
        name: "AWS",
        description: "Cloud Platform",
        icon: "simple-icons:amazonaws",
      },
      {
        name: "Docker",
        description: "Containerization",
        icon: "simple-icons:docker",
      },
      {
        name: "Git",
        description: "Version Control",
        icon: "simple-icons:git",
      },
      {
        name: "GitHub",
        description: "Code Hosting Platform",
        icon: "simple-icons:github",
      },
      {
        name: "GitHub Actions",
        description: "CI/CD Pipeline",
        icon: "simple-icons:githubactions",
      },
      {
        name: "Jira",
        description: "Project Management",
        icon: "simple-icons:jira",
      },
    ],
  },
  {
    name: "Tools & Productivity",
    icon: "lucide:wrench",
    skills: [
      {
        name: "Cursor",
        description: "AI Code Editor",
        icon: "lucide:brain",
      },
      {
        name: "GitHub Copilot",
        description: "AI Code Assistant",
        icon: "simple-icons:github",
      },
      {
        name: "Figma",
        description: "UI Design Tool",
        icon: "simple-icons:figma",
      },
      {
        name: "Jira",
        description: "Project Management",
        icon: "simple-icons:jira",
      },
      {
        name: "Git",
        description: "Version Control",
        icon: "simple-icons:git",
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
    name: "HiliosAI Agent",
    description:
      "Engineered the core distributed systems layer for a B2B AI Agent platform, focusing on data retrieval and RAG system architecture. Designed multi-LLM support with advanced semantic caching and asynchronous processing capabilities.",
    tech: [
      "RAG",
      "n8n",
      "LangChain",
      "Qdrant",
      "Multi-LLM",
      "Langfuse",
      "TypeScript",
      "Vue.js",
      "React.js",
      "NextJS",
      "Apache Pulsar",
      "Redis",
    ],
    features: [
      "RAG System Architecture",
      "Multi-LLM Support",
      "Semantic Caching with Redis",
      "Asynchronous Processing with Apache Pulsar",
      "LLM Tracing & Monitoring",
      "Distributed Systems",
    ],
    status: "Active",
  },
  {
    name: "OASIS",
    description:
      "Developed a comprehensive web application for the efficient management of vessel equipment maintenance. The application provides sailors with real-time insights into maintenance schedules and timelines, facilitating proactive resource management.",
    tech: ["Vue.js", "TypeScript", "Vite", "TailwindCSS", "Component Architecture"],
    features: [
      "Real-time Maintenance Tracking",
      "Component-driven Architecture",
      "Resource Management Dashboard",
      "Maintenance Schedule Visualization",
    ],
    status: "Completed",
  },
  {
    name: "My Garment",
    description:
      "Developed a sophisticated B2B web application specifically for the textile industry. The platform serves as a central resource for users, providing specialized dictionaries, documents, and educational courses for textile professionals.",
    tech: ["Vue.js", "TypeScript", "Vite", "TailwindCSS", "Component Architecture"],
    features: [
      "Industry-specific Resource Management",
      "Educational Course Platform",
      "Document Management System",
      "Specialized Dictionary Integration",
    ],
    status: "Completed",
  },
  {
    name: "Project Template",
    description:
      "Engineered a foundational, component-driven UI template using TypeScript and Vue.js for enterprise-wide adoption. Implemented comprehensive component testing with Jest and designed system based on Figma specifications.",
    tech: ["Vue.js", "TypeScript", "Jest", "Figma", "Component Architecture"],
    features: [
      "Enterprise Component Library",
      "Component Testing with Jest",
      "Figma Design System Integration",
      "Reusable UI Templates",
    ],
    status: "Completed",
  },
  {
    name: "JetCare",
    description:
      "Developed a comprehensive insurance platform for the automobile industry with full-stack capabilities. The project encompassed the creation of both a customer-facing Sales application and a segregated Admin management web application.",
    tech: ["Vue.js", "TypeScript", "Vite", "TailwindCSS", "Component Architecture"],
    features: [
      "Dual Application Architecture",
      "Customer Sales Portal",
      "Admin Management System",
      "Insurance Policy Management",
    ],
    status: "Completed",
  },
  {
    name: "SVTech Cloudcam",
    description:
      "Designed and implemented a sophisticated surveillance system capable of monitoring and capturing real-time video feeds. Implemented AI video analytics and provided an intuitive interface for comprehensive surveillance management.",
    tech: ["Vue.js", "TypeScript", "Vite", "TailwindCSS", "Component Architecture"],
    features: [
      "Real-time Video Monitoring",
      "AI Video Analytics",
      "Cloud-based Storage",
      "Surveillance Management Interface",
    ],
    status: "Completed",
  },
];
