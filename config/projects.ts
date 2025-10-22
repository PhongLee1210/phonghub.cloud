import { ValidCategory, ValidExpType, ValidSkills } from "./constants";

interface PagesInfoInterface {
  title: string;
  imgArr: string[];
  description?: string;
}

interface DescriptionDetailsInterface {
  paragraphs: string[];
  bullets: string[];
}

export interface ProjectInterface {
  id: string;
  type: ValidExpType;
  companyName: string;
  category: ValidCategory[];
  shortDescription: string;
  websiteLink?: string;
  githubLink?: string;
  techStack: ValidSkills[];
  startDate: Date;
  endDate: Date | null;
  companyLogoImg: any;
  descriptionDetails: DescriptionDetailsInterface;
  pagesInfoArr: PagesInfoInterface[];
}

export const Projects: ProjectInterface[] = [
  {
    id: "hiliosai-landing-sales-agent",
    companyName: "AI Sales & Landing Page Platform",
    type: "Professional",
    category: ["Web Dev", "Full Stack", "UI/UX"],
    shortDescription:
      "Developed a fully-automated landing page and AI-powered sales assistant for HiliosAI, combining Next.js SSR/SSG with FastAPI/GraphQL backend to capture, qualify and route leads.",
    websiteLink: "https://home.hilios.ai/",
    githubLink: undefined,
    techStack: ["Next.js", "React", "FastAPI", "GraphQL", "Docker", "AWS"],
    startDate: new Date("2024-03-01"),
    endDate: null,
    companyLogoImg: "/projects/ai-agent-sales/hero.png",
    pagesInfoArr: [
      {
        title: "Landing Page Design",
        description:
          "Next.js powered SSR/SSG landing page optimized for lead capture and SEO performance tracking",
        imgArr: ["/projects/ai-agent-sales/landing-page.png"],
      },
      {
        title: "AI Chat Interface",
        description:
          "Vue.js + TypeScript conversational AI widget with real-time chat capabilities and mobile responsiveness",
        imgArr: [
          "/projects/ai-agent-sales/chat-ui.png",
          "/projects/ai-agent-sales/chat-messages.png",
          "/projects/ai-agent-sales/mobile-ui.jpg",
        ],
      },
      {
        title: "SEO Performance & Analytics",
        description:
          "SEO performance and analytics dashboard showing improved organic traffic metrics",
        imgArr: ["/projects/ai-agent-sales/seo.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As the lead engineer for the landing page and sales-AI initiative at HiliosAI, I architected the full-stack solution leveraging Next.js for Server-Side Rendering (SSR) / Static Site Generation (SSG) and FastAPI microservices to manage content hydration, lead data processing, and AI agent responses.",
        "I embedded an AI-powered conversational assistant that handles FAQs, captures email/phone/summary leads, and routes qualified prospects to demo scheduling — seamlessly integrated into the landing page experience.",
        "On the backend I built REST and GraphQL endpoints for real-time lead tracking, integrated with CRM APIs (HubSpot) and orchestrated Slack + n8n workflows to notify sales teams immediately when high-intent interactions occur.",
        "The system is containerised using Docker, deployed on AWS infrastructure, and includes monitoring via Langfuse to track AI prompt latency, failure rates, and lead-conversion metrics — enabling data-driven optimisation of the agent and the funnel.",
        "Through this project I deepened my expertise in modern web frameworks (Next.js, React), full-stack API design, AI agent observability, lead-qualification workflows, and high-performance deployment environments.",
      ],
      bullets: [
        "Architected full-stack solution with Next.js (SSR/SSG) and FastAPI microservices for high-performance lead capture & AI agent responses",
        "Embedded AI-powered live-chat widget (Vue.js + TypeScript) directly into partner landing pages to engage prospects in real-time",
        "Built REST/GraphQL APIs for real-time lead ingestion, tracking, and routing; integrated CRM (HubSpot) and triggered Slack + n8n automation for high-intent leads",
        "Containerised architecture using Docker, deployed on AWS; implemented monitoring with Langfuse to measure prompt latency, lead conversion and agent reliability",
        "Optimized landing page for SEO and rapid user engagement, while the AI agent handles dynamic lead-qualification and routes prospects efficiently",
        "Enabled event-driven workflows to ingest web form and partner system data, enrich leads dynamically and push into AI-powered funnel",
      ],
    },
  },
  {
    id: "ai-agents-enrollment",
    companyName: "AI Assistant & Enrollment Platform",
    type: "Professional",
    category: ["Web Dev", "Full Stack", "UI/UX"],
    shortDescription:
      "Developed a comprehensive content management and blog platform using Next.js and React with TypeScript. Built SEO-optimized architecture with server-side rendering and integrated CMS for streamlined content creation and management.",
    websiteLink: "https://som.edu.vn/",
    techStack: [
      "Vue.js",
      "Node.js",
      "GraphQL",
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "AWS",
      "Docker",
      "Typescript",
    ],
    startDate: new Date("2022-03-01"),
    endDate: null,
    companyLogoImg: "/projects/ai-agent-enrollment/ait-school.jpg",
    pagesInfoArr: [
      {
        title: "Chat Widget Design",
        description:
          "Chat widget design with real-time messaging and lead tracking features",
        imgArr: ["/projects/ai-agent-enrollment/chat-widget.png"],
      },
      {
        title: "Chat Widget AI Messages",
        description:
          "Chat widget AI messages with natural language processing and response generation",
        imgArr: ["/projects/ai-agent-enrollment/chat-messages.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As lead full-stack engineer at HiliosAI, I architected a next-generation enrollment platform that seamlessly integrates low-latency chat routing, real-time observability, and automated lead-ingestion workflows. The system leverages FastAPI microservices and GraphQL to deliver AI-powered conversational experiences with minimal latency.",
        "I designed an event-driven architecture using n8n and webhook connectors to ingest leads from diverse partner systems including Wix websites and external forms. The platform enriches incoming data streams dynamically before routing them through our AI-agent pipeline, while Langfuse integration enables comprehensive monitoring of LLM performance metrics.",
        "The system implements intelligent lead classification using RAG (Retrieval-Augmented Generation) over vectorized web content, automatically prioritizing and routing high-value prospects to human follow-up while handling routine inquiries through automated workflows. This approach significantly improved enrollment conversion rates while reducing manual overhead.",
        "I developed embeddable Vue.js + TypeScript chat widgets that integrate seamlessly with partner landing pages, providing an accessible and responsive interface for prospective students. The microservices mesh powered by Moleculer orchestrates flexible APIs to deliver conversational agent responses while maintaining high performance under load.",
      ],
      bullets: [
        "Architected full-stack platform (FastAPI + Moleculer + Apollo GraphQL) for scalable conversational routing and orchestration",
        "Integrated Langfuse for prompt-quality observability, enabling data-driven prompt optimisation and latency-tracking",
        "Designed and implemented event workflows with n8n/webhooks to unify ingestion across multiple lead sources (Wix, Google Search, external forms)",
        "Deployed responsive Vue.js + TypeScript live-chat widget embedded into partner landing pages to deliver 24/7 conversational support",
        "Developed RAG-based lead-filtering using vectorised content retrieval, improving lead classification accuracy and routing efficiency",
        "Enhanced my expertise in modern architecture (micro-services, GraphQL), AI/agent observability, and end-to-end full-stack engineering for education-tech",
      ],
    },
  },
  {
    id: "gymintelops",
    companyName: "GymIntelOps - Gym Management Software",
    type: "Personal",
    category: ["Web Dev", "Full Stack"],
    shortDescription:
      "Founded and developed GymIntelOps, a comprehensive gym management platform using Next.js and Node.js, featuring CRM, automated marketing funnels, AI chatbots, and landing page builders for gym businesses.",
    websiteLink: "https://gymintelops.com/",
    techStack: [
      "Next.js",
      "React",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Typescript",
      "Tailwind CSS",
      "Python",
    ],
    startDate: new Date("2023-06-01"),
    endDate: null,
    companyLogoImg: "/projects/gymintelops/hero-section.png",
    pagesInfoArr: [
      {
        title: "Gym Management Dashboard",
        description:
          "Comprehensive dashboard for gym operations, member management, and business analytics",
        imgArr: ["/projects/gymintelops/dashboard.png"],
      },
      {
        title: "Marketing Funnel Builder",
        description:
          "Automated funnel creation system for lead generation and customer acquisition",
        imgArr: ["/projects/gymintelops/sales-funnel-dashboard.png"],
      },
      {
        title: "Workflow Automation",
        description:
          "Drag-and-drop workflow builder with templates and conversion optimization",
        imgArr: ["/projects/gymintelops/gymintelops-workfows-ui.webp"],
      },
      {
        title: "AI Customer Support",
        description:
          "AI-powered chatbot system for automated customer service and lead qualification",
        imgArr: ["/projects/gymintelops/chat-messages.webp"],
      },
      {
        title: "Calendar & Scheduling",
        description:
          "Integrated calendar system for managing gym classes and appointments",
        imgArr: ["/projects/gymintelops/calendar.webp"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As the founder of GymIntelOps, I single-handedly built a comprehensive gym management and marketing automation platform. The all-in-one solution combines CRM, automated marketing funnels, AI customer service, and business analytics to help gym owners increase revenue and streamline operations.",
        "The marketing automation system includes automated email sequences, SMS campaigns, and social media posting, all triggered by member behavior and lifecycle events. I integrated AI chatbots for 24/7 customer support, lead qualification, and appointment booking, reducing manual work by 80%.",
        "I built a visual funnel builder that allows gym owners to create complex customer journeys with drag-and-drop simplicity. The platform includes landing page templates, A/B testing, and conversion optimization features that have helped clients increase their lead conversion by 300%.",
        "The CRM system tracks every customer interaction, from initial inquiry through membership and retention. I implemented advanced analytics to show gym owners exactly which marketing channels and campaigns generate the highest ROI, enabling data-driven decisions.",
      ],
      bullets: [
        "Founded and developed comprehensive gym management platform as solo entrepreneur serving 1000+ clients",
        "Built automated marketing funnel system with drag-and-drop builder and A/B testing capabilities",
        "Integrated AI chatbots and customer service automation reducing manual work by 80%",
        "Developed CRM system with advanced analytics and ROI tracking for gym businesses",
        "Implemented payment processing, subscription management, and automated billing systems",
        "Created landing page builder with templates and conversion optimization tools",
        "Enhanced expertise in SaaS development, marketing automation, and business analytics",
      ],
    },
  },
  {
    id: "svtech-cloudcam",
    companyName: "SVTech - CloudCam Platform",
    type: "Professional",
    category: ["Web Dev", "Full Stack"],
    shortDescription:
      "Developed and deployed successful applications as a Software Engineer at SVTech, focusing on cloud-based camera systems with Vue.js frontend and Node.js backend. Optimized code for performance and scalability while building user-friendly interfaces.",
    techStack: [
      "Vue.js",
      "Node.js",
      "Material UI",
      "Tailwind CSS",
      "Jest",
      "Typescript",
    ],
    startDate: new Date("2022-02-01"),
    endDate: null,
    companyLogoImg: "/projects/svtech/svgtech-logo.png",
    pagesInfoArr: [
      {
        title: "Cloud Camera Dashboard",
        description:
          "Real-time cloud camera monitoring dashboard with live streaming and management features",
        imgArr: ["/projects/svtech/camera-dashboard.jpg"],
      },
      {
        title: "Login Interface",
        description:
          "Secure login interface with user authentication and access management",
        imgArr: ["/projects/svtech/login-ui.jpg"],
      },
      {
        title: "Fingerprint Authentication",
        description:
          "Advanced fingerprint authentication system for secure user identification",
        imgArr: ["/projects/svtech/fingerprint-ui.jpg"],
      },
      {
        title: "Cameras Grid View",
        description:
          "Comprehensive grid view displaying multiple camera feeds and monitoring status",
        imgArr: ["/projects/svtech/cameras-grid.webp"],
      },
      {
        title: "Camera Detail View",
        description:
          "Detailed camera view with individual camera controls and settings",
        imgArr: ["/projects/svtech/camera-detail.jpg"],
      },
      {
        title: "Branch Management Interface",
        description:
          "Branch management system for organizing and controlling multiple camera locations",
        imgArr: ["/projects/svtech/branch-ui.jpg"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As a Software Engineer at SVTech, I developed and deployed the CloudCam platform, a comprehensive cloud-based camera monitoring system that enables real-time streaming, recording, and management of connected cameras.",
        "I built the frontend using Vue.js with TypeScript, implementing responsive user interfaces with Element Plus and TailwindCSS for optimal user experience across desktop and mobile devices. The system included features like live streaming, camera controls, and user management.",
        "On the backend, I developed Node.js microservices that handled camera connections, video streaming, user authentication, and data storage. I implemented comprehensive testing with Jest to ensure code quality and reliability.",
        "The platform was designed for scalability and performance, with optimized code for handling multiple camera streams simultaneously while maintaining low latency and high availability.",
      ],
      bullets: [
        "Developed full-stack cloud camera platform using Vue.js frontend and Node.js backend with TypeScript",
        "Implemented real-time video streaming and camera control features with responsive UI design",
        "Built microservices architecture for scalability and performance optimization",
        "Integrated Element Plus UI library and TailwindCSS for modern, responsive interfaces",
        "Developed comprehensive testing suite with Jest for code quality assurance",
        "Collaborated remotely with cross-functional teams to deliver production-ready applications",
      ],
    },
  },
  {
    id: "contentxpert-ai-platform",
    companyName: "ContentXpert - AI Content Creation Platform",
    type: "Personal",
    category: ["Web Dev", "Full Stack"],
    shortDescription:
      "Built a comprehensive AI-powered content creation platform using Next.js and FastAPI, featuring AI-driven content generation, keyword research, multimedia creation, and collaborative workspace tools.",
    websiteLink: "https://contentxpert-7bfe7.web.app/",
    techStack: ["Next.js", "React", "Supabase", "Typescript", "Tailwind CSS"],
    startDate: new Date("2024-01-01"),
    endDate: null,
    companyLogoImg: "/projects/contentxpert/contentxpert-logo.png",
    pagesInfoArr: [
      {
        title: "Login Interface",
        description:
          "Secure login interface with user authentication and access management",
        imgArr: ["/projects/contentxpert/login-ui.png"],
      },
      {
        title: "Content Creation Interface",
        description:
          "Advanced content creation interface with AI suggestions and real-time collaboration",
        imgArr: ["/projects/contentxpert/openning-after-login.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As the founder and sole developer of ContentXpert, I built a revolutionary AI-powered content creation platform that transforms how businesses and creators produce content across multiple formats. The platform combines AI-driven content generation, keyword research, multimedia creation, and collaborative tools into a single ecosystem.",
        "I architected the full-stack solution using Next.js for the frontend with TypeScript and TailwindCSS for responsive design, and FastAPI for the backend with Python for AI integrations. The system leverages OpenAI's API for content generation, keyword analysis, and trend prediction.",
        "The platform features an intelligent content recommendation engine that analyzes user behavior, market trends, and content performance to suggest optimal topics and posting times. I implemented RAG (Retrieval-Augmented Generation) for context-aware content creation that maintains brand voice consistency.",
        "I integrated multimedia generation capabilities using AI APIs to create Capcut/Canva-quality visuals and videos directly within the platform. The system includes real-time collaboration features, automated content scheduling, and comprehensive analytics to track engagement and ROI.",
        "Deployed on AWS with Docker containerization, the platform includes advanced monitoring, user management, and scalable architecture to handle content creation workflows for teams and individuals. I implemented Stripe integration for seamless subscription management and usage-based billing.",
      ],
      bullets: [
        "Architected full-stack AI content platform using Next.js, FastAPI, and OpenAI API for intelligent content generation",
        "Implemented RAG-based content recommendations with brand voice consistency and trend analysis",
        "Built multimedia generation tools for AI-powered image and video creation within the content workflow",
        "Developed real-time collaboration features with content scheduling and performance analytics",
        "Integrated payment processing with Stripe and deployed scalable AWS infrastructure with Docker",
        "Enhanced expertise in AI integration, content optimization, and SaaS platform development",
      ],
    },
  },

  {
    id: "promptbank-ai-management",
    companyName: "PromptBank - AI Prompt Management Platform",
    type: "Personal",
    category: ["Web Dev", "Full Stack"],
    shortDescription:
      "Developed PromptBank, an AI prompt management and optimization platform using React and Node.js, featuring prompt versioning, performance analytics, and collaborative sharing for AI developers and content creators.",
    websiteLink: "https://promptbank.cloud/",
    techStack: ["React", "Node.js", "MongoDB", "Vercel", "Typescript"],
    startDate: new Date("2024-02-01"),
    endDate: null,
    companyLogoImg: "/projects/promptbank/promptbank-logo.png",
    pagesInfoArr: [
      {
        title: "Prompt Management Interface",
        description:
          "Advanced prompt management system with versioning and performance tracking",
        imgArr: ["/projects/promptbank/main-ui.png"],
      },
      {
        title: "Analytics Prompt UI",
        description:
          "Comprehensive analytics for prompt performance, usage patterns, and optimization insights",
        imgArr: ["/projects/promptbank/analyze-propmt-ui.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As the creator of PromptBank, I developed a specialized platform for AI prompt management and optimization that helps developers, content creators, and businesses maximize their AI model performance. The platform provides tools for prompt versioning, performance analytics, and collaborative optimization.",
        "I built the frontend using React with TypeScript and Material UI, creating an intuitive interface for managing large collections of prompts. The system includes advanced search and filtering capabilities, prompt categorization, and real-time collaboration features for teams working on AI projects.",
        "The backend leverages Node.js with MongoDB for flexible prompt storage and versioning. I integrated OpenAI API for prompt testing and performance analysis, enabling users to see exactly how their prompts perform across different models and use cases.",
        "I implemented comprehensive analytics that track prompt usage, success rates, token efficiency, and cost optimization. The platform includes A/B testing tools for prompts and automated suggestions for improvements based on performance data.",
        "The collaborative features allow teams to share prompts, review each other's work, and maintain prompt libraries. I built an API-first architecture that integrates with popular AI tools and platforms, making it easy for users to export and import prompts.",
      ],
      bullets: [
        "Developed AI prompt management platform with versioning and performance analytics",
        "Built comprehensive testing and optimization tools for AI prompt development",
        "Implemented collaborative features for teams working on AI projects",
        "Integrated with multiple AI APIs for cross-platform prompt testing",
        "Created analytics dashboard for tracking prompt performance and cost optimization",
        "Developed API-first architecture for seamless integration with AI development tools",
        "Enhanced expertise in AI prompt engineering, performance optimization, and developer tools",
      ],
    },
  },
  {
    id: "cursorrulescraft",
    companyName: "CursorRulesCraft - Development Tools Platform",
    type: "Personal",
    category: ["Web Dev"],
    shortDescription:
      "Built CursorRulesCraft, a development tools platform using Next.js and Bun.js, featuring Cursor IDE customization, rule management, code generation, and developer productivity enhancements.",
    websiteLink: "https://cursorrulescraft.com/",
    techStack: [
      "Next.js",
      "React",
      "Node.js",
      "Vercel",
      "Supabase",
      "Typescript",
      "Tailwind CSS",
    ],
    startDate: new Date("2024-03-01"),
    endDate: null,
    companyLogoImg: "/projects/cursorrulescraft/hero-section.png",
    pagesInfoArr: [
      {
        title: "Rule Management Interface",
        description:
          "Visual rule builder and management system for Cursor IDE customization",
        imgArr: ["/projects/cursorrulescraft/chat-ui.png"],
      },
      {
        title: "Login Interface",
        description:
          "Secure login interface with user authentication and access management",
        imgArr: ["/projects/cursorrulescraft/login-ui.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As the developer of CursorRulesCraft, I created a specialized platform for Cursor IDE users that enhances development productivity through custom rules, code generation, and workflow automation. The platform helps developers customize their IDE experience and streamline their coding processes.",
        "I developed the platform using Next.js with TypeScript and TailwindCSS, creating a modern interface for managing Cursor rules, custom configurations, and development workflows. The system includes a visual rule builder that makes it easy for developers to create complex IDE customizations without deep technical knowledge.",
        "The backend uses Node.js with PostgreSQL and Prisma for robust data management. I integrated AI-powered code generation features that help developers write better code faster, with context-aware suggestions and automated refactoring tools.",
        "I built comprehensive rule management features that allow users to create, share, and collaborate on Cursor IDE configurations. The platform includes version control for rules, performance analytics, and integration with popular development tools and services.",
        "The platform features a marketplace for sharing rules and configurations, along with advanced analytics to help developers understand their coding patterns and productivity metrics. I implemented real-time collaboration features for teams working on shared development environments.",
      ],
      bullets: [
        "Developed Cursor IDE customization platform with visual rule builder and management tools",
        "Built AI-powered code generation and productivity enhancement features",
        "Implemented comprehensive rule sharing and collaboration system",
        "Created analytics dashboard for tracking development productivity and patterns",
        "Integrated with development tools and services for seamless workflow",
        "Developed marketplace for sharing and discovering IDE configurations",
        "Enhanced expertise in developer tools, IDE customization, and productivity software",
      ],
    },
  },
  {
    id: "my-garment",
    companyName: "My Garment - E-commerce Platform",
    type: "Professional",
    category: ["Web Dev", "Full Stack"],
    shortDescription:
      "Built a full-stack e-commerce platform for garment business using Vue.js frontend and Node.js backend with AWS infrastructure. Implemented inventory management, order processing, and customer management systems.",
    techStack: ["Vue.js", "Node.js", "AWS", "PostgreSQL", "Typescript"],
    startDate: new Date("2022-04-01"),
    endDate: null,
    companyLogoImg: "/projects/mygarment/banner.jpeg",
    pagesInfoArr: [
      {
        title: "Team Collaboration",
        description:
          "Working closely with cross-functional teams to deliver high-quality e-commerce solutions",
        imgArr: ["/projects/mygarment/team.jpeg"],
      },
      {
        title: "Software Usage",
        description:
          "Developing and testing new features for the e-commerce platform",
        imgArr: ["/projects/mygarment/using-software.jpeg"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As a Full-stack Web Developer at My Garment, I built a comprehensive e-commerce platform specifically designed for garment and clothing businesses, enabling seamless online sales, inventory management, and customer relationship management.",
        "I developed the frontend using Vue.js with TypeScript, creating a modern, responsive e-commerce storefront with product catalogs, shopping cart functionality, user authentication, and checkout processes. The platform featured advanced filtering, search capabilities, and mobile-first design.",
        "On the backend, I implemented Node.js services with PostgreSQL database for product management, order processing, inventory tracking, and customer data management. I deployed the entire infrastructure on AWS for scalability and reliability.",
        "The platform included features like product variants (sizes, colors), inventory tracking, order fulfillment, customer accounts, and analytics. I focused on performance optimization and security best practices for handling e-commerce transactions.",
      ],
      bullets: [
        "Built full-stack e-commerce platform using Vue.js frontend and Node.js backend with TypeScript",
        "Implemented comprehensive product catalog with filtering, search, and shopping cart functionality",
        "Developed admin dashboard for inventory management, order processing, and customer management",
        "Integrated PostgreSQL database with AWS infrastructure for scalable e-commerce operations",
        "Created responsive mobile-first design for seamless shopping experience across all devices",
        "Implemented secure payment processing and customer account management systems",
      ],
    },
  },

  {
    id: "jetcare-platform",
    companyName: "JetCare - Healthcare Management System",
    type: "Professional",
    category: ["Web Dev", "Full Stack"],
    shortDescription:
      "Built a comprehensive healthcare management platform using Vue.js frontend and Node.js microservices with GraphQL API. Optimized and refactored code for better performance and maintainability while designing intuitive UI based on mockups.",
    techStack: ["Vue.js", "Node.js", "GraphQL", "PostgreSQL", "Typescript"],
    startDate: new Date("2022-06-01"),
    endDate: null,
    companyLogoImg: "/projects/jetcare/jetcare-logo.svg",
    pagesInfoArr: [
      {
        title: "Landing Page Design",
        description:
          "Developed responsive landing page with modern UI components and optimized performance",
        imgArr: ["/projects/jetcare/landing-page.jpg"],
      },
      {
        title: "Mobile Interface",
        description:
          "Designed and implemented mobile-first UI with focus on accessibility and user experience",
        imgArr: ["/projects/jetcare/mobile-ui.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "At JetCare, I worked as a Full-stack Web Developer building a comprehensive healthcare management system that streamlined patient care, appointment scheduling, and medical record management for healthcare providers.",
        "I developed the frontend using Vue.js with TypeScript, creating intuitive and responsive user interfaces based on detailed UI mockups. The system featured patient management, appointment scheduling, medical records, and reporting capabilities.",
        "The backend architecture utilized Node.js microservices with Moleculer framework and GraphQL API for efficient data fetching and manipulation. I integrated PostgreSQL database for reliable data storage and implemented comprehensive data validation.",
        "I focused heavily on code optimization and refactoring to improve performance, readability, and maintainability. This included implementing best practices for state management, component reusability, and API design patterns.",
      ],
      bullets: [
        "Developed full-stack healthcare management platform using Vue.js and Node.js microservices architecture",
        "Implemented GraphQL API for efficient data fetching and real-time updates across the application",
        "Built responsive UI components based on detailed mockups with focus on healthcare user experience",
        "Integrated PostgreSQL database with optimized queries for healthcare data management",
        "Refactored and optimized code for better performance, scalability, and maintainability",
        "Collaborated in remote environment with healthcare professionals and development team",
      ],
    },
  },
  {
    id: "project-template",
    companyName: "Project Template - UI Component Library",
    type: "Professional",
    category: ["Web Dev", "Frontend"],
    shortDescription:
      "Developed a comprehensive UI component library and project template using Vue.js with TailwindCSS and Element Plus. Designed and built reusable UI components based on Figma designs for rapid project development.",
    techStack: ["Vue.js", "Tailwind CSS", "Material UI", "Figma", "Typescript"],
    startDate: new Date("2022-08-01"),
    endDate: new Date("2022-10-01"),
    companyLogoImg: "/projects/project-template/home-page.png",
    pagesInfoArr: [
      {
        title: "Component Library",
        description:
          "Reusable Vue.js component library with TailwindCSS styling and Element Plus integration",
        imgArr: ["/projects/project-template/component-library.png"],
      },
      {
        title: "Design System",
        description:
          "Comprehensive design system with Figma-based components and documentation",
        imgArr: ["/projects/project-template/design-system.png"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "At Project Template, I worked as a Frontend Web Developer creating a comprehensive UI component library and project template system that accelerated development workflows and ensured design consistency across multiple projects.",
        "I designed and built reusable Vue.js components using TypeScript, implementing a complete design system based on Figma mockups. The component library included form elements, navigation components, data display components, and layout systems.",
        "I integrated TailwindCSS for utility-first styling and Element Plus for advanced UI components, creating a flexible and maintainable styling architecture. The system included comprehensive documentation and usage examples.",
        "The project template provided a solid foundation for new projects, including pre-configured build tools, development server, testing setup, and deployment pipeline. I focused on developer experience and rapid prototyping capabilities.",
      ],
      bullets: [
        "Developed comprehensive Vue.js component library with TypeScript for reusable UI elements",
        "Implemented TailwindCSS and Element Plus integration for flexible and modern styling",
        "Created design system based on Figma mockups with comprehensive documentation",
        "Built project template with pre-configured development tools and deployment pipeline",
        "Designed reusable components for forms, navigation, data display, and layout systems",
        "Collaborated remotely with design and development teams to ensure consistency",
      ],
    },
  },
  {
    id: "oasis-platform",
    companyName: "OASIS - Business Management Platform",
    type: "Professional",
    category: ["Web Dev", "Frontend"],
    shortDescription:
      "Developed the frontend for OASIS business management platform using Vue.js and Node.js microservices. Built responsive UI components and integrated with backend services while working in a remote development environment.",
    techStack: ["Vue.js", "Node.js", "Typescript"],
    startDate: new Date("2022-10-01"),
    endDate: null,
    companyLogoImg: "/projects/oasis/ship-2.jpg",
    pagesInfoArr: [
      {
        title: "Management Interface",
        description:
          "Intuitive management interface for business operations and workflow management",
        imgArr: ["/projects/oasis/ship-1.jpg"],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "As a Frontend Web Developer at OASIS, I developed a comprehensive business management platform that streamlined operations, analytics, and workflow management for businesses of all sizes.",
        "I built the frontend using Vue.js with TypeScript, creating responsive and intuitive user interfaces for dashboard analytics, business operations management, and reporting features. The platform provided real-time insights and streamlined business processes.",
        "I worked closely with the backend team to integrate Node.js microservices using the Moleculer framework, ensuring seamless data flow and API communication. I implemented modern frontend patterns including component-based architecture and state management.",
        "The platform emphasized user experience with clean, professional interfaces that improved productivity and provided actionable business insights. I collaborated effectively in a remote environment with cross-functional teams.",
      ],
      bullets: [
        "Developed Vue.js frontend for comprehensive business management platform with TypeScript",
        "Built responsive dashboard with real-time analytics and business reporting features",
        "Integrated with Node.js microservices architecture using Moleculer framework",
        "Designed intuitive UI components for business operations and workflow management",
        "Implemented modern frontend patterns with component-based architecture and state management",
        "Collaborated effectively in remote environment with cross-functional development teams",
      ],
    },
  },
];

export const featuredProjects = Projects.slice(0, 3);
