import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.ts",
    "./src/**/*.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        hocker: {
          bg: "var(--hocker-bg)",
          surface: "var(--hocker-surface)",
          panel: "var(--hocker-panel)",
          cyan: "var(--hocker-cyan)",
          blue: "var(--hocker-blue)",
          white: "var(--hocker-text)",
          muted: "var(--hocker-muted)",
          line: "var(--hocker-line)",
          alert: "var(--hocker-alert)",
          success: "var(--hocker-success)",
        },
      },
      backgroundImage: {
        "hocker-aurora":
          "radial-gradient(circle at 20% 20%, rgba(14,165,233,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(56,189,248,0.14), transparent 22%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.12), transparent 25%), linear-gradient(180deg, #020617 0%, #020617 100%)",
        "hocker-glass":
          "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.42) 100%)",
        "hocker-grid":
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        "hocker-scan":
          "linear-gradient(180deg, rgba(14,165,233,0) 0%, rgba(14,165,233,0.10) 50%, rgba(14,165,233,0) 100%)",
      },
      boxShadow: {
        "hocker-glow": "0 0 0 1px rgba(14,165,233,0.12), 0 18px 60px rgba(2,6,23,0.45)",
        "hocker-glow-strong":
          "0 0 0 1px rgba(14,165,233,0.18), 0 0 30px rgba(14,165,233,0.20), 0 24px 100px rgba(2,6,23,0.55)",
      },
      animation: {
        "hocker-enter": "hocker-enter 520ms ease both",
        "hocker-float": "hocker-float 7s ease-in-out infinite",
        "hocker-pulse": "hocker-pulse 5s ease-in-out infinite",
        "hocker-scan": "hocker-scan 8s linear infinite",
      },
      keyframes: {
        "hocker-enter": {
          from: {
            opacity: "0",
            transform: "translate3d(0, 16px, 0) scale(0.98)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0) scale(1)",
          },
        },
        "hocker-float": {
          "50%": { transform: "translateY(-12px)" },
        },
        "hocker-pulse": {
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        "hocker-scan": {
          "0%": { transform: "translateY(-110%)" },
          "100%": { transform: "translateY(110%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;