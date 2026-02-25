import type { Config } from "tailwindcss";

export default {
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
        // Paleta oficial de marca inyectada
        hocker: {
          900: '#0b0f13',
          800: '#0f1720',
          blue: '#0ea5ff',
          cyan: '#06b6d4',
          gold: '#f6c85f'
        }
      },
    },
  },
  plugins: [],
} satisfies Config;