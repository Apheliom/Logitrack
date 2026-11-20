import React from 'react';

export const Skeleton = ({ className = '', ...props }) => (
  <div
    aria-busy="true"
    className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
    {...props}
  />
);

export const CardSkeleton = () => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
    <Skeleton className="h-7 w-20" />
    <Skeleton className="h-3 w-40" />
  </div>
);
