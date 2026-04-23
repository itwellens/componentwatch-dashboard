/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // System font stack — matches the Apple-inspired landing page.
        // Uses the platform's native UI font for that crisp, native feel.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Minimal palette — mostly grayscale with one accent.
        // Tweak these later to match index.html precisely.
        ink: {
          DEFAULT: '#1d1d1f',  // Apple-style near-black text
          muted:   '#6e6e73',  // Secondary text
          faint:   '#86868b',  // Tertiary/disabled
        },
        surface: {
          DEFAULT: '#ffffff',
          alt:     '#f5f5f7',  // Apple section background
        },
        line: '#d2d2d7',       // Apple hairline borders
        accent: {
          DEFAULT: '#0071e3',  // Apple blue for links/primary actions
          hover:   '#0077ed',
        },
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
