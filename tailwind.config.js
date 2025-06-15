/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'brand': ['var(--section-title-font-family, "Playfair Display")', 'serif'],
        'sans': ['var(--section-title-font-family, "Roboto")', 'sans-serif'], // Changed to use the CSS variable
        'jakarta': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}