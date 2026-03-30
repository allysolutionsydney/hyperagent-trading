import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

type SignalType = 'BUY' | 'SELL' | 'HOLD';
type SizeType = 'sm' | 'md' | 'lg';

interface SignalBadgeProps {
  signal: SignalType;
  strength: number;
  size?: SizeType;
}

export default function SignalBadge({ signal, strength, size = 'md' }: SignalBadgeProps) {
  // Clamp strength between 0 and 100
  const normalizedStrength = Math.min(Math.max(strength, 0), 100);

  const signalConfig = {
    BUY: {
      color: 'bg-green-500/20 border-green-500/50',
      glowColor: 'shadow-green-500/50',
      textColor: 'text-green-400',
      dotColor: 'bg-green-500',
      icon: <ArrowUp size={16} />,
    },
    SELL: {
      color: 'bg-red-500/20 border-red-500/50',
      glowColor: 'shadow-red-500/50',
      textColor: 'text-red-400',
      dotColor: 'bg-red-500',
      icon: <ArrowDown size={16} />,
    },
    HOLD: {
      color: 'bg-yellow-500/20 border-yellow-500/50',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      dotColor: 'bg-yellow-500',
      icon: <Minus size={16} />,
    },
  };

  const sizeConfig = {
    sm: {
      padding: 'px-2 py-1',
      textSize: 'text-xs',
      iconSize: 12,
      dotSize: 'w-1.5 h-1.5',
    },
    md: {
      padding: 'px-3 py-1.5',
      textSize: 'text-sm',
      iconSize: 16,
      dotSize: 'w-2 h-2',
    },
    lg: {
      padding: 'px-4 py-2',
      textSize: 'text-base',
      iconSize: 20,
      dotSize: 'w-2.5 h-2.5',
    },
  };

  const config = signalConfig[signal];
  const sizeProps = sizeConfig[size];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${config.color} ${sizeProps.padding} shadow-lg ${config.glowColor} transition-all duration-200 hover:shadow-xl`}
    >
      {/* Signal Dot with Glow */}
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute ${sizeProps.dotSize} ${config.dotColor} rounded-full blur-sm`}
        />
        <div className={`${sizeProps.dotSize} ${config.dotColor} rounded-full`} />
      </div>

      {/* Signal Text */}
      <span className={`font-bold ${config.textColor} ${sizeProps.textSize}`}>
        {signal}
      </span>

      {/* Strength Percentage */}
      <span className={`${config.textColor} ${sizeProps.textSize} font-medium opacity-75`}>
        {normalizedStrength}%
      </span>
    </div>
  );
}
