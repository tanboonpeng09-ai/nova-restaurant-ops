import type { Config } from "tailwindcss";

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
        ember: "#FF6B2C",
        saffron: "#FFD166",
        ink: "#0E0E0E",
        coal: "#171717",
        cream: "#F7F0E8"
      },
      borderRadius: {
        button: "16px",
        card: "24px"
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
  plugins: []
};

export default config;
