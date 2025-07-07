import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Base color system: monochrome + accent
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        // Accent color
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          light: 'hsl(var(--accent-light, var(--accent)))',
          dark: 'hsl(var(--accent-dark, var(--accent)))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // Semantic UI colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Grayscale palette (monochrome)
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0D0D0D',
        },

        // System colors
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },

      // Base 4px grid system for spacing
      spacing: {
        0: '0px',
        px: '1px',
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
        36: '144px',
        40: '160px',
        44: '176px',
        48: '192px',
        52: '208px',
        56: '224px',
        60: '240px',
        64: '256px',
        72: '288px',
        80: '320px',
        96: '384px',

        // Asymmetric spacing
        'uneven-1': '0.375rem', // 6px
        'uneven-2': '0.625rem', // 10px
        'uneven-3': '1.125rem', // 18px
        'uneven-4': '1.875rem', // 30px
        'uneven-5': '3.125rem', // 50px
      },

      // Typography system
      fontFamily: {
        // Primary fonts (defined in layout.tsx)
        sans: ['var(--font-sans)'],
        raleway: ['var(--font-raleway)'],
        arimo: ['var(--font-arimo)'],
        mono: ['var(--font-mono)'],

        // Semantic roles
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },

      // Font weights adhering to design spec
      fontWeight: {
        thin: '200', // Primary heading weight
        light: '300', // Secondary heading weight
        normal: '400', // Body text
        medium: '500', // Emphasis
        semibold: '600', // Strong emphasis
        bold: '700', // Maximum emphasis
      },

      // Font sizes
      fontSize: {
        xs: '10px',
        sm: '11px',
        base: '12px', // Base size for body text
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
        '3xl': '24px', // Heading size
        '4xl': '32px',
        '5xl': '40px',
        '6xl': '48px',
      },

      // Letter spacing for headings
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.025em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.05em', // For headings (+5%)
        widest: '0.1em', // For headings (+10%)
      },

      // Border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',

        // Asymmetric variants
        uneven: '0.25rem 0.5rem 0.25rem 0.75rem',
        asymmetric: '1rem 0 1rem 0.25rem',
        accent: '0.75rem 0.25rem',
      },

      // Shadows
      boxShadow: {
        // Asymmetric shadows
        'asymmetric-sm': '2px 3px 10px -3px rgba(0, 0, 0, 0.1)',
        'asymmetric-md': '4px 6px 16px -2px rgba(0, 0, 0, 0.12)',
        'asymmetric-lg': '6px 8px 24px -4px rgba(0, 0, 0, 0.15)',

        // Accent shadows
        accent: '3px 3px 0 0 hsl(var(--accent))',
        'accent-sm': '2px 2px 0 0 hsl(var(--accent))',
        'accent-lg': '4px 4px 0 0 hsl(var(--accent))',
      },

      // Animation system
      transitionTimingFunction: {
        asymmetric: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      // Micro-interaction timings
      transitionDuration: {
        quick: '120ms',
        standard: '240ms',
        emphasized: '400ms',
      },

      // Transform origins
      transformOrigin: {
        'top-left': '0% 0%',
        'bottom-right': '100% 100%',
        'off-center': '30% 70%',
      },

      // Animation curves
      animation: {
        'off-center-fade': 'off-center-fade 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up-right': 'slide-up-right 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        'skewed-fade': 'skewed-fade 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'accent-pulse': 'accent-pulse 3s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        shimmer: 'shimmer 2s infinite linear',
        'indeterminate-progress':
          'indeterminate-progress 1.5s infinite cubic-bezier(0.65, 0.815, 0.735, 0.395)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },

      keyframes: {
        'off-center-fade': {
          '0%': { transform: 'scale(0.94) translateX(-6px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateX(0)', opacity: '1' },
        },
        'slide-up-right': {
          '0%': { transform: 'translateY(10px) translateX(-3px)', opacity: '0' },
          '100%': { transform: 'translateY(0) translateX(0)', opacity: '1' },
        },
        'skewed-fade': {
          '0%': { transform: 'skewX(3deg) scale(0.97)', opacity: '0' },
          '100%': { transform: 'skewX(0) scale(1)', opacity: '1' },
        },
        'accent-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 66, 51, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(255, 66, 51, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 66, 51, 0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'indeterminate-progress': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      // Grid system
      gridTemplateColumns: {
        'asymmetric-1': '2fr 1fr',
        'asymmetric-2': '1fr 2fr',
        'asymmetric-3': '3fr 2fr 1fr',
        'asymmetric-4': '1fr 3fr',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};

export default config;
