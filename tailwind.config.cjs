/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff', // white background
        foreground: '#1e293b', // slate-800 text

        // Cards
        card: '#ffffff', // white card background
        'card-foreground': '#1e293b',

        // Primary (Indigo)
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          foreground: '#ffffff', // white text
          hover: '#3730a3', // indigo-800
        },

        // Secondary (Purple)
        secondary: {
          DEFAULT: '#7c3aed', // purple-600
          foreground: '#ffffff', // white text
          hover: '#5b21b6', // purple-800
        },

        // Accent colors
        accent: '#eef2ff', // indigo-50
        muted: '#f3f4f6', // slate-100
        destructive: '#dc2626', // red-600

        // Retenza brand colors
        retenza: {
          primary: '#4f46e5', // indigo-600
          'primary-dark': '#3730a3', // indigo-800
          secondary: '#7c3aed', // purple-600
          'secondary-dark': '#5b21b6', // purple-800
          accent: '#6366f1', // indigo-500
          'accent-light': '#a5b4fc', // indigo-300
          'accent-bg': '#eef2ff', // indigo-50
          'accent-border': '#c7d2fe', // indigo-200
        }
      },
    },
  },
  plugins: [],
};
