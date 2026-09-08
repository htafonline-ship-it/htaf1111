import React from 'react';
import logoImage from '../assets/images/htaf_education_logo_1786735151763.jpg';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showVersion?: boolean;
  className?: string;
  glow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  showVersion = false,
  className = '',
  glow = true
}) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const imageDimensionMap = {
    xs: 'rounded-lg',
    sm: 'rounded-xl',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Icon Container with Website Color Scheme */}
      <div className="relative shrink-0 group">
        {/* Neon Ambient Halo / Glow matching Website Palette (Cyan, Blue, Purple) */}
        {glow && (
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300 pointer-events-none" />
        )}

        <div
          className={`relative ${sizeMap[size]} ${imageDimensionMap[size]} bg-[#070e22] p-[1.5px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-xl overflow-hidden`}
        >
          <img
            src={logoImage}
            alt="شعار منصة هتاف العاصمي التعليمية"
            className="w-full h-full object-cover rounded-[10px] transform group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Optional Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black bg-gradient-to-r from-cyan-400 via-blue-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
              هتاف العاصمي
            </span>
            {showVersion && (
              <span className="bg-cyan-950 text-cyan-300 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-cyan-800/60 shadow-xs">
                v3.0 AI
              </span>
            )}
          </div>
          <p className="text-[11px] text-blue-300/70 font-medium">المنصة التعليمية الذكية</p>
        </div>
      )}
    </div>
  );
};
