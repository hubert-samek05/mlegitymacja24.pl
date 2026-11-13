import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef2fa",
          100: "#d9e2f3",
          200: "#b3c5e6",
          300: "#869fd1",
          400: "#5578b8",
          500: "#2f5a9e",
          600: "#1f4585",
          700: "#173570",
          800: "#112a5c",
          900: "#0c2150",
          950: "#071638",
        },
        ink: {
          DEFAULT: "#0b2557",
          soft: "#3a4f78",
          mute: "#6b7a96",
        },
        paper: "#f8f9fc",
        cream: "#eef1f7",
        accent: {
          50: "#fdecee",
          100: "#fbd5d8",
          300: "#f08a91",
          400: "#e5505b",
          500: "#d10f1a",
          600: "#b50d17",
          700: "#940b13",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(7, 22, 56, 0.04), 0 4px 16px -8px rgba(7, 22, 56, 0.12)",
        "card-lg": "0 2px 4px rgba(7, 22, 56, 0.05), 0 24px 56px -20px rgba(7, 22, 56, 0.28)",
        glow: "0 0 60px -10px rgba(31, 69, 133, 0.35)",
        "glow-lg": "0 20px 80px -20px rgba(31, 69, 133, 0.4)",
        phone: "0 2px 6px rgba(7,22,56,0.08), 0 32px 64px -24px rgba(7,22,56,0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(#0c2150, #0c2150)",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "qr-refresh": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        blob: "blob 14s infinite ease-in-out",
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        marquee: "marquee 32s linear infinite",
        "marquee-slow": "marquee 55s linear infinite",
      },
      backgroundSize: {
        "300%": "300% 300%",
      },
    },
  },
  plugins: [],
};
export default config;
