/**
 * OceanX Design Tokens
 * Single source of truth for all design decisions
 * Used by Tailwind CSS v4 (CSS-first) and TypeScript components
 */

export const oceanTokens = {
  colors: {
    // Ocean palette - core brand colors
    ocean: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    // Semantic aliases for consistent usage
    primary: {
      DEFAULT: '#0ea5e9',
      foreground: '#ffffff',
      hover: '#0284c7',
      active: '#0369a1',
    },
    secondary: {
      DEFAULT: '#0284c7',
      foreground: '#ffffff',
      hover: '#0369a1',
      active: '#075985',
    },
    accent: {
      DEFAULT: '#f97316',
      foreground: '#ffffff',
      hover: '#ea580c',
      active: '#c2410c',
    },
    // Surface colors for recording-ready dark theme
    background: '#082f49',
    surface: '#0c4a6e',
    surfaceHover: '#075985',
    border: '#1e3a5f',
    borderHover: '#38bdf8',
    // Text colors
    text: {
      primary: '#f0f9ff',
      secondary: '#bae6fd',
      muted: '#7dd3fc',
      inverse: '#082f49',
    },
    // Variable-specific color scales
    temperature: {
      gradient: ['#0ea5e9', '#f97316', '#ef4444'],
      unit: '°C',
      minColor: '#0ea5e9',
      maxColor: '#ef4444',
    },
    salinity: {
      gradient: ['#0ea5e9', '#22d3ee', '#a5f3fc'],
      unit: 'PSU',
      minColor: '#0ea5e9',
      maxColor: '#a5f3fc',
    },
    currents: {
      gradient: ['#22d3ee', '#0ea5e9', '#0284c7'],
      unit: 'm/s',
      minColor: '#22d3ee',
      maxColor: '#0284c7',
    },
    // Status colors
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#ef4444',
    info: '#38bdf8',
  },
  spacing: {
    // 4px base scale
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
      display: ['Space Grotesk', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      // Fluid scale using clamp for 1920→1440 responsive
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      sm: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
      base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      lg: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
      xl: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
      '2xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 2rem)',
      '3xl': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.5rem)',
      '4xl': 'clamp(2.25rem, 2rem + 1.25vw, 3rem)',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },
  shadows: {
    // Elevation system for panels, modals, globe overlay
    1: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    2: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    3: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    4: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    5: '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    // Special shadows
    glow: '0 0 20px rgb(14 165 233 / 0.3)',
    glowStrong: '0 0 40px rgb(14 165 233 / 0.5)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.4)',
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  zIndex: {
    globe: 0,
    controls: 10,
    panels: 20,
    modals: 30,
    tooltip: 40,
    toast: 50,
  },
  breakpoints: {
    // Recording-focused breakpoints
    recording: '1920px',
    desktop: '1440px',
    tablet: '1024px',
    mobile: '768px',
  },
  container: {
    recording: '1920px',
    max: '1920px',
  },
} as const;

// Type exports for TypeScript consumers
export type OceanTokens = typeof oceanTokens;
export type OceanColorScale = keyof typeof oceanTokens.colors.ocean;
export type OceanSemanticColor = keyof typeof oceanTokens.colors.primary;
export type OceanVariable = 'temperature' | 'salinity' | 'currents';
export type OceanSpacing = keyof typeof oceanTokens.spacing;
export type OceanShadow = keyof typeof oceanTokens.shadows;
export type OceanBorderRadius = keyof typeof oceanTokens.borderRadius;
export type OceanTransition = keyof typeof oceanTokens.transitions;
export type OceanZIndex = keyof typeof oceanTokens.zIndex;

export default oceanTokens;