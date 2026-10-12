import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface FeedbackAlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const FeedbackAlert: React.FC<FeedbackAlertProps> = ({
  type = 'info',
  title,
  message,
  onDismiss,
  className = '',
}) => {
  const configs = {
    info: {
      icon: <Info className="w-5 h-5 text-[#38BDF8] shrink-0" />,
      bg: 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#F3F1EC]',
    },
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />,
      bg: 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#F3F1EC]',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
      bg: 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F3F1EC]',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
      bg: 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#F3F1EC]',
    },
  }[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border text-sm text-left ${configs.bg} ${className}`}
    >
      {configs.icon}
      <div className="flex-1">
        {title && <h3 className="font-semibold text-sm mb-0.5">{title}</h3>}
        <p className="text-xs sm:text-sm text-[#F3F1EC]/90 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[#A6A9AE] hover:text-[#F3F1EC] p-1 rounded-md transition-colors"
          aria-label="Dispensar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
