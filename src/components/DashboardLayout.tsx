'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useAccountState } from '@/hooks/useAccountState';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isConnected?: boolean;
}

function TopBar({ isConnected }: { isConnected: boolean }) {
  const [tick, setTick] = useState(0);
  const store = useStore();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const tickerItems = useMemo(() => {
    const mids = store.allMids || {};
    const preferred = ['BTC', 'ETH', 'SOL', 'ARB', 'OP', 'DOGE'];

    return preferred.map((symbol) => {
      const basePrice = Number(mids[symbol] || 0);
      const jitter = basePrice ? ((tick * basePrice * 0.0001) % 1) - 0.5 : 0;
      return {
        symbol,
        price: basePrice ? basePrice + jitter : 0,
      };
    });
  }, [store.allMids, tick]);

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-[#1a1a2a] bg-[#0d0d15]/80 backdrop-blur-xl flex-shrink-0">
      <div className="flex-1 overflow-hidden mr-4">
        <div className="flex items-center gap-6 overflow-x-auto panel-scroll pb-0 scrollbar-none">
          {tickerItems.map((item) => {
            const displayPrice = item.price > 0 ? item.price.toFixed(item.price > 100 ? 0 : 3) : '—';
            const latest = Number(store.candles[store.candles.length - 1]?.close || 0);
            const up = item.symbol === store.selectedCoin ? latest >= Number(store.candles[0]?.open || latest) : true;

            return (
              <div key={item.symbol} className="flex items-center gap-1.5 flex-shrink-0 group cursor-default">
                <span className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">{item.symbol}</span>
                <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors tabular-nums">
                  {displayPrice !== '—'
                    ? Number(displayPrice).toLocaleString('en-US', { minimumFractionDigits: item.price < 1 && item.price > 0 ? 3 : 0 })
                    : '—'}
                </span>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${up ? 'text-green-400' : 'text-red-400'}`}>
                  {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {item.symbol === store.selectedCoin && latest && store.candles.length > 1
                    ? `${up ? '+' : ''}${(((latest - Number(store.candles[0]?.open || latest)) / Number(store.candles[0]?.open || latest)) * 100).toFixed(2)}%`
                    : item.price > 0 ? 'live' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-blue-400/70" />
          <span className="text-[10px] text-gray-500 hidden sm:block">
            {store.accountBalance > 0 ? `Balance ${store.accountBalance.toFixed(2)}` : 'Market live'}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-300 ${
          isConnected
            ? 'bg-green-500/10 border-green-500/25 text-green-400'
            : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
        }`}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}
            style={isConnected ? { boxShadow: '0 0 6px rgba(74,222,128,0.9)' } : {}}
          />
          {isConnected ? 'Live' : 'Partial'}
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children, isConnected = false }: DashboardLayoutProps) {
  const { error: accountError } = useAccountState();
  const layoutConnected = isConnected;

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Sidebar isConnected={layoutConnected} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar isConnected={layoutConnected} />

        <main className="flex-1 overflow-y-auto panel-scroll">
          <div className="p-4 md:p-6 lg:p-8">
            {accountError && (
              <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
                Account hydration warning: {accountError}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
