'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

type TrendType = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  icon?: React.ReactNode;
  trend?: TrendType;
  /** Show a blinking live dot */
  live?: boolean;
  /** Subtitle text below label */
  subtitle?: string;
}

const trendConfig: Record<TrendType, {
  gradient: string;
  border: string;
  glow: string;
  iconBg: string;
  badge: string;
  badgeText: string;
  arrowColor: string;
}> = {
  up: {
    gradient: 'from-green-500/10 via-transparent to-emerald-900/5',
    border:   'border-green-500/20 hover:border-green-500/40',
    glow:     'hover:shadow-[0_0_25px_rgba(16,185,129,0.15),0_8px_24px_rgba(0,0,0,0.4)]',
    iconBg:   'bg-green-500/15 border border-green-500/25',
    badge:    'bg-green-500/15 border border-green-500/20',
    badgeText:'text-green-400',
    arrowColor:'text-green-400',
  },
  down: {
    gradient: 'from-red-500/10 via-transparent to-rose-900/5',
    border:   'border-red-500/20 hover:border-red-500/40',
    glow:     'hover:shadow-[0_0_25px_rgba(239,68,68,0.15),0_8px_24px_rgba(0,0,0,0.4)]',
    iconBg:   'bg-red-500/15 border border-red-500/25',
    badge:    'bg-red-500/15 border border-red-500/20',
    badgeText:'text-red-400',
    arrowColor:'text-red-400',
  },
  neutral: {
    gradient: 'from-blue-500/8 via-transparent to-purple-900/5',
    border:   'border-[#1e1e2e] hover:border-blue-500/30',
    glow:     'hover:shadow-[0_0_25px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.4)]',
    iconBg:   'bg-blue-500/15 border border-blue-500/25',
    badge:    'bg-blue-500/15 border border-blue-500/20',
    badgeText:'text-blue-400',
    arrowColor:'text-gray-400',
  },
};

export default function StatCard({
  label,
  value,
  change,
  changePercent,
  icon,
  trend = 'neutral',
  live = false,
  subtitle,
}: StatCardProps) {
  const prevValueRef = useRef<string | number>(value);
  const valueRef = useRef<HTMLParagraphElement>(null);

  const cfg = trendConfig[trend];

  // Flash animation when value changes
  useEffect(() => {
    if (prevValueRef.current !== value && valueRef.current) {
      const el = valueRef.current;
      el.classList.remove('price-up', 'price-down');
      void el.offsetWidth; // reflow
      if (trend === 'up') el.classList.add('price-up');
      if (trend === 'down') el.classList.add('price-down');
      prevValueRef.current = value;
    }
  }, [value, trend]);

  const hasChange = change !== undefined || changePercent !== undefined;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-[#12121a]/90 backdrop-blur-xl
        border transition-all duration-300 cursor-default
        ${cfg.border} ${cfg.glow}
        group p-6
      `}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} pointer-events-none transition-opacity duration-300 group-hover:opacity-150`} />

      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent pointer-events-none" />

      {/* Bottom accent line that expands on hover */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 rounded-full
          ${trend === 'up' ? 'bg-green-500/60' : trend === 'down' ? 'bg-red-500/60' : 'bg-blue-500/60'}
          w-0 group-hover:w-full`}
      />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Label row */}
          <div className="flex items-center gap-2 mb-3">
            {live && (
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
            <p className="text-sm font-medium text-gray-400 truncate">{label}</p>
          </div>

          {/* Main value */}
          <p
            ref={valueRef}
            className="text-2xl font-bold text-white mb-2 tabular-nums tracking-tight transition-colors duration-300 group-hover:text-white"
          >
            {value}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
          )}

          {/* Change badge */}
          {hasChange && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.badge} ${cfg.badgeText}`}>
              {trend === 'up'      && <ArrowUp   size={11} />}
              {trend === 'down'    && <ArrowDown  size={11} />}
              {trend === 'neutral' && <Minus       size={11} className="opacity-60" />}
              <span>
                {change !== undefined && `${change > 0 ? '+' : ''}${change}`}
                {change !== undefined && changePercent !== undefined && ' · '}
                {changePercent !== undefined && `${changePercent > 0 ? '+' : ''}${changePercent}%`}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={`flex-shrink-0 ml-4 p-3 rounded-xl ${cfg.iconBg} transition-all duration-300 group-hover:scale-110`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
