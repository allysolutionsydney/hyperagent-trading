'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Target,
  Wallet,
  Activity,
  Zap,
  Send,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import SignalBadge from '@/components/SignalBadge';
import { useStore } from '@/hooks/useStore';
import { useMarketData } from '@/hooks/useMarketData';
import {
  formatPrice,
  formatUSD,
  formatPercent,
  formatPnL,
  formatTimestamp,
} from '@/utils/format';
import { Candle } from '@/types';

const DEMO_CANDLES: Candle[] = [
  { timestamp: 1711699200000, open: 62000, high: 62500, low: 61800, close: 62300, volume: 1250000 },
  { timestamp: 1711702800000, open: 62300, high: 62800, low: 62200, close: 62600, volume: 1180000 },
  { timestamp: 1711706400000, open: 62600, high: 63200, low: 62500, close: 63000, volume: 1420000 },
  { timestamp: 1711710000000, open: 63000, high: 63500, low: 62900, close: 63200, volume: 980000 },
  { timestamp: 1711713600000, open: 63200, high: 63800, low: 63100, close: 63500, volume: 1350000 },
  { timestamp: 1711717200000, open: 63500, high: 64200, low: 63400, close: 64000, volume: 1650000 },
  { timestamp: 1711720800000, open: 64000, high: 64300, low: 63700, close: 64100, volume: 1200000 },
  { timestamp: 1711724400000, open: 64100, high: 64600, low: 63900, close: 64300, volume: 1380000 },
];

const DEMO_ORDERBOOK = {
  timestamp: Date.now(),
  bids: [
    [62950, 2.5],
    [62900, 3.2],
    [62850, 1.8],
    [62800, 4.1],
    [62750, 2.9],
  ],
  asks: [
    [63050, 2.8],
    [63100, 3.5],
    [63150, 2.1],
    [63200, 3.9],
    [63250, 2.6],
  ],
  spread: 100,
  bidAskRatio: 0.95,
};

function CandlestickChart({ candles, selectedCoin }: { candles: Candle[]; selectedCoin: string }) {
  if (!candles || candles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No chart data available
      </div>
    );
  }

  const minPrice = Math.min(...candles.map((c) => c.low)) * 0.998;
  const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.002;
  const priceRange = maxPrice - minPrice || 1;
  const chartHeight = 250;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">{selectedCoin}/USD</h4>
        <div className="flex gap-2">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-64 bg-gray-900/50 rounded border border-gray-800 p-4">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4 text-xs text-gray-500 w-16">
          <div>{formatPrice(maxPrice)}</div>
          <div>{formatPrice((maxPrice + minPrice) / 2)}</div>
          <div>{formatPrice(minPrice)}</div>
        </div>

        <div className="ml-16 h-full flex items-end justify-between gap-1">
          {candles.map((candle, idx) => {
            const highY = ((maxPrice - candle.high) / priceRange) * chartHeight;
            const lowY = ((maxPrice - candle.low) / priceRange) * chartHeight;
            const openY = ((maxPrice - candle.open) / priceRange) * chartHeight;
            const closeY = ((maxPrice - candle.close) / priceRange) * chartHeight;

            const wickHeight = Math.max(lowY - highY, 1);
            const bodyHeight = Math.abs(closeY - openY) || 1;
            const isGreen = candle.close >= candle.open;

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-end flex-1 h-full group relative"
              >
                <div
                  className={`w-0.5 ${isGreen ? 'bg-green-500/40' : 'bg-red-500/40'}`}
                  style={{ height: `${(wickHeight / chartHeight) * 100}%` }}
                />

                <div
                  className={`w-full rounded-sm transition-all ${
                    isGreen
                      ? 'bg-green-500/80 hover:bg-green-500'
                      : 'bg-red-500/80 hover:bg-red-500'
                  }`}
                  style={{ height: `${(bodyHeight / chartHeight) * 100}%` }}
                />

                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  <div>{formatPrice(candle.close)}</div>
                  <div className="text-gray-400 text-xs">
                    {new Date(candle.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-16 right-0 flex justify-between text-xs text-gray-500 px-4 pt-2">
          <div>{new Date(candles[0].timestamp).toLocaleTimeString()}</div>
          <div>{new Date(candles[Math.floor(candles.length / 2)].timestamp).toLocaleTimeString()}</div>
          <div>{new Date(candles[candles.length - 1].timestamp).toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="text-lg font-semibold text-white">
            {formatPrice(candles[candles.length - 1].close)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Period Change</p>
          <p
            className={`text-lg font-semibold ${
              candles[candles.length - 1].close >= candles[0].open
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {formatPercent(
              ((candles[candles.length - 1].close - candles[0].open) / candles[0].open) * 100
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function OrderBookComponent({ orderBook }: { orderBook: any }) {
  if (!orderBook) {
    return <div className="text-gray-500 text-sm">No order book data</div>;
  }

  const maxSize = Math.max(
    ...(orderBook.bids || []).map((b: any) => b[1]),
    ...(orderBook.asks || []).map((a: any) => a[1]),
    1
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-green-400 mb-2">BIDS</h4>
          <div className="space-y-1">
            {(orderBook.bids || []).map((bid: any, idx: number) => (
              <div key={idx} className="relative group">
                <div
                  className="absolute inset-y-0 left-0 bg-green-500/10 rounded transition-all"
                  style={{ width: `${(bid[1] / maxSize) * 100}%` }}
                />
                <div className="relative flex justify-between text-xs text-gray-300 px-2 py-1">
                  <span className="text-green-400">{formatPrice(bid[0])}</span>
                  <span className="text-gray-400">{Number(bid[1]).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-red-400 mb-2">ASKS</h4>
          <div className="space-y-1">
            {(orderBook.asks || []).map((ask: any, idx: number) => (
              <div key={idx} className="relative group">
                <div
                  className="absolute inset-y-0 left-0 bg-red-500/10 rounded transition-all"
                  style={{ width: `${(ask[1] / maxSize) * 100}%` }}
                />
                <div className="relative flex justify-between text-xs text-gray-300 px-2 py-1">
                  <span className="text-red-400">{formatPrice(ask[0])}</span>
                  <span className="text-gray-400">{Number(ask[1]).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500 mb-1">Spread</p>
        <p className="text-sm font-semibold text-yellow-400">{formatPrice(orderBook.spread || 0)}</p>
      </div>
    </div>
  );
}

function AIAnalysisPanel() {
  const { analysisResult, isAnalyzing } = useStore();

  return (
    <div className="space-y-4">
      <div className="w-full px-4 py-2 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg font-medium flex items-center justify-center gap-2">
        <Zap size={16} />
        {isAnalyzing ? 'Analyzing...' : 'AI analysis runs via auto-trader flow'}
      </div>

      {analysisResult ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Trend</p>
            <p className="text-sm font-semibold text-white capitalize">{analysisResult.trend}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Key Levels</p>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Support:</span>
                <span className="text-green-400">{formatPrice(analysisResult.keyLevels?.support?.[0] || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Resistance:</span>
                <span className="text-red-400">{formatPrice(analysisResult.keyLevels?.resistance?.[0] || 0)}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Recommendation</p>
            <p className="text-sm font-semibold capitalize text-blue-400">
              {analysisResult.recommendation}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              Analyzed: {formatTimestamp(analysisResult.timestamp)}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">No AI analysis yet</div>
      )}
    </div>
  );
}

function QuickTradePanel() {
  const { isAutoTrading, toggleAutoTrading } = useStore();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-xs text-gray-400">
        Manual trade entry still needs route/UI cleanup. Auto-trading toggle is the safer control for now.
      </div>

      <button
        disabled
        className="w-full py-2 px-4 bg-gray-800 text-gray-500 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Send size={16} />
        Manual Trade (disabled for now)
      </button>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Auto Trading</span>
          <button
            onClick={() => toggleAutoTrading(!isAutoTrading)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAutoTrading ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAutoTrading ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isAutoTrading ? 'Auto trading is enabled' : 'Auto trading is disabled'}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const store = useStore();
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const { isLoading, error } = useMarketData();

  useEffect(() => {
    store.loadSettings();
  }, []);

  useEffect(() => {
    store.setSelectedCoin(selectedCoin);
  }, [selectedCoin]);

  const chartCandles = store.candles.length > 0 ? store.candles : DEMO_CANDLES;
  const orderBook = store.orderBook || DEMO_ORDERBOOK;
  const unrealizedPnL = store.positions.reduce((sum, pos: any) => sum + Number(pos.pnl || pos.unrealizedPnL || 0), 0);
  const { value: pnlValue } = formatPnL(unrealizedPnL);
  const coins = ['BTC', 'ETH', 'SOL', 'DOGE', 'ARB', 'OP'];

  return (
    <DashboardLayout isConnected={!isLoading && !error}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
            Live data error: {error}. Falling back to demo data where needed.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Account Balance"
            value={formatUSD(store.accountBalance || 0)}
            icon={<Wallet size={20} className="text-blue-400" />}
          />

          <StatCard
            label="Unrealized PnL"
            value={pnlValue}
            trend={unrealizedPnL > 0 ? 'up' : unrealizedPnL < 0 ? 'down' : 'neutral'}
            changePercent={
              store.accountBalance > 0
                ? Number(((unrealizedPnL / store.accountBalance) * 100).toFixed(2))
                : 0
            }
            icon={<TrendingUp size={20} className="text-purple-400" />}
          />

          <StatCard
            label="Open Positions"
            value={store.positions.length}
            icon={<Activity size={20} className="text-cyan-400" />}
          />

          <StatCard
            label="Win Rate"
            value={formatPercent(store.learningProgress.winRate)}
            trend={store.learningProgress.winRate >= 50 ? 'up' : 'down'}
            icon={<Target size={20} className="text-green-400" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Price Chart">
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {coins.map((coin) => (
                    <button
                      key={coin}
                      onClick={() => setSelectedCoin(coin)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedCoin === coin
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>

                {isLoading && store.candles.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Loading chart...
                  </div>
                ) : (
                  <CandlestickChart candles={chartCandles} selectedCoin={selectedCoin} />
                )}
              </div>
            </Card>

            <Card title="Order Book">
              {isLoading && !store.orderBook ? (
                <div className="text-gray-500 text-sm">Loading order book...</div>
              ) : (
                <OrderBookComponent orderBook={orderBook} />
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="AI Analysis">
              <AIAnalysisPanel />
            </Card>

            <Card title="Active Signals">
              <div className="space-y-3">
                {store.compositeSignal && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Composite Signal</p>
                    <SignalBadge
                      signal={
                        store.compositeSignal.signal === 'STRONG_BUY'
                          ? 'BUY'
                          : store.compositeSignal.signal === 'STRONG_SELL'
                          ? 'SELL'
                          : store.compositeSignal.signal === 'BUY'
                          ? 'BUY'
                          : store.compositeSignal.signal === 'SELL'
                          ? 'SELL'
                          : 'HOLD'
                      }
                      strength={store.compositeSignal.strength}
                      size="lg"
                    />
                  </div>
                )}

                {store.signals && store.signals.length > 0 ? (
                  <div className="border-t border-gray-800 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Strategy Signals</p>
                    <div className="space-y-2">
                      {store.signals.slice(0, 3).map((signal, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">{signal.strategy}</span>
                          <SignalBadge
                            signal={signal.type === 'STRONG_BUY' ? 'BUY' : signal.type === 'STRONG_SELL' ? 'SELL' : signal.type as 'BUY' | 'SELL' | 'HOLD'}
                            strength={signal.confidence}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No signals yet</div>
                )}
              </div>
            </Card>

            <Card title="Quick Trade">
              <QuickTradePanel />
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
