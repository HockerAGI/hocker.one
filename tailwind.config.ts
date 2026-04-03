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
        hocker: {
          dark: "#080A0F", // Fondo base ultra oscuro
          surface: "#121622", // Paneles y tarjetas
          primary: "#00FF88", // Neón principal (Ajustar al verde/cian de tu logo)
          secondary: "#7000FF", // Acento disruptivo
          alert: "#FF0044", // Killswitch / Errores
        },
      },
      backgroundImage: {
        'nova-gradient': 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(8,10,15,1) 100%)',
        'glass-panel': 'linear-gradient(180deg, rgba(18, 22, 34, 0.7) 0%, rgba(18, 22, 34, 0.4) 100%)',
      },
      boxShadow: {
        'neon-glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'neon-alert': '0 0 20px rgba(255, 0, 68, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
