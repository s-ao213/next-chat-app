import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        bounce: "bounce 1s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-highlight": "fadeInHighlight 1s ease-out forwards",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(-5%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInHighlight: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
          "50%": {
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            backgroundColor: "transparent",
          },
        },
      },
    },
  },
  plugins: [],

  variants: {
    extend: {
      animation: ["hover", "focus"],
    },
  },
} satisfies Config;
