/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f8fa',
          100: '#cdf1f5',
          200: '#9be3eb',
          300: '#69d5e1',
          400: '#37c7d7',
          500: '#31b8c6',
          600: '#28a0ae',
          700: '#208896',
          800: '#18707e',
          900: '#0f5866',
        },
        dark: {
          50: '#e6eced',
          100: '#cfd9db',
          200: '#9fb3b7',
          300: '#6f8d93',
          400: '#3f676f',
          500: '#1e3a40',
          600: '#0d1f24',
          700: '#0a1419',
        }
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(49, 184, 198, 0.3)',
        'glow-lg': '0 0 30px rgba(49, 184, 198, 0.4)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
