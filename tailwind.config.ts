import type { Config } from 'tailwindcss';

const spacingScale = {
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem'
};

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'text-success',
    'text-warning',
    'text-danger',
    'bg-success/10',
    'bg-warning/10',
    'bg-danger/10',
    'border-success',
    'border-warning',
    'border-danger'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        lg: '2rem'
      }
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: '#F8FAFC',
          dark: '#0F172A'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1E293B'
        },
        primary: '#4F46E5',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      },
      spacing: spacingScale,
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
        md: '0 4px 24px rgba(15, 23, 42, 0.12)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;

