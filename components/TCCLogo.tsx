import React from 'react';

interface TCCLogoProps {
  /** 'dark' for dark header context, 'light' for light context */
  variant?: 'dark' | 'light';
  className?: string;
  showText?: boolean;
}

export const TCCLogo: React.FC<TCCLogoProps> = ({
  variant = 'dark',
  className = 'h-10 sm:h-12',
  showText = true,
}) => {
  const isLightBg = variant === 'light';

  // Branding Colors matching official TCC seal
  const textColor = isLightBg ? '#0f172a' : '#ffffff';
  const subtextColor = isLightBg ? '#475569' : '#cbd5e1';

  return (
    <div className={`inline-flex items-center space-x-3 group flex-shrink-0 ${className}`}>
      {/* Official Circular TCC Seal Emblem */}
      <svg
        viewBox="0 0 200 200"
        className="h-full w-auto max-h-12 sm:max-h-14 aspect-square overflow-visible filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="sealCircleClip">
            <circle cx="100" cy="100" r="88" />
          </clipPath>
        </defs>

        {/* Base dark background circle */}
        <circle cx="100" cy="100" r="97" fill="#1c1d21" />

        {/* Clip graphics strictly within inner circle */}
        <g clipPath="url(#sealCircleClip)">
          {/* Upper Sky - Pure White */}
          <path d="M 10 100 A 90 90 0 0 1 190 100 Z" fill="#ffffff" />
          
          {/* Lower Base - Dark Charcoal */}
          <rect x="0" y="98" width="200" height="102" fill="#1c1d21" />

          {/* City Skyline Silhouette (Joburg Skyline with Hillbrow Tower) */}
          <g fill="#1c1d21">
            {/* Left skyline blocks */}
            <rect x="18" y="84" width="14" height="20" />
            <rect x="34" y="68" width="18" height="34" />
            <rect x="54" y="52" width="24" height="50" />
            <rect x="80" y="74" width="16" height="28" />
            <rect x="98" y="60" width="18" height="42" />

            {/* Hillbrow Tower (Spire with pod) */}
            <rect x="119" y="24" width="5" height="78" />
            {/* Top antenna spike */}
            <rect x="120.5" y="14" width="2" height="12" />
            {/* Tower Observation Pod */}
            <path d="M 114 36 H 129 L 126 50 H 117 Z" />

            {/* Right skyline blocks */}
            <rect x="138" y="66" width="20" height="36" />
            <rect x="160" y="78" width="18" height="24" />
          </g>

          {/* Red Cross "t" & Connected Underline Bar */}
          <g fill="#b91c1c">
            {/* Horizontal Crossbar of 't' */}
            <rect x="28" y="78" width="54" height="16" rx="1.5" />
            {/* Vertical Stem of 't' */}
            <rect x="48" y="60" width="18" height="92" rx="1.5" />
            {/* Red Underline Bar running below 'CC' */}
            <rect x="48" y="136" width="112" height="16" rx="1.5" />
          </g>

          {/* White Giant "CC" Letters */}
          <g fill="#ffffff">
            {/* First 'C' */}
            <path d="M 106 78 H 80 C 73 78 68 83 68 90 V 124 C 68 131 73 136 80 136 H 106 V 118 H 88 C 85 118 84 116 84 113 V 101 C 84 98 85 96 88 96 H 106 Z" />
            {/* Second 'C' */}
            <path d="M 152 78 H 126 C 119 78 114 83 114 90 V 124 C 114 131 119 136 126 136 H 152 V 118 H 134 C 131 118 130 116 130 113 V 101 C 130 98 131 96 134 96 H 152 Z" />
          </g>

          {/* TRANSFORMATION Text */}
          <text
            x="100"
            y="163"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="15.5"
            fontWeight="900"
            fontFamily="Impact, 'Arial Black', sans-serif"
            letterSpacing="0.8"
          >
            TRANSFORMATION
          </text>

          {/* CITY CHURCH Text */}
          <text
            x="100"
            y="176"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2"
          >
            CITY CHURCH
          </text>
        </g>

        {/* Inner Thin White Ring Border */}
        <circle
          cx="100"
          cy="100"
          r="89"
          stroke="#ffffff"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Outer White Ring Border */}
        <circle
          cx="100"
          cy="100"
          r="95"
          stroke="#ffffff"
          strokeWidth="3.5"
          fill="none"
        />
      </svg>

      {/* Brand Text next to emblem */}
      {showText && (
        <div className="flex flex-col text-left leading-tight justify-center flex-shrink-0">
          <span
            className="font-black tracking-tight text-sm sm:text-base lg:text-lg whitespace-nowrap transition-colors"
            style={{ color: textColor }}
          >
            TRANSFORMATION
          </span>
          <span
            className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.22em] whitespace-nowrap transition-colors"
            style={{ color: subtextColor }}
          >
            City Church
          </span>
        </div>
      )}
    </div>
  );
};

export default TCCLogo;



