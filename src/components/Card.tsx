'use client';

import React from 'react';

type CardVariant = 'default' | 'profit' | 'loss' | 'warning' | 'info' | 'ai';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  variant?: CardVariant;
  /** Show a subtle animated scan-line effect */
  animated?: boolean;
  /** Extra icon next to the title */
  icon?: React.ReactNode;
}

const variantStyles: Record<CardVariant, { border: string; glow: string; accent: string; headerDot?: string }> = {
  default: {
    border: 'border-[#1e1e2e] hover:border-blue-500/30',
    glow:   'hover:shadow-[0_0_30px_rgba(14,165,233,0.12),0_8px_32px_rgba(0,0,0,0.5)]',
    accent: 'from-blue-500/5 via-transparent to-purple-600/5',
  },
  profit: {
    border: 'border-green-500/20 hover:border-green-500/50',
    glow:   'hover:shadow-[0_0_30px_rgba(16,185,129,0.15),0_8px_32px_rgba(0,0,0,0.5)]',
    accent: 'from-green-500/8 via-transparent to-emerald-600/5',
    headerDot: 'bg-green-500',
  },
  loss: {
    border: 'border-red-500/20 hover:border-red-500/50',
    glow:   'hover:shadow-[0_0_30px_rgba(239,68,68,0.15),0_8px_32px_rgba(0,0,0,0.5)]',
    accent: 'from-red-500/8 via-transparent to-rose-600/5',
    headerDot: 'bg-red-500',
  },
  warning: {
    border: 'border-yellow-500/20 hover:border-yellow-500/50',
    glow:   'hover:shadow-[0_0_30px_rgba(251,191,36,0.15),0_8px_32px_rgba(0,0,0,0.5)]',
    accent: 'from-yellow-500/8 via-transparent to-amber-600/5',
    headerDot: 'bg-yellow-500',
  },
  info: {
    border: 'border-blue-500/30 hover:border-blue-500/60',
    glow:   'hover:shadow-[0_0_30px_rgba(14,165,233,0.2),0_8px_32px_rgba(0,0,0,0.5)]',
    accent: 'from-blue-500/10 via-transparent to-cyan-600/5',
    headerDot: 'bg-blue-400',
  },
  ai: {
    border: 'border-purple-500/30 hover:border-purple-500/60',
    glow:   'hover:shadow-[0_0_30px_rgba(139,92,246,0.2),0_8px_32px_rgba(0,0,0,0.5)]',
    accent: 'from-purple-500/10 via-transparent to-pink-600/5',
    headerDot: 'bg-purple-400',
  },
};

export default function Card({
  title,
  children,
  className = '',
  headerAction,
  variant = 'default',
  animated = false,
  icon,
}: CardProps) {
  const vs = variantStyles[variant];

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-[#12121a]/90 backdrop-blur-xl
        border transition-all duration-300
        ${vs.border} ${vs.glow}
        ${className}
      `}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Background gradient tint */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${vs.accent} pointer-events-none transition-opacity duration-300`}
      />

      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent pointer-events-none" />

      {/* Scan line (optional) */}
      {animated && (
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none animate-[scanLine_3s_linear_infinite]" />
      )}

      {/* Header */}
      {title && (
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            {/* Variant indicator dot */}
            {vs.headerDot && (
              <span className={`w-1.5 h-1.5 rounded-full ${vs.headerDot} opacity-70`} />
            )}
            {/* Icon */}
            {icon && <span className="text-gray-400">{icon}</span>}
            <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 text-gray-400">{headerAction}</div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}

export { Card };
