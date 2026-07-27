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
  const crossColor = '#a81b1e'; // Deep Red
  const darkBgColor = '#22252a'; // Dark Charcoal
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
            <circle cx="100" cy="100" r="92" />
          </clipPath>
        </defs>

        {/* Outer Shadow Ring / Frame */}
        <circle cx="100" cy="100" r="96" fill={darkBgColor} />

        {/* Clip graphics strictly within circle */}
        <g clipPath="url(#sealCircleClip)">
          {/* Upper Sky - Pure White */}
          <rect x="0" y="0" width="200" height="200" fill="#ffffff" />

          {/* Lower Base - Dark Charcoal */}
          <rect x="0" y="102" width="200" height="98" fill={darkBgColor} />

          {/* City Skyline Silhouette (Joburg / City Skyline) */}
          <g fill={darkBgColor}>
            {/* Left skyline blocks */}
            <rect x="18" y="88" width="16" height="20" />
            <rect x="36" y="72" width="22" height="36" />
            <rect x="60" y="82" width="16" height="26" />
            <rect x="78" y="76" width="18" height="32" />

            {/* Center Skyscraper */}
            <rect x="98" y="52" width="30" height="56" />
            <rect x="130" y="84" width="12" height="24" />

            {/* Sentech / Hillbrow Tower Spire */}
            <rect x="144" y="30" width="6" height="78" />
            <path d="M140 50 L154 50 L150 64 L144 64 Z" />
            <rect x="146" y="18" width="2" height="14" />

            {/* Right skyline blocks */}
            <rect x="154" y="70" width="18" height="38" />
            <rect x="174" y="82" width="16" height="26" />
          </g>

          {/* Red Cross "t" & Underline Bar */}
          <g fill={crossColor}>
            {/* Vertical Stem */}
            <rect x="40" y="64" width="16" height="78" rx="1" />
            {/* Crossbar */}
            <rect x="22" y="80" width="52" height="14" rx="1" />
            {/* Red Underline Bar below CC */}
            <rect x="40" y="136" width="128" height="9" rx="1" />
          </g>

          {/* White Giant "CC" Letters */}
          <g fill="#ffffff">
            {/* First 'C' */}
            <path d="M 104 80 H 76 V 132 H 104 V 118 H 92 V 94 H 104 Z" />
            {/* Second 'C' */}
            <path d="M 142 80 H 114 V 132 H 142 V 118 H 130 V 94 H 142 Z" />
          </g>

          {/* TRANSFORMATION Text */}
          <text
            x="100"
            y="158"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="15.5"
            fontWeight="900"
            fontFamily="Impact, 'Arial Black', system-ui, -apple-system, sans-serif"
            letterSpacing="0.8"
          >
            TRANSFORMATION
          </text>

          {/* CITY CHURCH Text */}
          <text
            x="100"
            y="173"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            letterSpacing="2.2"
          >
            CITY CHURCH
          </text>
        </g>

        {/* Outer Crisp White Ring Border */}
        <circle
          cx="100"
          cy="100"
          r="93"
          stroke="#ffffff"
          strokeWidth="6"
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


