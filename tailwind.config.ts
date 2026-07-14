import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ember: "rgb(var(--color-primary) / <alpha-value>)",
        saffron: "rgb(var(--color-accent) / <alpha-value>)",
        ink: "rgb(var(--color-background) / <alpha-value>)",
        coal: "rgb(var(--color-surface) / <alpha-value>)",
        cream: "rgb(var(--color-light-background) / <alpha-value>)"
      },
      borderRadius: {
        button: "var(--radius-button)",
        card: "var(--radius-card)"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(0, 0, 0, 0.18)",
        glow: "0 0 80px rgba(255, 107, 44, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        display: ["var(--font-playfair)", "Georgia", "serif"]
      }
    }
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    })
  ]
};

export default config;
