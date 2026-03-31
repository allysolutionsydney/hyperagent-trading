'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isConnected?: boolean;
}

// Mini ticker shown in the top bar
const TICKER_ITEMS = [
  { symbol: 'BTC', price: 64_320, change: +2.14 },
  { symbol: 'ETH', price: 3_458, change: +1.87 },
  { symbol: 'SOL', price: 151.4, change: -0.72 },
  { symbol: 'ARB', price: 1.24,  change: +3.55 },
  { symbol: 'OP',  price: 2.89,  change: +1.12 },
  { symbol: 'DOGE',price: 0.127, change: -1.34 },
];

function TopBar({ isConnected }: { isConnected: boolean }) {
  const [tick, setTick] = useState(0);

  // Small jitter to make prices feel "live"
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-[#1a1a2a] bg-[#0d0d15]/80 backdrop-blur-xl flex-shrink-0">
      {/* Left: live ticker tape */}
      <div className="flex-1 overflow-hidden mr-4">
        <div className="flex items-center gap-6 overflow-x-auto panel-scroll pb-0 scrollbar-none">
          {TICKER_ITEMS.map((item) => {
            // Tiny random jitter so numbers appear to move
            const jitter = ((tick * item.price * 0.0001) % 1) - 0.5;
            const displayPrice = (item.price + jitter).toFixed(item.price > 100 ? 0 : 3);
            const up = item.change > 0;

            return (
              <div key={item.symbol} className="flex items-center gap-1.5 flex-shrink-0 group cursor-default">
                <span className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">{item.symbol}</span>
                <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors tabular-nums">
                  {Number(displayPrice).toLocaleString('en-US', { minimumFractionDigits: item.price < 1 ? 3 : 0 })}
                </span>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${up ? 'text-green-400' : 'text-red-400'}`}>
                  {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {up ? '+' : ''}{item.change}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: connection + activity */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-blue-400/70" />
          <span className="text-[10px] text-gray-500 hidden sm:block">Markets Open</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-300 ${
          isConnected
            ? 'bg-green-500/10 border-green-500/25 text-green-400'
            : 'bg-red-500/10  border-red-500/25  text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            style={isConnected ? { boxShadow: '0 0 6px rgba(74,222,128,0.9)' } : {}} />
          {isConnected ? 'Live' : 'Demo'}
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children, isConnected = false }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Sidebar isConnected={isConnected} />

      {/* Right panel */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar isConnected={isConnected} />

        <main className="flex-1 overflow-y-auto panel-scroll">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
