/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'element-blue': '#4931FF', // Updated to the latest requested color
      },
      fontFamily: {
        minecraft: ['Minecraft', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
