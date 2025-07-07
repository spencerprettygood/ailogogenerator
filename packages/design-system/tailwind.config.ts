import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Base 4px grid system
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
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
    },
    // Base color system: monochrome + accent
    colors: {
      // Transparent
      transparent: 'transparent',
      current: 'currentColor',

      // Base monochrome system
      white: '#FFFFFF',
      black: '#000000',

      // Grayscale
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

      // Design system semantic colors
      background: {
        DEFAULT: '#FFFFFF',
        dark: '#0D0D0D',
      },
      foreground: {
        DEFAULT: '#0D0D0D',
        dark: '#FFFFFF',
      },

      // Accent color - the ONLY color outside monochrome
      accent: {
        DEFAULT: '#FF4233', // Primary accent color
        light: '#FF6B5D', // Light variant
        dark: '#D32E20', // Dark variant
        foreground: '#FFFFFF', // Text on accent
      },

      // Semantic UI colors
      primary: {
        DEFAULT: '#0D0D0D', // Default dark shade for primary elements
        foreground: '#FFFFFF', // Text on primary
      },
      secondary: {
        DEFAULT: '#262626', // Dark gray for secondary elements
        foreground: '#FFFFFF', // Text on secondary
      },
      muted: {
        DEFAULT: '#F5F5F5', // Very light gray for backgrounds
        foreground: '#737373', // Medium gray for text
      },
      card: {
        DEFAULT: '#FFFFFF', // Card background
        foreground: '#0D0D0D', // Card text
      },
      popover: {
        DEFAULT: '#FFFFFF', // Popover background
        foreground: '#0D0D0D', // Popover text
      },
      border: '#D4D4D4', // Border color
      input: '#E5E5E5', // Input border
      ring: '#FF4233', // Focus rings
      destructive: {
        DEFAULT: '#FF4233', // Uses accent for destructive
        foreground: '#FFFFFF', // Text on destructive
      },
    },

    // Typography system
    fontFamily: {
      // Primary fonts
      raleway: ['Raleway', 'sans-serif'],
      arimo: ['Arimo', 'sans-serif'],

      // Semantic roles
      sans: ['Arimo', 'sans-serif'], // Body text
      heading: ['Raleway', 'sans-serif'], // Headings
      mono: ['IBM Plex Mono', 'monospace'], // Code
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

    // Font sizes: base is 12px
    fontSize: {
      xs: '10px',
      sm: '11px',
      base: '12px', // Base size for body text
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px', // Heading size (2× base)
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

    // Border width - standard values
    borderWidth: {
      DEFAULT: '1px', // Hairline standard
      0: '0',
      1: '1px',
      2: '2px',
      4: '4px',
    },

    // Border radius - asymmetric values
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
      // Asymmetric values
      asymmetric: {
        DEFAULT: '8px 2px 8px 2px',
        sm: '4px 1px 4px 1px',
        lg: '12px 3px 12px 3px',
      },
      offset: {
        DEFAULT: '8px 0 0 2px',
        sm: '4px 0 0 1px',
        lg: '12px 0 0 3px',
      },
    },

    // Shadows - asymmetric offsets
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none',
      // Asymmetric shadows
      'asymmetric-sm': '2px 3px 10px -3px rgba(0, 0, 0, 0.1)',
      'asymmetric-md': '4px 6px 16px -2px rgba(0, 0, 0, 0.12)',
      'asymmetric-lg': '6px 8px 24px -4px rgba(0, 0, 0, 0.15)',
      // Accent shadows
      accent: '3px 3px 0 0 #FF4233',
      'accent-sm': '2px 2px 0 0 #FF4233',
      'accent-lg': '4px 4px 0 0 #FF4233',
    },

    // Animation system
    transitionProperty: {
      none: 'none',
      all: 'all',
      DEFAULT:
        'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
      colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      opacity: 'opacity',
      shadow: 'box-shadow',
      transform: 'transform',
    },
    transitionTimingFunction: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Asymmetric easing
      asymmetric: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
    transitionDuration: {
      DEFAULT: '150ms',
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
      // Semantic durations
      quick: '120ms',
      standard: '240ms',
      emphasized: '400ms',
    },

    // Animation system
    animation: {
      none: 'none',
      spin: 'spin 1s linear infinite',
      ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      bounce: 'bounce 1s infinite',
      // Asymmetric animations
      'off-center-fade': 'off-center-fade 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      'slide-up-right': 'slide-up-right 300ms cubic-bezier(0.22, 1, 0.36, 1)',
      'skewed-fade': 'skewed-fade 240ms cubic-bezier(0.22, 1, 0.36, 1)',
      'accent-pulse': 'accent-pulse 3s cubic-bezier(0.22, 1, 0.36, 1) infinite',
    },
    keyframes: {
      spin: {
        to: { transform: 'rotate(360deg)' },
      },
      ping: {
        '75%, 100%': { transform: 'scale(2)', opacity: '0' },
      },
      pulse: {
        '50%': { opacity: '.5' },
      },
      bounce: {
        '0%, 100%': {
          transform: 'translateY(-25%)',
          animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
        },
        '50%': {
          transform: 'none',
          animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
        },
      },
      // Asymmetric keyframes
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
    },

    // Extend any base Tailwind theme values if needed
    extend: {
      // Asymmetric grid system
      gridTemplateColumns: {
        'asymmetric-1': '2fr 1fr',
        'asymmetric-2': '1fr 2fr',
        'asymmetric-3': '3fr 2fr 1fr',
        'asymmetric-4': '1fr 3fr',
      },

      // Off-center transform origins
      transformOrigin: {
        'top-left': '0% 0%',
        'bottom-right': '100% 100%',
        'off-center': '30% 70%',
      },

      // Clip paths
      clipPath: {
        'asymmetric-1': 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)',
        'asymmetric-2': 'polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 85%)',
        'asymmetric-3': 'polygon(0 15%, 15% 0, 100% 0, 100% 100%, 0 100%)',
      },
    },
  },
  plugins: [
    // Additional plugins can be added here
  ],
  darkMode: 'class', // Enable class-based dark mode
};

export default config;
