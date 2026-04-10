import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color = 'primary',
  onClick 
}) {
  const colors = {
    primary: 'from-primary-600 to-primary-400',
    cyan: 'from-cyan-600 to-cyan-400',
    emerald: 'from-emerald-600 to-emerald-400',
    amber: 'from-amber-600 to-amber-400',
    rose: 'from-rose-600 to-rose-400',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-dark-700 rounded-xl p-6 border border-dark-500 hover:border-dark-400 transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}