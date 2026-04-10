// src/components/common/Button.js
import React from 'react';

const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-dark-600 text-gray-300 hover:bg-dark-500',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-dark-600',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}