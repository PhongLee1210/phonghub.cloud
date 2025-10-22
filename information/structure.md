This is the folder structure of the whole application

.
├── README.md
├── app
│ ├── (root)
│ │ ├── contact
│ │ │ └── page.tsx
│ │ ├── experience
│ │ │ ├── [expId]
│ │ │ │ └── page.tsx
│ │ │ └── page.tsx
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ ├── projects
│ │ │ ├── [projectId]
│ │ │ │ └── page.tsx
│ │ │ └── page.tsx
│ │ ├── resume
│ │ │ └── page.tsx
│ │ └── skills
│ │ └── page.tsx
│ ├── api
│ ├── favicon.ico
│ ├── globals.css
│ ├── layout.tsx
│ └── manifest.ts
├── assets
│ └── fonts
│ ├── CalSans-SemiBold.ttf
│ ├── CalSans-SemiBold.woff
│ ├── CalSans-SemiBold.woff2
│ ├── Inter-Bold.ttf
│ └── Inter-Regular.ttf
├── components
│ ├── common
│ │ ├── analytics.tsx
│ │ ├── animated-section.tsx
│ │ ├── icons.tsx
│ │ ├── main-nav.tsx
│ │ ├── mobile-nav.tsx
│ │ ├── mode-toggle.tsx
│ │ ├── page-container.tsx
│ │ ├── page-header.tsx
│ │ ├── site-footer.tsx
│ │ └── theme-provider.tsx
│ ├── contact
│ │ └── github-redirect-card.tsx
│ ├── experience
│ │ ├── experience-card.tsx
│ │ └── timeline.tsx
│ ├── projects
│ │ ├── exp-description.tsx
│ │ └── project-card.tsx
│ ├── modals
│ │ └── custom-modal.tsx
│ ├── skills
│ │ ├── rating.tsx
│ │ └── skills-card.tsx
│ └── ui
│ ├── accordion.tsx
│ ├── button.tsx
│ ├── card.tsx
│ ├── chip-container.tsx
│ ├── chip.tsx
│ ├── custom-tooltip.tsx
│ ├── dialog.tsx
│ ├── dropdown-menu.tsx
│ ├── form.tsx
│ ├── input.tsx
│ ├── label.tsx
│ ├── modal.tsx
│ ├── tabs.tsx
│ ├── textarea.tsx
│ ├── toast.tsx
│ ├── toaster.tsx
│ ├── tooltip.tsx
│ └── use-toast.ts
├── components.json
├── config
│ ├── constants.ts
│ ├── experience.ts
│ ├── pages.ts
│ ├── projects.ts
│ ├── routes.ts
│ ├── site.ts
│ ├── skills.ts
│ └── socials.ts
├── hooks
│ ├── use-lock-body.ts
│ └── use-modal-store.ts
├── lib
│ └── utils.ts
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── providers
│ └── modal-provider.tsx
├── public
│ ├── experience
│ │ ├── ai-platform
│ │ │ ├── dashboard_1.webp
│ │ │ ├── dashboard_2.webp
│ │ │ ├── dashboard_3.webp
│ │ │ ├── training_1.webp
│ │ │ ├── analytics_1.webp
│ │ │ ├── analytics_2.webp
│ │ │ ├── api_console.webp
│ │ │ └── logo.png
│ │ ├── ecommerce
│ │ │ ├── catalog_1.webp
│ │ │ ├── catalog_2.webp
│ │ │ ├── cart_1.webp
│ │ │ ├── checkout_1.webp
│ │ │ ├── dashboard_1.webp
│ │ │ ├── admin_1.webp
│ │ │ ├── admin_2.webp
│ │ │ ├── mobile_1.webp
│ │ │ └── logo.png
│ │ ├── taskmanager
│ │ │ ├── dashboard_1.webp
│ │ │ ├── tasks_1.webp
│ │ │ ├── tasks_2.webp
│ │ │ ├── team_1.webp
│ │ │ ├── analytics_1.webp
│ │ │ ├── analytics_2.webp
│ │ │ ├── mobile_1.webp
│ │ │ ├── architecture.webp
│ │ │ └── logo.png
│ │ ├── card
│ │ │ ├── card_1.webp
│ │ │ ├── card_2.webp
│ │ │ ├── card_3.webp
│ │ │ ├── card_4.webp
│ │ │ └── logo.png
│ │ ├── cirql
│ │ │ ├── logo.png
│ │ │ ├── web_1.png
│ │ │ ├── web_2.png
│ │ │ ├── web_3.png
│ │ │ └── web_4.png
│ │ ├── hindi-keyboard
│ │ │ ├── logo.png
│ │ │ ├── web_1.png
│ │ │ ├── web_2.png
│ │ │ └── web_3.png
│ ├── logo.png
│ ├── next.svg
=├── tailwind.config.js
└── tsconfig.json
