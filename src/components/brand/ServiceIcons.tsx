import React from 'react';
import { Scissors, Sparkles, Eye, Footprints, Paintbrush, Feather } from 'lucide-react';

interface ServiceIconProps {
  serviceId?: string;
  serviceName?: string;
  className?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({
  serviceId = '',
  serviceName = '',
  className = 'w-5 h-5 text-[#D6B875]',
}) => {
  const norm = (serviceId + ' ' + serviceName).toLowerCase();

  // Sobrancelha
  if (norm.includes('sobrancelha')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Eyebrow arch */}
        <path d="M4 8C7 5 13 4 20 8" />
        {/* Eye contour below */}
        <path d="M5 13C8 10 16 10 19 13" />
        <path d="M5 13C8 16 16 16 19 13" />
        <circle cx="12" cy="13" r="2" fill="currentColor" />
      </svg>
    );
  }

  // Pezinho / Acabamento
  if (norm.includes('pezinho') || norm.includes('acabamento')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Footprint / Hairline Contour icon matching flyer */}
        <path d="M12 21a5 5 0 0 0 5-5c0-3-2-6-3-9a3 3 0 0 0-4 0c-1 3-3 6-3 9a5 5 0 0 0 5 5z" />
        <circle cx="12" cy="4" r="1.2" fill="currentColor" />
        <circle cx="15.5" cy="5.5" r="1" fill="currentColor" />
        <circle cx="8.5" cy="5.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Pigmentação
  if (norm.includes('pigmenta')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Paint pen / precision dropper */}
        <path d="m14 4 6 6-9 9H5v-6l9-9z" />
        <path d="m12 6 6 6" />
        <circle cx="5" cy="19" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Barba
  if (norm.includes('barba') && !norm.includes('combo') && !norm.includes('+')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Face contour with classic beard silhouette */}
        <circle cx="12" cy="8" r="4" />
        <path d="M6 10c0 4 2 8 6 11 4-3 6-7 6-11" />
        <path d="M9 13c1 1.5 2 2 3 2s2-.5 3-2" />
      </svg>
    );
  }

  // Combo (Corte + Barba)
  if (norm.includes('combo') || norm.includes('+')) {
    return (
      <div className="relative flex items-center justify-center">
        <Scissors className={className} />
      </div>
    );
  }

  // Default: Corte de Cabelo
  return <Scissors className={className} />;
};
