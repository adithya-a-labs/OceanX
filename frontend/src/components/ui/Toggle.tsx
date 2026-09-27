import { forwardRef, type InputHTMLAttributes } from 'react';
import { Icon, type IconProps } from './Icon';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  icon?: IconProps['name'];
  iconPosition?: 'left' | 'right';
  onChange: (checked: boolean) => void;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, icon, iconPosition = 'left', disabled, onChange, id, className = '', ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <label
        className={`
          group inline-flex items-center gap-3 cursor-pointer
          select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          className={`
            sr-only peer
            ${disabled ? 'peer-disabled' : ''}
          `}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          {...props}
        />
        <div className={`
          relative inline-flex h-6 w-11 items-center
          rounded-full border border-border bg-surface
          transition-colors duration-200
          peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background
          group-has-[:checked]:bg-primary group-has-[:checked]:border-primary
          group-has-[:disabled]:opacity-50 group-has-[:disabled]:cursor-not-allowed
        `} aria-hidden="true">
          <span className={`
            block h-4 w-4 transform rounded-full bg-white shadow-2
            transition-transform duration-200 ease-out
            group-has-[:checked]:translate-x-5
          `} />
        </div>
        <div className="flex items-center gap-2">
          {icon && iconPosition === 'left' && <Icon name={icon} size={16} className="text-text-secondary" />}
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {icon && iconPosition === 'right' && <Icon name={icon} size={16} className="text-text-secondary" />}
        </div>
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;