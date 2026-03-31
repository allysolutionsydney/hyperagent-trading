import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export default function Card({ title, children, className = '', headerAction }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-800 bg-[#12121a]/80 backdrop-blur-xl transition-all duration-200 hover:border-gray-700 hover:shadow-xl hover:shadow-blue-500/10 ${className}`}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-600/5 pointer-events-none" />

      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
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
