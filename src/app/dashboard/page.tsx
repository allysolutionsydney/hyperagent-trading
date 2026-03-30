'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Wallet,
  Activity,
  Bot,
  Send,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import SignalBadge from '@/components/SignalBadge';
import StatusBadge from '@/components/StatusBadge';
import { useStore } from '@/hooks/useStore';
import {
  formatPrice,
  formatUSD,
  formatPercent,
  formatPnL,
  formatChange,
  formatTimestamp,
} from '@/utils/format';
import { Candle } from '@/types';

// Sample demo data for fallback
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

const DEMO_POSITIONS = [
  {
    id: '1',
    symbol: 'BTC',
    side: 'long',
    size: 0.5,
    entryPrice: 62100,
    currentPrice: 64300,
    pnl: 1100,
    pnlPercent: 1.77,
  },
  {
    id: '2',
    symbol: 'ETH',
    side: 'long',
    size: 5,
    entryPrice: 3200,
    currentPrice: 3450,
    pnl: 1250,
    pnlPercent: 7.81,
  },
];

const DEMO_RECENT_TRADES = [
  {
    id: 'trade_1',
    timestamp: Date.now() - 300000,
    symbol: 'BTC',
    side: 'buy',
    price: 62100,
    size: 0.5,
    pnl: 1100,
    pnlPercent: 1.77,
  },
  {
    id: 'trade_2',
    timestamp: Date.now() - 600000,
    symbol: 'ETH',
    side: 'buy',
    price: 3200,
    size: 5,
    pnl: 1250,
    pnlPercent: 7.81,
  },
  {
    id: 'trade_3',
    timestamp: Date.now() - 900000,
    symbol: 'SOL',
    side: 'sell',
    price: 125,
    size: 10,
    pnl: -150,
    pnlPercent: -1.2,
  },
  {
    id: 'trade_4',
    timestamp: Date.now() - 1200000,
    symbol: 'DOGE',
    side: 'buy',
    price: 0.45,
    size: 1000,
    pnl: 450,
    pnlPercent: 2.22,
  },
  {
    id: 'trade_5',
    timestamp: Date.now() - 1500000,
    symbol: 'BTC',
    side: 'sell',
    price: 61800,
    size: 0.25,
    pnl: 300,
    pnlPercent: 0.48,
  },
];

// Candlestick Chart Component (CSS-based)
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
  const priceRange = maxPrice - minPrice;

  const chartHeight = 250;
  const chartWidth = 100;
  const candleWidth = chartWidth / candles.length - 1;

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
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4 text-xs text-gray-500 w-16">
          <div>{formatPrice(maxPrice)}</div>
          <div>{formatPrice((maxPrice + minPrice) / 2)}</div>
          <div>{formatPrice(minPrice)}</div>
        </div>

        {/* Chart area */}
        <div className="ml-16 h-full flex items-end justify-between gap-1">
          {candles.map((candle, idx) => {
            const highY = ((maxPrice - candle.high) / priceRange) * chartHeight;
            const lowY = ((maxPrice - candle.low) / priceRange) * chartHeight;
            const openY = ((maxPrice - candle.open) / priceRange) * chartHeight;
            const closeY = ((maxPrice - candle.close) / priceRange) * chartHeight;

            const wickHeight = lowY - highY;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;
            const isGreen = candle.close >= candle.open;

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-end flex-1 h-full group relative"
              >
                {/* Wick */}
                <div
                  className={`w-0.5 ${isGreen ? 'bg-green-500/40' : 'bg-red-500/40'}`}
                  style={{ height: `${(wickHeight / chartHeight) * 100}%` }}
                />

                {/* Body */}
                <div
                  className={`w-full rounded-sm transition-all ${
                    isGreen
                      ? 'bg-green-500/80 hover:bg-green-500'
                      : 'bg-red-500/80 hover:bg-red-500'
                  }`}
                  style={{ height: `${(bodyHeight / chartHeight) * 100}%` }}
                />

                {/* Tooltip */}
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

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-16 right-0 flex justify-between text-xs text-gray-500 px-4 pt-2">
          <div>{new Date(candles[0].timestamp).toLocaleTimeString()}</div>
          <div>{new Date(candles[Math.floor(candles.length / 2)].timestamp).toLocaleTimeString()}</div>
          <div>{new Date(candles[candles.length - 1].timestamp).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Current price and 24h change */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="text-lg font-semibold text-white">
            {formatPrice(candles[candles.length - 1].close)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">24h Change</p>
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

// Order Book Component
function OrderBookComponent({ orderBook }: { orderBook: any }) {
  if (!orderBook) {
    return <div className="text-gray-500 text-sm">No order book data</div>;
  }

  const maxSize = Math.max(
    ...orderBook.bids.map((b: any) => b[1]),
    ...orderBook.asks.map((a: any) => a[1])
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div>
          <h4 className="text-xs font-semibold text-green-400 mb-2">BIDS</h4>
          <div className="space-y-1">
            {orderBook.bids.map((bid: any, idx: number) => (
              <div key={idx} className="relative group">
                <div
                  className="absolute inset-y-0 left-0 bg-green-500/10 rounded transition-all"
                  style={{ width: `${(bid[1] / maxSize) * 100}%` }}
                />
                <div className="relative flex justify-between text-xs text-gray-300 px-2 py-1">
                  <span className="text-green-400">{formatPrice(bid[0])}</span>
                  <span className="text-gray-400">{bid[1].toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <h4 className="text-xs font-semibold text-red-400 mb-2">ASKS</h4>
          <div className="space-y-1">
            {orderBook.asks.map((ask: any, idx: number) => (
              <div key={idx} className="relative group">
                <div
                  className="absolute inset-y-0 left-0 bg-red-500/10 rounded transition-all"
                  style={{ width: `${(ask[1] / maxSize) * 100}%` }}
                />
                <div className="relative flex justify-between text-xs text-gray-300 px-2 py-1">
                  <span className="text-red-400">{formatPrice(ask[0])}</span>
                  <span className="text-gray-400">{ask[1].toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spread */}
      <div className="border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500 mb-1">Spread</p>
        <p className="text-sm font-semibold text-yellow-400">{formatPrice(orderBook.spread)}</p>
      </div>
    </div>
  );
}

// AI Analysis Panel
function AIAnalysisPanel() {
  const { analysisResult, isAnalyzing, setAnalyzing, setAnalysis } = useStore();
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalyzing(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Zap size={16} />
        {loading ? 'Analyzing...' : 'Analyze Market'}
      </button>

      {loading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-800 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
          </div>
          <p className="text-xs text-gray-500">Processing market data...</p>
        </div>
      )}

      {analysisResult && !loading && (
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
                <span className="text-green-400">{formatPrice(analysisResult.support)}</span>
              </div>
              <div className="flex justify-between">
                <span>Resistance:</span>
                <span className="text-red-400">{formatPrice(analysisResult.resistance)}</span>
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
      )}
    </div>
  );
}

// Quick Trade Panel
function QuickTradePanel() {
  const { isAutoTrading, toggleAutoTrading } = useStore();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [isMarket, setIsMarket] = useState(true);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    if (!size) {
      alert('Please enter a size');
      return;
    }

    setExecuting(true);
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          size: parseFloat(size),
          price: isMarket ? undefined : parseFloat(price),
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        }),
      });

      if (response.ok) {
        setSize('');
        setPrice('');
        setStopLoss('');
        setTakeProfit('');
      }
    } catch (error) {
      console.error('Trade execution error:', error);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('buy')}
          className={`py-2 px-3 rounded-lg font-medium transition-colors ${
            side === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-2 px-3 rounded-lg font-medium transition-colors ${
            side === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          SELL
        </button>
      </div>

      {/* Size Input */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Size</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Market/Limit Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMarket(!isMarket)}
          className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
            isMarket
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Market
        </button>
        <button
          onClick={() => setIsMarket(!isMarket)}
          className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
            !isMarket
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Limit
        </button>
      </div>

      {/* Price Input (Limit only) */}
      {!isMarket && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Stop Loss */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Stop Loss</label>
        <input
          type="number"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          placeholder="Optional"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Take Profit */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Take Profit</label>
        <input
          type="number"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          placeholder="Optional"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Execute Trade Button */}
      <button
        onClick={handleExecute}
        disabled={executing || !size}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
      >
        <Send size={16} />
        {executing ? 'Executing...' : 'Execute Trade'}
      </button>

      {/* Auto-Trading Toggle */}
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

// Main Dashboard Page
export default function DashboardPage() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState('BTC');

  // Initialize store and fetch data
  useEffect(() => {
    const initializeData = async () => {
      try {
        store.loadSettings();

        // Fetch market data
        const response = await fetch('/api/market', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: selectedCoin }),
        });

        if (response.ok) {
          const data = await response.json();
          store.setCandles(data.candles || DEMO_CANDLES);
          store.setOrderBook(data.orderBook || DEMO_ORDERBOOK);
          store.setAccountBalance(data.accountBalance || 50000);
          store.setPositions(data.positions || DEMO_POSITIONS);
        } else {
          // Use demo data as fallback
          store.setCandles(DEMO_CANDLES);
          store.setOrderBook(DEMO_ORDERBOOK);
          store.setAccountBalance(50000);
          store.setPositions(DEMO_POSITIONS);
        }

        // Set learning progress
        store.setLearningProgress({
          totalTrades: 42,
          winRate: 65.5,
          profitFactor: 2.15,
          confidence: 0.78,
        });
      } catch (error) {
        console.error('Initialization error:', error);
        // Fallback to demo data
        store.setCandles(DEMO_CANDLES);
        store.setOrderBook(DEMO_ORDERBOOK);
        store.setAccountBalance(50000);
        store.setPositions(DEMO_POSITIONS);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [selectedCoin]);

  const unrealizedPnL = store.positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const { value: pnlValue, className: pnlClassName } = formatPnL(unrealizedPnL);

  const coins = ['BTC', 'ETH', 'SOL', 'DOGE', 'ARB', 'OP'];

  return (
    <DashboardLayout isConnected={!loading}>
      <div className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Account Balance"
            value={formatUSD(store.accountBalance)}
            icon={<Wallet size={20} className="text-blue-400" />}
          />

          <StatCard
            label="Unrealized PnL"
            value={pnlValue}
            trend={unrealizedPnL > 0 ? 'up' : unrealizedPnL < 0 ? 'down' : 'neutral'}
            changePercent={
              store.accountBalance > 0
                ? ((unrealizedPnL / store.accountBalance) * 100).toFixed(2) as any
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (wider) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <Card title="Price Chart">
              <div className="space-y-4">
                {/* Coin Selector */}
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

                {/* Chart */}
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="animate-spin">Loading chart...</div>
                  </div>
                ) : (
                  <CandlestickChart candles={store.candles || DEMO_CANDLES} selectedCoin={selectedCoin} />
                )}
              </div>
            </Card>

            {/* Order Book */}
            <Card title="Order Book">
              {loading ? (
                <div className="text-gray-500 text-sm">Loading order book...</div>
              ) : (
                <OrderBookComponent orderBook={store.orderBook || DEMO_ORDERBOOK} />
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <Card title="AI Analysis">
              <AIAnalysisPanel />
            </Card>

            {/* Active Signals */}
            <Card title="Active Signals">
              <div className="space-y-3">
                {store.compositeSignal && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Composite Signal</p>
                    <SignalBadge
                      signal={store.compositeSignal.signal === 'STRONG_BUY' ? 'BUY' : store.compositeSignal.signal === 'STRONG_SELL' ? 'SELL' : 'HOLD'}
                      strength={store.compositeSignal.strength}
                      size="lg"
                    />
                  </div>
                )}

                {store.signals && store.signals.length > 0 && (
                  <div className="border-t border-gray-800 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Strategy Signals</p>
                    <div className="space-y-2">
                      {store.signals.slice(0, 3).map((signal, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">{signal.strategy}</span>
                          <SignalBadge
                            signal={signal.signal as 'BUY' | 'SELL' | 'HOLD'}
                            strength={signal.strength}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!store.signals || store.signals.length === 0) && (
                  <div className="text-xs text-gray-500">No signals yet</div>
                )}
              </div>
            </Card>

            {/* Quick Trade */}
            <Card title="Quick Trade">
              <QuickTradePanel />
            </Card>

            {/* Open Positions */}
            <Card title="Open Positions">
              <div className="space-y-2">
                {store.positions.length === 0 ? (
                  <p className="text-xs text-gray-500">No open positions</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-b border-gray-800">
                        <tr>
                          <th className="text-left py-2 px-2 text-gray-500">Coin</th>
                          <th className="text-left py-2 px-2 text-gray-500">Side</th>
                          <th className="text-right py-2 px-2 text-gray-500">Size</th>
                          <th className="text-right py-2 px-2 text-gray-500">Entry</th>
                          <th className="text-right py-2 px-2 text-gray-500">Current</th>
                          <th className="text-right py-2 px-2 text-gray-500">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {store.positions.map((pos) => {
                          const pnlInfo = formatPnL(pos.pnl || 0);
                          return (
                            <tr key={pos.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                              <td className="py-2 px-2 text-white font-medium">{pos.symbol}</td>
                              <td className="py-2 px-2">
                                <span
                                  className={
                                    pos.side === 'long'
                                      ? 'text-green-400 text-xs'
                                      : 'text-red-400 text-xs'
                                  }
                                >
                                  {pos.side.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right text-gray-400">
                                {typeof pos.size === 'number' ? pos.size.toFixed(2) : pos.size}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-400">
                                {formatPrice(pos.entryPrice || 0)}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-400">
                                {formatPrice(pos.currentPrice || 0)}
                              </td>
                              <td className={`py-2 px-2 text-right font-medium ${pnlInfo.className}`}>
                                {pnlInfo.value}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Trades */}
        <Card title="Recent Trades">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="text-left py-2 px-3 text-gray-500">Time</th>
                  <th className="text-left py-2 px-3 text-gray-500">Symbol</th>
                  <th className="text-left py-2 px-3 text-gray-500">Side</th>
                  <th className="text-right py-2 px-3 text-gray-500">Price</th>
                  <th className="text-right py-2 px-3 text-gray-500">Size</th>
                  <th className="text-right py-2 px-3 text-gray-500">PnL</th>
                </tr>
              </thead>
              <tbody>
                {(store.recentTrades.length > 0
                  ? store.recentTrades.slice(0, 10)
                  : DEMO_RECENT_TRADES
                ).map((trade) => {
                  const pnlInfo = formatPnL(trade.pnl || 0);
                  return (
                    <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-3 text-gray-400">
                        {formatTimestamp(trade.timestamp, true)}
                      </td>
                      <td className="py-2 px-3 text-white font-medium">{trade.symbol}</td>
                      <td className="py-2 px-3">
                        <span
                          className={
                            trade.side === 'buy'
                              ? 'text-green-400 font-medium'
                              : 'text-red-400 font-medium'
                          }
                        >
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-400">
                        {formatPrice(trade.price || 0)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-400">
                        {typeof trade.size === 'number' ? trade.size.toFixed(2) : trade.size}
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${pnlInfo.className}`}>
                        {pnlInfo.value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
