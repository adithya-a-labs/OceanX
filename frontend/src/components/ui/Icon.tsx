import { type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconProps {
  name: keyof typeof LucideIcons;
  size?: number;
  className?: string;
  'aria-label'?: string;
}

// Cache for dynamically loaded icons
const iconCache = new Map<string, ComponentType<any>>();

/**
 * Icon component - loads Lucide icons on demand
 * Reduces bundle size by only importing used icons
 */
export const Icon = ({ name, size = 18, className = '', 'aria-label': ariaLabel }: IconProps) => {
  // Get or create the icon component
  let IconComponent = iconCache.get(name);
  
  if (!IconComponent) {
    // @ts-ignore - LucideIcons[name] is valid
    IconComponent = LucideIcons[name];
    if (IconComponent) {
      iconCache.set(name, IconComponent);
    }
  }

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      aria-label={ariaLabel || name}
      aria-hidden={!ariaLabel}
      strokeWidth={2}
    />
  );
};

Icon.displayName = 'Icon';

// Re-export commonly used icons for convenience (using PascalCase as in Lucide)
export const Icons = {
  // Navigation
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  
  // Variables
  Thermometer: 'Thermometer',
  Droplet: 'Droplet',
  Waves: 'Waves',
  
  // Layers
  Eye: 'Eye',
  EyeOff: 'EyeOff',
  Layers: 'Layers',
  
  // Argo
  MapPin: 'MapPin',
  Activity: 'Activity',
  BarChart2: 'BarChart2',
  TrendingUp: 'TrendingUp',
  TrendingDown: 'TrendingDown',
  
  // Controls
  Play: 'Play',
  Pause: 'Pause',
  SkipBack: 'SkipBack',
  SkipForward: 'SkipForward',
  RotateCcw: 'RotateCcw',
  
  // UI
  Sun: 'Sun',
  Moon: 'Moon',
  Settings: 'Settings',
  Info: 'Info',
  AlertCircle: 'AlertCircle',
  CheckCircle: 'CheckCircle',
  XCircle: 'XCircle',
  Download: 'Download',
  Upload: 'Upload',
  RefreshCw: 'RefreshCw',
  Globe: 'Globe',
  Map: 'Map',
  
  // Status
  Wifi: 'Wifi',
  WifiOff: 'WifiOff',
  Battery: 'Battery',
  Signal: 'Signal',
  
  // Close
  X: 'X',
} as const;

export type IconName = keyof typeof Icons;

export default Icon;