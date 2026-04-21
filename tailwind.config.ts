import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#9bc53d',
          'green-strong': '#7fa428',
          'green-soft': '#f3f9e8',
          ink: '#0f1115',
          'ink-2': '#171b22',
          muted: '#66726c',
          line: '#e2ecda'
        }
      },
      boxShadow: {
        brand: '0 20px 60px rgba(15, 17, 21, 0.08)',
        'brand-soft': '0 12px 32px rgba(15, 17, 21, 0.05)'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      backgroundImage: {
        'brand-dark':
          'radial-gradient(circle at top right, rgba(155,197,61,0.18), transparent 25%), linear-gradient(135deg, #171b22 0%, #1f2530 100%)'
      }
    }
  },
  plugins: []
}

export default config