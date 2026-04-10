import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', pulse = false }) {
  const variants = {
    default: 'bg-dark-500 text-gray-300',
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]} ${pulse ? 'animate-pulse' : ''}`}>
      {pulse && <span className="w-2 h-2 rounded-full bg-current"></span>}
      {children}
    </span>
  );
}