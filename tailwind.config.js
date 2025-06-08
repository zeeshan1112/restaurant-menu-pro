/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'brand': ['"Playfair Display"', 'serif'],
        'sans': ['"Roboto"', 'sans-serif'],
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