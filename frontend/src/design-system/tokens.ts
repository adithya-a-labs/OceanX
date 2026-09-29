/**
 * OceanX Design Tokens
 * Single source of truth for all design decisions
 * Used by Tailwind CSS v4 (CSS-first) and TypeScript components
 *
 * The palette is a flat, near-black instrument surface. Depth is expressed with
 * surface elevation and hairline borders rather than translucency, blur, or
 * gradient fills, and the only accent hue is a single blue. Data series use the
 * semantic status colours, which are functional (observed vs model, positive vs
 * negative difference) and never decorative.
 */

export const oceanTokens = {
  colors: {
    // Neutral instrument ramp. Kept so `ocean-*` utilities and the
    // OceanColorScale type stay available; it is no longer a blue theme scale.
    ocean: {
      50: '#f5f7f8',
      100: '#e2e6e9',
      200: '#b7bec5',
      300: '#9aa3ab',
      400: '#7f8992',
      500: '#69737b',
      600: '#525c64',
      700: '#3d454c',
      800: '#2a3036',
      900: '#1b2024',
      950: '#080a0c',
    },
    // Semantic aliases for consistent usage
    primary: {
      DEFAULT: '#2aafef',
      foreground: '#05080a',
      hover: '#1c93d0',
      active: '#1579ad',
    },
    secondary: {
      DEFAULT: '#12161a',
      foreground: '#f5f7f8',
      hover: '#171c21',
      active: '#0d1013',
    },
    // One accent only: the same blue as primary. Callers that still read
    // `accent` keep working and cannot reintroduce a second hue.
    accent: {
      DEFAULT: '#2aafef',
      foreground: '#05080a',
      hover: '#1c93d0',
      active: '#1579ad',
    },
    // Surface colors for the flat dark instrument theme
    background: '#080a0c',
    surface: '#0d1013',
    surfaceElevated: '#12161a',
    surfaceHover: '#171c21',
    border: '#252b31',
    borderHover: '#343b42',
    // Text colors
    text: {
      primary: '#f5f7f8',
      secondary: '#b7bec5',
      muted: '#7f8992',
      inverse: '#080a0c',
    },
    // Variable-specific scales. `swatches` are discrete solid colours: the
    // legend renders them as separate blocks rather than interpolating between
    // them, so nothing in the UI depends on a gradient.
    temperature: {
      swatches: ['#1d4e89', '#2aafef', '#e0a03c', '#d9534f'],
      unit: '°C',
      minColor: '#1d4e89',
      maxColor: '#d9534f',
    },
    salinity: {
      swatches: ['#24406e', '#3c7fb8', '#57b7c4', '#a5d8c9'],
      unit: 'PSU',
      minColor: '#24406e',
      maxColor: '#a5d8c9',
    },
    currents: {
      swatches: ['#123f4f', '#1f7a96', '#2aafef', '#7fdcc0'],
      unit: 'm/s',
      minColor: '#123f4f',
      maxColor: '#7fdcc0',
    },
    // Data-series colours. Observed/model and positive/negative difference need
    // to be told apart at a glance, so these are functional, not accent chrome.
    observed: '#2aafef',
    model: '#d9a441',
    // Status colors
    success: '#3fb950',
    warning: '#d9a441',
    error: '#e5484d',
    /** Lightened for text/icon use: #e5484d is only 4.3:1 on the panel surface. */
    errorBright: '#ff9a9e',
    info: '#2aafef',
    /** Chart chrome */
    gridline: '#1b2024',
    overlay: 'rgba(13, 16, 19, 0.98)',
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
    // Flat surfaces rely on a 1px border, not a drop shadow. These are kept only
    // for true overlays (menus, banners) that sit above the globe canvas.
    1: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
    2: '0 4px 8px -2px rgb(0 0 0 / 0.55)',
    3: '0 8px 24px -6px rgb(0 0 0 / 0.6)',
    4: '0 16px 32px -8px rgb(0 0 0 / 0.65)',
    5: '0 24px 48px -12px rgb(0 0 0 / 0.7)',
    inner: 'inset 0 1px 0 0 rgb(255 255 255 / 0.03)',
  },
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    '2xl': '12px',
    full: '9999px',
  },
  transitions: {
    fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '280ms cubic-bezier(0.4, 0, 0.2, 1)',
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
