/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Override cyan with neutral grays (no warm overlay)
        cyan: {
          50: '#FAFAFA',      // Neutral white
          100: '#F5F5F5',     // Light gray
          200: '#E5E5E5',     // Gray
          300: '#D4D4D4',     // Medium gray
          400: '#A3A3A3',     // Neutral gray
          500: '#737373',     // Dark gray
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Override indigo with Slate (professional gray-blue)
        indigo: {
          50: '#F7F8F9',
          100: '#EBEDEF',
          200: '#D4D8DC',
          300: '#B0B7BF',
          400: '#7D8694',     // Slate
          500: '#4A5568',     // Professional slate
          600: '#3D4655',
          700: '#2D3748',
          800: '#1A202C',
          900: '#171923',
          950: '#0D0F14',
        },
        // Professional accent palette
        heritage: {
          blue: '#2D3748',    // Professional slate
          charcoal: '#1A1A2E',
          cream: '#FAF9F6',
          warm: '#F5F3EF',
          stone: '#78716C',   // Warm stone
        },
        // DNA base colors (muted earth tones)
        adenine: '#78716C',   // Stone
        thymine: '#C17817',   // Amber
        guanine: '#2D8B7A',   // Teal (kept for positive)
        cytosine: '#48BB78',  // Sage
        // Semantic surface colors
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['"Libre Baskerville"', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
      borderRadius: {
        'clinical': '8px',
      },
    },
  },
  plugins: [],
}

