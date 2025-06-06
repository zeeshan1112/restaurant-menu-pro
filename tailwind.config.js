/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'jakarta': ['"Plus Jakarta Sans"', 'sans-serif']
      },
      colors: {
        brand: {
          'primary': '#2d3748', // Dark Slate
          'secondary': '#a0aec0', // Gray
          'accent': '#c53030', // Red Accent
          'background': '#f7fafc', // Light Gray BG
          'surface': '#ffffff', // White
        }
      }
    },
  },
  plugins: [],
}