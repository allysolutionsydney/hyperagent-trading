'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { formatPrice, formatUSD, formatTimestamp } from '@/utils/format';

interface OrderFormState {
  coin: string;
  orderType: 'market' | 'limit';
  direction: 'long' | 'short';
  size: number;
  price: number;
  leverage: number;
  stopLoss: number;
  stopLossEnabled: boolean;
  takeProfit: number;
  takeProfitEnabled: boolean;
}

export default function TradesPage() {
  const store = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    coin: store.selectedCoin || 'BTC',
    orderType: 'limit',
    direction: 'long',
    size: 0.01,
    price: store.candles[store.candles.length - 1]?.close || 0,
    leverage: 1,
    stopLoss: 0,
    stopLossEnabled: false,
    takeProfit: 0,
    takeProfitEnabled: false,
  });

  const currentPrice = store.candles[store.candles.length - 1]?.close || orderForm.price || 0;
  const positions = store.positions || [];
  const recentTrades = store.recentTrades || [];
  const openOrders = store.openOrders || [];
  const totalPnL = positions.reduce((acc: number, p: any) => acc + Number(p.pnl || p.unrealizedPnl || p.unrealizedPnL || 0), 0);

  const estimatedCost = orderForm.size * (orderForm.orderType === 'market' ? currentPrice : orderForm.price || currentPrice);
  const fees = estimatedCost * 0.0005;
  const totalCost = (estimatedCost + fees) / Math.max(orderForm.leverage, 1);
  const liquidationPrice =
    orderForm.direction === 'long'
      ? (orderForm.price || currentPrice) * 0.8
      : (orderForm.price || currentPrice) * 1.2;

  const setSizePercent = (percent: number) => {
    const maxSizeNotional = Math.max(store.riskSettings.maxPositionSize, 1);
    const basisPrice = orderForm.orderType === 'market' ? currentPrice : orderForm.price || currentPrice || 1;
    setOrderForm((prev) => ({
      ...prev,
      size: Number(((maxSizeNotional * percent) / 100 / basisPrice).toFixed(6)),
    }));
  };

  const handlePlaceOrder = async () => {
    if (!store.apiKeys.hyperliquidPrivateKey || !store.apiKeys.hyperliquidWallet) {
      setMessage('Hyperliquid credentials are missing. Add them in Settings first.');
      return;
    }

    const executionPrice = orderForm.orderType === 'market' ? currentPrice : orderForm.price;
    if (!executionPrice || !orderForm.size) {
      setMessage('Order price and size must be valid before submitting.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place',
          wallet: store.apiKeys.hyperliquidWallet,
          privateKey: store.apiKeys.hyperliquidPrivateKey,
          isTestnet: store.isTestnet,
          riskConfig: {
            maxPositionSize: store.riskSettings.maxPositionSize,
            maxLeverage: orderForm.leverage,
            stopLossRequired: orderForm.stopLossEnabled,
          },
          coin: orderForm.coin,
          isBuy: orderForm.direction === 'long',
          size: orderForm.size,
          price: executionPrice,
          orderType: orderForm.orderType === 'market' ? 'Limit' : 'Limit',
          reduceOnly: false,
          stopLoss: orderForm.stopLossEnabled ? orderForm.stopLoss : undefined,
          leverage: orderForm.leverage,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Order placement failed');
      }

      setMessage('Order submitted to /api/trades successfully. Review exchange response in logs/account state.');
      store.addTrade({
        id: `${Date.now()}`,
        coin: orderForm.coin,
        direction: orderForm.direction === 'long' ? 'LONG' : 'SHORT',
        entryPrice: executionPrice,
        stopLoss: orderForm.stopLossEnabled ? orderForm.stopLoss : 0,
        takeProfits: orderForm.takeProfitEnabled ? [orderForm.takeProfit] : [],
        size: orderForm.size,
        leverage: orderForm.leverage,
        thesis: 'Manual order from Trades page',
        strategySignals: [],
        status: 'open',
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Order placement failed:', err);
      setMessage(err instanceof Error ? err.message : 'Order placement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportTrades = () => {
    const data = JSON.stringify(recentTrades, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', `trade-history-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Trade Management</h1>
          <p className="text-gray-400 mt-1">Real store-backed trades and honest order controls</p>
          {message && <p className="text-sm text-blue-300 mt-2">{message}</p>}
        </div>

        {!store.apiKeys.hyperliquidPrivateKey || !store.apiKeys.hyperliquidWallet ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>Hyperliquid credentials are not configured, so trade submission is disabled until Settings are completed.</span>
          </div>
        ) : (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-300 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5" />
            <span>Credentials present. Trades page can submit to the real `/api/trades` route.</span>
          </div>
        )}

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Active Positions</h2>
            </div>

            {positions.length === 0 ? (
              <div className="text-sm text-gray-400">No live positions loaded into store yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Coin</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Direction</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Size</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Entry</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos: any, idx: number) => {
                      const pnl = Number(pos.pnl || pos.unrealizedPnl || pos.unrealizedPnL || 0);
                      const direction = pos.direction || (Number(pos.szi || 0) >= 0 ? 'Long' : 'Short');
                      const size = pos.size || pos.szi || 0;
                      const entry = pos.entryPrice || pos.entryPx || pos.entry || 0;
                      const coin = pos.coin || pos.asset || `Position ${idx + 1}`;

                      return (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-4 text-white font-semibold">{coin}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                              String(direction).toLowerCase().includes('long')
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {String(direction).toLowerCase().includes('long') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                              {direction}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white">{Number(size).toFixed(4)}</td>
                          <td className="py-3 px-4 text-right text-white">{entry ? formatPrice(Number(entry)) : '—'}</td>
                          <td className={`py-3 px-4 text-right font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatUSD(pnl)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-700 flex justify-end">
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-1">Total PnL</p>
                <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(totalPnL)}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6">New Order</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Coin</label>
                    <select
                      value={orderForm.coin}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, coin: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      {['BTC', 'ETH', 'SOL', 'DOGE', 'ARB', 'OP'].map((coin) => (
                        <option key={coin}>{coin}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['market', 'limit'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setOrderForm((prev) => ({ ...prev, orderType: type }))}
                          className={`py-2 rounded-lg font-medium transition-colors ${
                            orderForm.orderType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderForm((prev) => ({ ...prev, direction: 'long' }))}
                        className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          orderForm.direction === 'long'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-green-500'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" /> Long
                      </button>
                      <button
                        onClick={() => setOrderForm((prev) => ({ ...prev, direction: 'short' }))}
                        className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          orderForm.direction === 'short'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-red-500'
                        }`}
                      >
                        <ArrowDownLeft className="w-4 h-4" /> Short
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                    <input
                      type="number"
                      value={orderForm.size}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, size: parseFloat(e.target.value || '0') }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none mb-2"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <button
                          key={percent}
                          onClick={() => setSizePercent(percent)}
                          className="py-1 px-2 bg-gray-800 border border-gray-700 hover:border-blue-500 rounded text-xs text-gray-300 hover:text-white transition-colors"
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {orderForm.orderType !== 'market' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                      <input
                        type="number"
                        value={orderForm.price}
                        onChange={(e) => setOrderForm((prev) => ({ ...prev, price: parseFloat(e.target.value || '0') }))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">Leverage</label>
                      <span className="text-sm font-semibold text-blue-400">{orderForm.leverage}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={orderForm.leverage}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, leverage: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={orderForm.stopLossEnabled} onChange={(e) => setOrderForm((prev) => ({ ...prev, stopLossEnabled: e.target.checked }))} className="w-4 h-4 accent-red-600" />
                        <label className="text-sm font-medium text-gray-300">Stop Loss</label>
                      </div>
                      <input
                        type="number"
                        disabled={!orderForm.stopLossEnabled}
                        value={orderForm.stopLoss}
                        onChange={(e) => setOrderForm((prev) => ({ ...prev, stopLoss: parseFloat(e.target.value || '0') }))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={orderForm.takeProfitEnabled} onChange={(e) => setOrderForm((prev) => ({ ...prev, takeProfitEnabled: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                        <label className="text-sm font-medium text-gray-300">Take Profit</label>
                      </div>
                      <input
                        type="number"
                        disabled={!orderForm.takeProfitEnabled}
                        value={orderForm.takeProfit}
                        onChange={(e) => setOrderForm((prev) => ({ ...prev, takeProfit: parseFloat(e.target.value || '0') }))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Estimated Cost</span><span className="text-white font-medium">{formatUSD(estimatedCost)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Fees</span><span className="text-white font-medium">{formatUSD(fees)}</span></div>
                    <div className="border-t border-gray-700 pt-2 flex justify-between"><span className="text-gray-300 font-medium">Total Cost</span><span className="text-blue-400 font-semibold">{formatUSD(totalCost)}</span></div>
                    <div className="flex justify-between pt-2"><span className="text-gray-400">Liquidation Price</span><span className="text-yellow-400 font-medium">{formatPrice(liquidationPrice)}</span></div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !store.apiKeys.hyperliquidPrivateKey || !store.apiKeys.hyperliquidWallet}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Current Price</h3>
                <div>
                  <p className="text-3xl font-bold text-white">{currentPrice ? formatPrice(currentPrice) : '—'}</p>
                  <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Store-driven market context
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Available Balance</p>
                  <p className="text-white font-semibold">{formatUSD(store.accountBalance || 0)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Risk Max Position</p>
                  <p className="text-blue-400 font-semibold">{formatUSD(store.riskSettings.maxPositionSize)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Open Orders</p>
                  <p className="text-white font-semibold">{openOrders.length}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Recent Trades</p>
                  <p className="text-green-400 font-semibold">{recentTrades.length}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Open Orders</h2>
            </div>

            {openOrders.length === 0 ? (
              <div className="text-sm text-gray-400">No open orders stored yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Coin</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Size</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((order: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-white font-semibold">{order.coin || '—'}</td>
                        <td className="py-3 px-4 text-gray-300">{order.type || order.orderType || '—'}</td>
                        <td className="py-3 px-4 text-right text-white">{order.size || '—'}</td>
                        <td className="py-3 px-4 text-right text-white">{order.price ? formatPrice(order.price) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Trade History</h2>
              <button onClick={exportTrades} className="px-4 py-2 flex items-center gap-2 border border-gray-700 hover:border-blue-500 text-gray-300 hover:text-white rounded text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>

            {recentTrades.length === 0 ? (
              <div className="text-sm text-gray-400">No recent trades stored yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Coin</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Direction</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Size</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Entry</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade: any, idx: number) => (
                      <tr key={trade.id || idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-white">{trade.timestamp ? formatTimestamp(trade.timestamp, true) : '—'}</td>
                        <td className="py-3 px-4 text-white font-semibold">{trade.coin}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${String(trade.direction).toUpperCase().includes('LONG') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white">{trade.size}</td>
                        <td className="py-3 px-4 text-right text-white">{trade.entryPrice ? formatPrice(trade.entryPrice) : '—'}</td>
                        <td className="py-3 px-4 text-gray-400">{trade.status || 'open'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
