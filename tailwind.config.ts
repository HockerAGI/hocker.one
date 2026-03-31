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
        hocker: {
          blue: '#0ea5ff',
          cyan: '#06b6d4',
          gold: '#f6c85f',
          red: '#f43f5e'
        }
      },
      animation: {
        'hocker-pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'hocker-glow': 'glow 2s ease-in-out infinite alternate',
        'hocker-scan': 'scanline 10s linear infinite',
        'hocker-float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.6)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
