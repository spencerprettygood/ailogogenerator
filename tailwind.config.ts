import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Design System: Monochrome with #ff4233 accent
      colors: {
        // Base palette: monochrome range
        background: "#FFFFFF",
        foreground: "#0D0D0D",
        
        // Grayscale variants
        gray: {
          50: "#FAFAFA",
          100: "#F5F5F5", 
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0D0D0D",
        },
        
        // Card colors
        card: "#FFFFFF",
        "card-foreground": "#0D0D0D",
        
        // Popover colors
        popover: "#FFFFFF",
        "popover-foreground": "#0D0D0D",
        
        // Single vivid accent color (Red)
        // Used for asymmetric focal points
        accent: {
          DEFAULT: "#FF4233", // Vivid red accent
          light: "#FF6B5D",
          dark: "#D32E20",
          foreground: "#FFFFFF",
        },
        
        // Primary uses the accent color
        primary: {
          DEFAULT: "#FF4233",
          light: "#FF6B5D",
          dark: "#D32E20",
          foreground: "#FFFFFF",
        },
        
        // Secondary as pure contrast
        secondary: {
          DEFAULT: "#0D0D0D",
          foreground: "#FFFFFF",
        },
        
        // Muted variants for subtle elements
        muted: {
          DEFAULT: "#F5F5F5", // Very light gray for backgrounds
          foreground: "#737373", // Medium gray for text
        },
        
        // Border color - asymmetric thickness
        border: "#D4D4D4",
        input: "#E5E5E5",
        ring: "#FF4233", // Accent color for focus rings
        
        // Destructive actions 
        destructive: {
          DEFAULT: "#FF4233",
          foreground: "#FFFFFF",
        },
      },
      
      // Typography: Raleway for headings, Arimo for body text
      fontFamily: {
        'raleway': ['Raleway', 'sans-serif'],
        'arimo': ['Arimo', 'sans-serif'],
        sans: ['Arimo', 'sans-serif'],
        heading: ['Raleway', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      
      fontWeight: {
        'thin': '200',
        'light': '300', 
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      
      // Font size system with precise scaling
      fontSize: {
        'xs': '10px',
        'sm': '11px',
        'base': '12px',  // Base size for body text
        'md': '14px',
        'lg': '16px',
        'xl': '18px',
        '2xl': '20px',
        '3xl': '24px',  // Heading size
        '4xl': '32px',
        '5xl': '40px',
        '6xl': '48px'
      },
      
      letterSpacing: {
        'tightest': '-0.05em',
        'tighter': '-0.025em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.05em',    // For headings (+5%)
        'widest': '0.1em',    // For headings (+10%)
      },
      
      // Asymmetric grid system
      gridTemplateColumns: {
        'asymmetric-1': '2fr 1fr',
        'asymmetric-2': '1fr 2fr',
        'asymmetric-3': '3fr 2fr 1fr',
        'asymmetric-4': '1fr 3fr',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
      
      // Varied border widths for asymmetry
      borderWidth: {
        '0': '0',
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
        '6': '6px',
        '8': '8px',
      },
      
      // Uneven margin and padding system
      spacing: {
        'uneven-1': '0.375rem', // 6px
        'uneven-2': '0.625rem', // 10px
        'uneven-3': '1.125rem', // 18px
        'uneven-4': '1.875rem', // 30px
        'uneven-5': '3.125rem', // 50px
      },
      
      // Motion system: fast-out-slow-in easing
      transitionTimingFunction: {
        'asymmetric': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      
      // Micro-interaction timings
      transitionDuration: {
        'quick': '120ms',
        'standard': '240ms',
        'emphasized': '400ms',
      },
      
      // Off-center transform origins
      transformOrigin: {
        'top-left': '0% 0%',
        'bottom-right': '100% 100%',
        'off-center': '30% 70%',
      },
      
      // Animation curves with asymmetric qualities
      animation: {
        'off-center-fade': 'off-center-fade 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up-right': 'slide-up-right 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        'skewed-fade': 'skewed-fade 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'accent-pulse': 'accent-pulse 3s cubic-bezier(0.22, 1, 0.36, 1) infinite',
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
      },
      
      // Uneven border radius for asymmetric corners
      borderRadius: {
        'uneven': '0.25rem 0.5rem 0.25rem 0.75rem',
        'asymmetric': '1rem 0 1rem 0.25rem',
        'accent': '0.75rem 0.25rem',
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      
      // Off-center box shadows
      boxShadow: {
        'asymmetric-sm': '2px 3px 10px -3px rgba(0, 0, 0, 0.1)',
        'asymmetric-md': '4px 6px 16px -2px rgba(0, 0, 0, 0.12)',
        'asymmetric-lg': '6px 8px 24px -4px rgba(0, 0, 0, 0.15)',
        'accent': '3px 3px 0 0 #FF4233',
        'accent-light': '2px 2px 0 0 rgba(255, 66, 51, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;