import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#0ea5e9',
          600: '#0284c7'
        }
      }
    }
  },
  plugins: []
};

export default config;
