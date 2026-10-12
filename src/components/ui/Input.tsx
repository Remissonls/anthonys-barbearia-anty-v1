import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#A6A9AE] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#A6A9AE] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-[#14171B] text-[#F3F1EC] placeholder-[#A6A9AE]/50 border rounded-lg px-3.5 py-2.5 text-sm min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D6B875]/40 focus:border-[#D6B875] ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-[#EF4444] focus:ring-[#EF4444]/40' : 'border-[#2B3036]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#A6A9AE] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#A6A9AE]/80">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
