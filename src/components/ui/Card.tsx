import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-[#2B3036] p-4 sm:p-5 transition-all ${
        elevated ? 'bg-[#1B1F24]' : 'bg-[#14171B]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
