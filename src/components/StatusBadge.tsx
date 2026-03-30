import React from 'react';

type StatusType = 'connected' | 'disconnected' | 'loading' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      glowColor: 'shadow-green-500/50',
      text: label || 'Connected',
    },
    disconnected: {
      color: 'bg-gray-500',
      glowColor: 'shadow-gray-500/50',
      text: label || 'Disconnected',
    },
    loading: {
      color: 'bg-yellow-500',
      glowColor: 'shadow-yellow-500/50',
      text: label || 'Loading',
    },
    error: {
      color: 'bg-red-500',
      glowColor: 'shadow-red-500/50',
      text: label || 'Error',
    },
  };

  const config = statusConfig[status];
  const isLoading = status === 'loading';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/50 border border-gray-800">
      <div
        className={`w-2 h-2 rounded-full ${config.color} ${config.glowColor} shadow-lg ${
          isLoading ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-xs font-medium text-gray-300">{config.text}</span>
    </div>
  );
}
