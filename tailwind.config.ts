import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        "safe-top":    "env(safe-area-inset-top,    0px)",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-left":   "env(safe-area-inset-left,   0px)",
        "safe-right":  "env(safe-area-inset-right,  0px)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          2: "hsl(var(--card-2))",
        },
        lavender: {
          DEFAULT: "hsl(var(--lavender))",
          foreground: "hsl(var(--lavender-foreground))",
          soft: "hsl(var(--lavender-soft))",
          "soft-foreground": "hsl(var(--lavender-soft-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chat: {
          bg: "hsl(var(--chat-bg))",
          header: "hsl(var(--chat-header))",
          border: "hsl(var(--chat-border))",
          input: "hsl(var(--chat-input))",
          "bubble-ai": "hsl(var(--chat-bubble-ai))",
          "bubble-user": "hsl(var(--chat-bubble-user))",
          "bubble-user-border": "hsl(var(--chat-bubble-user-border))",
          thinking: "hsl(var(--chat-thinking))",
          launcher: "hsl(var(--chat-launcher))",
          placeholder: "hsl(var(--chat-placeholder))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        heading: ["var(--font-heading)", ...fontFamily.sans],
        karla: ["var(--font-karla)", ...fontFamily.sans],
        miniver: ["var(--font-miniver)", ...fontFamily.sans],
        name: ['"Times New Roman"', "Times", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-lg)",
        pill: "var(--radius-pill)",
        chat: "var(--radius-chat)",
        "chat-lg": "var(--radius-chat-lg)",
      },
      boxShadow: {
        soft: "var(--shadow-1)",
        medium: "var(--shadow-2)",
        large: "var(--shadow-3)",
        "lavender-glow": "0 20px 60px rgba(120, 90, 255, 0.28)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate, typography],
  safelist: ["dark", "retro", "cyberpunk", "paper", "aurora", "synthwave"],
} satisfies Config;

export default config;
