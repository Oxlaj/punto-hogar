/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#426B5A',
          dark: '#355546'
        },
        carrot: {
          DEFAULT: '#F97316',
          dark: '#EA580C'
        },
        nav: {
          DEFAULT: '#426B5A',
          dark: '#355546'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#FAF8F4'
        },
        ink: '#303A35',
        terracotta: '#E7A35A',
        line: '#E6E5DF',
        success: '#23865A',
        danger: '#C83F45'
      }
    }
  },
  plugins: []
};
