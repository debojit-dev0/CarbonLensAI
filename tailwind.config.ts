import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 0: "#05080A", 1: "#0A1012", 2: "#0E1618" },
        primary: "#39FFA0",
        secondary: "#34D0FF",
        warning: "#FFB454",
        text: { 0: "#F2F7F5", 1: "#AEBBC0", 2: "#6D7C79" },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Sora", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(57,255,160,0.25)",
        glowCyan: "0 0 24px rgba(52,208,255,0.25)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        rise: "rise 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
