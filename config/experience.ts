import { ValidSkills } from "./constants";

export interface ExperienceInterface {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: Date;
  endDate: Date | "Present";
  description: string[];
  achievements: string[];
  skills: ValidSkills[];
  companyUrl?: string;
  logo?: string;
  images?: string[];
}

export const experiences: ExperienceInterface[] = [
  {
    id: "hiliosai",
    position: "Software Engineer",
    company: "HiliosAI",
    location: "Vietnam",
    startDate: new Date("2023-10-01"),
    endDate: "Present",
    description: [
      "Core full-stack engineer driving AI-first product development across backend and frontend systems.",
      "Build and maintain scalable APIs, real-time chat interfaces, and SEO-optimized web applications.",
      "Collaborate on architecture, data flow, and CI/CD pipelines to ensure reliable, automated deployments.",
      "Focus on performance, usability, and continuous improvement within a fast-moving AI environment.",
    ],
    achievements: [
      "Built end-to-end AI sales and enrollment agents that increased qualified lead capture by over 60–90% and reduced manual lead handling by ~80%.",
      "Implemented GraphQL and REST APIs with schema versioning and contract tests to keep frontend and backend aligned during rapid iterations.",
      "Improved page performance and TTFB via SSR/SSG and server-side caching, raising organic traffic and reducing bounce rate.",
      "Delivered resilient microservice integrations and event-driven pipelines that achieved >99% sync reliability in distributed environments.",
      "Introduced Docker-based CI/CD pipelines (GitHub Actions) and containerized deployments to staging/production, shortening release lead time and enabling safe rollbacks.",
    ],
    skills: [
      "Typescript",
      "Node.js",
      "FastAPI",
      "GraphQL",
      "MongoDB",
      "PostgreSQL",
      "Redis",
      "Docker",
      "AWS",
    ],
    companyUrl: "https://hilios.ai",
    logo: "/experience/hiliosai-logo.png",
    images: [
      "/experience/hiliosai/hiliosai-stand.png",
      "/experience/hiliosai/hiliosai-meeting.JPG",
      "/experience/hiliosai/hiliosai-team.JPG",
      "/experience/hiliosai/hiliosai-me.JPG",
      "/experience/hiliosai/hiliosai-workspace.jpg",
    ],
  },
  {
    id: "ltv",
    position: "Full-stack Web Developer",
    company: "LTV",
    location: "Nha Trang, Khanh Hoa, Vietnam",
    startDate: new Date("2022-02-01"),
    endDate: new Date("2025-06-01"),
    description: [
      "Full-stack engineer building scalable web applications with Vue.js, Node.js, and AWS.",
      "Hands-on experience designing microservice-based systems and distributed architectures.",
      "Active contributor in Agile sprints, emphasizing testing, performance, and clean code.",
      "Collaborate effectively across remote teams to deliver stable, high-performing features.",
    ],
    achievements: [
      "Developed and maintained end-to-end web applications using Vue.js, Node.js, and AWS services.",
      "Redesigned legacy modules into microservices, improving scalability and deployment flexibility.",
      "Implemented automated testing and CI/CD pipelines to streamline release processes.",
      "Collaborated with remote developers and PMs to meet delivery timelines and maintain code quality.",
      "Optimized backend performance and API response times through profiling and caching strategies.",
    ],
    skills: [
      "Vue.js",
      "Node.js",
      "Typescript",
      "MongoDB",
      "AWS",
      "Docker",
      "CI/CD",
    ],
    companyUrl:
      "https://www.topcv.vn/cong-ty/ltv-software-company-limited/168588.html",
    logo: "/experience/ltv-logo.webp",
    images: [
      "/experience/ltv/ltv-workspace.jpg",
      "/experience/ltv/ltv-achievement.jpg",
      "/experience/ltv/ltv-meeting.JPG",
    ],
  },
  {
    id: "fpt-telecom",
    position: "IT Support Technician",
    company: "FPT Telecom",
    location: "Nha Trang, Khanh Hoa, Vietnam",
    startDate: new Date("2021-11-01"),
    endDate: new Date("2022-01-01"),
    description: [
      "Experienced the real working environment in a corporate setting.",
      "Applied theoretical knowledge from school to practical IT support scenarios.",
      "Developed skills in sales, advertising, and customer service within the telecom industry.",
    ],
    achievements: [
      "Successfully transitioned from academic learning to real-world corporate IT support environment.",
      "Applied theoretical knowledge to practical scenarios in telecommunications support.",
      "Developed customer service and technical support skills in a professional setting.",
      "Gained hands-on experience in sales and advertising within the telecom industry.",
      "Built foundation for professional career through practical internship experience.",
    ],
    skills: [
      "Sales",
      "Advertising Sales",
      "Customer Service",
      "Technical Support",
    ],
    companyUrl: "https://fpt.vn",
    logo: "/experience/fpt-telecom-logo.webp",
  },
];
