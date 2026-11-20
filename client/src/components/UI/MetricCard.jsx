import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, variant = 'default' }) => {
  const accentClasses = {
    default: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    sky: 'text-sky-600 bg-sky-50 border-sky-100',
  };

  const selectedAccent = accentClasses[variant] || accentClasses.default;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon ? (
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${selectedAccent}`}>
            <Icon className="w-4 h-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend ? (
          <span className="text-xs font-semibold text-emerald-600 flex items-center">
            {trend}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
};
