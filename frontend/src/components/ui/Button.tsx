import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconProps } from './Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: IconProps['name'];
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed
      rounded-md
    `;

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-[0_2px_4px_rgb(0_0_0/0.3)]',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active shadow-[0_2px_4px_rgb(0_0_0/0.3)]',
      ghost: 'bg-transparent text-text-primary hover:bg-surface-hover active:bg-surface',
      accent: 'bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active shadow-[0_2px_4px_rgb(249_115_22/0.3)]',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const classNameString = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classNameString}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : icon ? (
          <Icon name={icon} size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;