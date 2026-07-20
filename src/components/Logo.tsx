import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeMap = {
    sm: { svg: 'h-8 w-auto', text: 'text-lg' },
    md: { svg: 'h-12 w-auto', text: 'text-2xl' },
    lg: { svg: 'h-20 w-auto', text: 'text-4xl' },
    xl: { svg: 'h-32 w-auto', text: 'text-5xl' },
  };

  const dims = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-fidelity Vector SVG recreating the Bike One Logo */}
      <svg
        className={dims.svg}
        viewBox="0 0 500 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer sprocket / chainwheel teeth */}
        <g id="sprocket" className="animate-[spin_40s_linear_infinite]">
          <circle cx="200" cy="220" r="140" stroke="#71717A" strokeWidth="6" strokeDasharray="16, 12" />
          <circle cx="200" cy="220" r="160" stroke="#94A3B8" strokeWidth="4" strokeDasharray="10, 15" />
          
          {/* Detailed sprocket holes */}
          <circle cx="200" cy="220" r="150" stroke="#E2E8F0" strokeWidth="12" strokeDasharray="40, 20" />
          
          {/* Inner metallic structure (5 spokes of the chainring) */}
          <path d="M 200 80 L 200 360" stroke="#CBD5E1" strokeWidth="16" strokeLinecap="round" />
          <path d="M 80 220 L 320 220" stroke="#CBD5E1" strokeWidth="16" strokeLinecap="round" />
          <path d="M 115 135 L 285 305" stroke="#94A3B8" strokeWidth="14" strokeLinecap="round" />
          <path d="M 115 305 L 285 135" stroke="#94A3B8" strokeWidth="14" strokeLinecap="round" />
          
          {/* Outer metal ring */}
          <circle cx="200" cy="220" r="130" stroke="#475569" strokeWidth="4" />
          
          {/* Inner core circle */}
          <circle cx="200" cy="220" r="45" fill="#3F3F46" stroke="#94A3B8" strokeWidth="6" />
          <circle cx="200" cy="220" r="25" fill="#18181B" stroke="#E2E8F0" strokeWidth="4" />
        </g>

        {/* Crank arm (Biela) - Overlayed over sprocket, slightly angled */}
        <g id="crank-arm">
          {/* Main arm */}
          <path
            d="M 200 220 L 370 240"
            stroke="url(#metallicGradient)"
            strokeWidth="32"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
          {/* Detailed inner metallic line */}
          <path
            d="M 200 220 L 360 238"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Axis Cap with date "04.06.23" engraved (from logo) */}
          <circle cx="200" cy="220" r="20" fill="#1E293B" />
          <path d="M 190 220 A 10 10 0 0 1 210 220" stroke="#64748B" strokeWidth="2" fill="none" />
          
          {/* Pedal attachment hole */}
          <circle cx="360" cy="239" r="10" fill="#0F172A" stroke="#E2E8F0" strokeWidth="3" />
        </g>

        {/* DNA Helix Bicycle Chain - Winding in amber/orange across the sprocket */}
        <g id="amber-chain" className="drop-shadow-md">
          {/* S-curve path of the chain winding around sprocket and crank */}
          <path
            d="M 40 220 Q 120 120, 200 220 T 360 240 Q 420 280, 460 250"
            fill="none"
            stroke="#D97706"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="24, 12"
          />
          {/* Outer chain links overlay (bright amber) */}
          <path
            d="M 40 220 Q 120 120, 200 220 T 360 240 Q 420 280, 460 250"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="8, 28"
          />
          {/* Chain rivets (small silver dots on chain joints) */}
          <path
            d="M 40 220 Q 120 120, 200 220 T 360 240 Q 420 280, 460 250"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="2, 34"
          />
        </g>

        {/* Gradients definition */}
        <defs>
          <linearGradient id="metallicGradient" x1="200" y1="220" x2="370" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="30%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="70%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
      </svg>

      {/* Styled text spelling "BIKE ONE" */}
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <span className={`font-sans font-black tracking-tighter text-white ${dims.text} leading-none`}>
            BIKE
          </span>
          <span className="font-sans font-extrabold tracking-widest text-amber-500 text-[10px] uppercase leading-none mt-1">
            ONE
          </span>
        </div>
      )}
    </div>
  );
}
