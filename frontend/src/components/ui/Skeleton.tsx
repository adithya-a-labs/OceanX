import { type HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'chart' | 'globe' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({
  variant = 'rect',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) => {
  const variantStyles: Record<string, { width?: string; height?: string; borderRadius?: string }> = {
    text: { height: '1rem', borderRadius: '2px' },
    card: { height: '8rem', borderRadius: '6px' },
    chart: { height: '16rem', borderRadius: '6px' },
    globe: { width: '100%', height: '100%', borderRadius: '0' },
    circle: { borderRadius: '9999px' },
    rect: { borderRadius: '4px' },
  };

  const vStyle = variantStyles[variant] || variantStyles.rect;

  return (
    <div
      className={`
        skeleton bg-surface-hover animate-pulse
        ${className}
      `}
      style={{
        width: width ?? vStyle.width,
        height: height ?? vStyle.height,
        borderRadius: vStyle.borderRadius,
        ...style,
      }}
      {...props}
    />
  );
};

export default Skeleton;