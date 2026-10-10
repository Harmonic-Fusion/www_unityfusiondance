/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#078c8c',
          deep: '#056868',
        },
        mint: {
          DEFAULT: '#8bd1d9',
          soft: '#6cd9ba',
        },
        ink: {
          DEFAULT: '#1c1c1c',
          soft: '#3a3a3a',
        },
        paper: '#f7fbfb',
        wash: '#e8f6f4',
      },
      fontFamily: {
        display: ['Philosopher', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'Source Sans Pro', 'system-ui', 'sans-serif'],
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1.25rem',
        lg: '2rem',
        xl: '3.5rem',
        '2xl': '5.5rem',
      },
      maxWidth: {
        content: '68rem',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(7, 140, 140, 0.12)',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};