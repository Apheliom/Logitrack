import React from 'react';

const VARIANT_STYLES = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-blue-50 text-blue-800 border-blue-200',
  IN_TRANSIT: 'bg-sky-50 text-sky-800 border-sky-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-800 border-rose-200',
  URGENT: 'bg-red-50 text-red-800 border-red-200',
  NORMAL: 'bg-slate-100 text-slate-700 border-slate-200',
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
  ONLINE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  OFFLINE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const VARIANT_LABELS = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  IN_TRANSIT: 'En Ruta',
  DELIVERED: 'Entregado',
  FAILED: 'No Entregado',
  URGENT: 'Urgente',
  NORMAL: 'Normal',
  LOW: 'Baja',
  ONLINE: 'En Línea',
  OFFLINE: 'Desconectado',
};

export const Badge = ({ variant = 'NORMAL', children, className = '' }) => {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.NORMAL;
  const label = children || VARIANT_LABELS[variant] || variant;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'DELIVERED' || variant === 'ONLINE'
            ? 'bg-emerald-500 animate-pulse'
            : variant === 'IN_TRANSIT'
            ? 'bg-sky-500 animate-pulse'
            : variant === 'URGENT'
            ? 'bg-red-500'
            : variant === 'PENDING'
            ? 'bg-amber-500'
            : 'bg-slate-400'
        }`}
      />
      {label}
    </span>
  );
};
