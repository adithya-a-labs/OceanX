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
      font-medium transition-colors duration-150 border
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed
      rounded-md
    `;

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary-hover hover:border-primary-hover active:bg-primary-active',
      secondary: 'bg-surface-elevated text-text-primary border-border hover:bg-surface-hover hover:border-border-hover active:bg-surface',
      ghost: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-hover hover:text-text-primary hover:border-border active:bg-surface',
      accent: 'bg-accent text-accent-foreground border-accent hover:bg-accent-hover hover:border-accent-hover active:bg-accent-active',
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
        ) : icon && iconPosition === 'left' ? (
          <Icon name={icon} size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
        ) : null}
        {children}
        {!loading && icon && iconPosition === 'right' ? (
          <Icon name={icon} size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;