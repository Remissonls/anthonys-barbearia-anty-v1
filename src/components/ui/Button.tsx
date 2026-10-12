import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#D6B875]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none touch-target';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[38px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#D6B875] text-[#0B0D0F] hover:bg-[#E5C885] active:bg-[#C4A663] font-semibold shadow-sm',
    secondary:
      'bg-[#1B1F24] text-[#F3F1EC] hover:bg-[#252B32] active:bg-[#14171B] border border-[#2B3036]',
    outline:
      'bg-transparent text-[#D6B875] border border-[#D6B875]/50 hover:bg-[#D6B875]/10 active:bg-[#D6B875]/20',
    ghost:
      'bg-transparent text-[#A6A9AE] hover:text-[#F3F1EC] hover:bg-[#1B1F24] active:bg-[#14171B]',
    danger:
      'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25 active:bg-[#EF4444]/35',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
