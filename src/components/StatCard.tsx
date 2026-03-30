import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

type TrendType = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  icon?: React.ReactNode;
  trend?: TrendType;
}

export default function StatCard({
  label,
  value,
  change,
  changePercent,
  icon,
  trend = 'neutral',
}: StatCardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  const gradientClass = isPositive
    ? 'from-green-500/10 to-green-500/5'
    : isNegative
      ? 'from-red-500/10 to-red-500/5'
      : 'from-blue-500/10 to-purple-600/5';

  const changeColor = isPositive
    ? 'text-green-400'
    : isNegative
      ? 'text-red-400'
      : 'text-gray-400';

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-800 bg-[#12121a]/80 backdrop-blur-xl p-6 transition-all duration-200 hover:border-gray-700 hover:shadow-lg`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} pointer-events-none`} />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-sm font-medium text-gray-400 mb-2">{label}</p>

          {/* Main Value */}
          <div className="mb-3">
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>

          {/* Change Info */}
          {(change !== undefined || changePercent !== undefined) && (
            <div className="flex items-center gap-1">
              {isPositive && <ArrowUp size={14} className={changeColor} />}
              {isNegative && <ArrowDown size={14} className={changeColor} />}
              <span className={`text-xs font-semibold ${changeColor}`}>
                {change !== undefined && `${change > 0 ? '+' : ''}${change}`}
                {change !== undefined && changePercent !== undefined && ' '}
                {changePercent !== undefined && `(${changePercent > 0 ? '+' : ''}${changePercent}%)`}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0 ml-4 p-3 rounded-lg bg-gray-800/50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
