/**
 * OceanX Formatters
 * Utility functions for formatting numbers, dates, units
 */

import type { OceanVariable } from '../types';

/**
 * Format a number with specified precision
 */
export function formatNumber(value: number, precision: number = 2): string {
  if (!isFinite(value)) return '—';
  return value.toFixed(precision);
}

/**
 * Format temperature with unit
 */
export function formatTemperature(value: number, precision: number = 1): string {
  return `${formatNumber(value, precision)}°C`;
}

/**
 * Format salinity with unit
 */
export function formatSalinity(value: number, precision: number = 2): string {
  return `${formatNumber(value, precision)} PSU`;
}

/**
 * Format currents velocity with unit
 */
export function formatCurrents(value: number, precision: number = 2): string {
  return `${formatNumber(value, precision)} m/s`;
}

/**
 * Format depth with unit
 */
export function formatDepth(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} km`;
  }
  return `${value} m`;
}

/**
 * Format coordinate (lat/lon)
 */
export function formatCoordinate(value: number, isLatitude: boolean = true): string {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  const direction = isLatitude 
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');
  return `${degrees}°${minutes.toFixed(1)}'${direction}`;
}

/**
 * Format date/time for display
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  });
}

/**
 * Format time only
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(isoString);
}

/**
 * Get unit for variable
 */
export function getUnit(variable: OceanVariable): string {
  switch (variable) {
    case 'temperature': return '°C';
    case 'salinity': return 'PSU';
    case 'currents': return 'm/s';
  }
}

/**
 * Format value based on variable
 */
export function formatValue(value: number, variable: OceanVariable, precision?: number): string {
  const defaultPrecision = variable === 'salinity' ? 2 : 1;
  const p = precision ?? defaultPrecision;
  
  switch (variable) {
    case 'temperature': return formatTemperature(value, p);
    case 'salinity': return formatSalinity(value, p);
    case 'currents': return formatCurrents(value, p);
  }
}

/**
 * Format RMSE value
 */
export function formatRMSE(value: number): string {
  return `RMSE: ${formatNumber(value, 3)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, precision: number = 1): string {
  return `${formatNumber(value * 100, precision)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Generate color stop for gradient
 */
export function generateColorStops(colors: string[], stops?: number[]): string {
  if (stops && stops.length === colors.length) {
    return colors.map((c, i) => `${c} ${stops[i]}%`).join(', ');
  }
  return colors.join(', ');
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Inverse linear interpolation
 */
export function invLerp(start: number, end: number, value: number): number {
  return clamp((value - start) / (end - start), 0, 1);
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return lerp(outMin, outMax, invLerp(inMin, inMax, value));
}