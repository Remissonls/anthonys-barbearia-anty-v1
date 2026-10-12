import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[#1B1F24] rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
};

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#14171B] border border-[#2B3036] rounded-xl my-4">
      <div className="p-3 bg-[#1B1F24] text-[#D6B875] rounded-full mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#F3F1EC] mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-[#A6A9AE] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
};
