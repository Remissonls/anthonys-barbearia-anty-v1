import React from 'react';
import { AppointmentStatus } from '../../types';
import { Clock, CheckCircle2, PlayCircle, CheckCheck, XCircle, UserX } from 'lucide-react';

export interface BadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    AppointmentStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    pending: {
      label: 'Pendente',
      icon: <Clock className="w-3.5 h-3.5" />,
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/30',
    },
    confirmed: {
      label: 'Confirmado',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      bg: 'bg-[#22C55E]/15',
      text: 'text-[#22C55E]',
      border: 'border-[#22C55E]/30',
    },
    in_progress: {
      label: 'Em atendimento',
      icon: <PlayCircle className="w-3.5 h-3.5" />,
      bg: 'bg-[#38BDF8]/15',
      text: 'text-[#38BDF8]',
      border: 'border-[#38BDF8]/30',
    },
    completed: {
      label: 'Concluído',
      icon: <CheckCheck className="w-3.5 h-3.5" />,
      bg: 'bg-[#A6A9AE]/15',
      text: 'text-[#F3F1EC]',
      border: 'border-[#A6A9AE]/30',
    },
    cancelled: {
      label: 'Cancelado',
      icon: <XCircle className="w-3.5 h-3.5" />,
      bg: 'bg-[#EF4444]/15',
      text: 'text-[#EF4444]',
      border: 'border-[#EF4444]/30',
    },
    no_show: {
      label: 'Não compareceu',
      icon: <UserX className="w-3.5 h-3.5" />,
      bg: 'bg-[#A855F7]/15',
      text: 'text-[#A855F7]',
      border: 'border-[#A855F7]/30',
    },
  };

  const cfg = configs[status] || configs.pending;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};
