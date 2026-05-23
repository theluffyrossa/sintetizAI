import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0f1115',
        accent: '#7cffb2',
      },
    },
  },
  plugins: [],
};

export default config;
