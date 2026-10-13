import React from 'react';

interface AnthonysLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const AnthonysLogo: React.FC<AnthonysLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Crown + Razor + A Emblem */}
      <div className={`relative ${isSm ? 'w-8 h-8' : isLg ? 'w-16 h-16' : 'w-11 h-11'}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(214,184,117,0.35)]"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5E2B3" />
              <stop offset="45%" stopColor="#D6B875" />
              <stop offset="100%" stopColor="#B38933" />
            </linearGradient>
            <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#D6B875" />
              <stop offset="100%" stopColor="#8C671D" />
            </linearGradient>
          </defs>

          {/* Royal Crown on Top of 'A' */}
          <path
            d="M 32 24 L 38 11 L 50 18 L 62 11 L 68 24 Z"
            fill="url(#goldGrad)"
          />
          {/* Crown Jewels */}
          <circle cx="38" cy="10" r="2.2" fill="#FDF3DA" />
          <circle cx="50" cy="17" r="2.2" fill="#FDF3DA" />
          <circle cx="62" cy="10" r="2.2" fill="#FDF3DA" />

          {/* Letter 'A' Outer Frame */}
          <path
            d="M 50 25 L 26 82 L 39 82 L 46 64 L 54 64 L 61 82 L 74 82 Z"
            fill="url(#goldGrad)"
          />

          {/* Inner Triangle of 'A' */}
          <polygon points="50,37 42,54 58,54" fill="#090A0C" />

          {/* Open Straight Razor (Navalha) crossing the A */}
          {/* Handle */}
          <path
            d="M 23 58 C 21 58 19 62 26 65 L 42 63 L 42 58 Z"
            fill="url(#goldGrad)"
          />
          <circle cx="25" cy="60" r="1.5" fill="#090A0C" />

          {/* Razor Blade extending to right */}
          <path
            d="M 40 57 L 78 54 C 80 54 81 57 76 60 L 40 62 Z"
            fill="url(#bladeGrad)"
          />
        </svg>
      </div>

      {/* Main Title: ANTHONY'S */}
      <div
        className={`font-cinzel tracking-[0.22em] font-extrabold gold-gradient-text uppercase leading-none mt-1 ${
          isSm ? 'text-xs' : isLg ? 'text-2xl' : 'text-base'
        }`}
      >
        ANTHONY'S
      </div>

      {/* Subtitle: — BARBEARIA — */}
      <div
        className={`font-medium tracking-[0.35em] text-[#D6B875] uppercase mt-0.5 ${
          isSm ? 'text-[8px]' : isLg ? 'text-[11px]' : 'text-[9px]'
        }`}
      >
        BARBEARIA
      </div>

      {/* Tagline: ESTILO • RESPEITO • AUTOESTIMA */}
      {showTagline && (
        <div
          className={`tracking-[0.2em] text-[#8E939B] uppercase font-semibold mt-1 ${
            isSm ? 'text-[7px]' : 'text-[9px]'
          }`}
        >
          ESTILO • RESPEITO • AUTOESTIMA
        </div>
      )}
    </div>
  );
};
