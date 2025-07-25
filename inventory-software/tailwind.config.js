// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // These paths are for the `pages` directory if you have one.
    './pages/**/*.{js,ts,jsx,tsx,mdx}', 
    
    // These paths are for any components you have.
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    
    // THIS IS THE MOST IMPORTANT ONE FOR YOU!
    // It tells Tailwind to scan everything inside the `app` directory.
    './app/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}