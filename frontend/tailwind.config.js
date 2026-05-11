/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#4f46e5',
          DEFAULT: '#3730a3',
          dark: '#1e1b4b',
        }
      }
    },
  },
  plugins: [],
}
