import React from 'react';

export const LogiTrackLogo = ({ size = 'md', variant = 'full', className = '' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Isotipo vectorial exclusivo: Pin de ruta dinámica con enlace inteligente */}
      <div className={`${iconSizes[size] || iconSizes.md} rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-sm shadow-blue-500/20 flex items-center justify-center shrink-0`}>
        <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4/5 h-4/5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
              className="fill-blue-600"
            />
            <circle cx="12" cy="9" r="2.8" className="fill-white" />
            <path
              d="M17 14l3.5 3.5m0 0l-2 2m2-2h-4"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span className={`font-bold ${textSizes[size] || textSizes.md} text-slate-900 tracking-tight`}>
              Logi
            </span>
            <span className={`font-bold ${textSizes[size] || textSizes.md} text-blue-600 tracking-tight`}>
              Track
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 rounded-md">
              PRO
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">
            Fleet Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
