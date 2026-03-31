'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import {
  Plus,
  Minus,
  X,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { useState } from 'react';

const ACTIVE_POSITIONS = [
  {
    id: '1',
    coin: 'BTC',
    direction: 'Long',
    size: 0.5,
    entryPrice: 45230,
    markPrice: 46850,
    pnl: 810,
    pnlPercent: 3.57,
    margin: 4623,
    liquidationPrice: 38420,
  },
  {
    id: '2',
    coin: 'ETH',
    direction: 'Long',
    size: 5.0,
    entryPrice: 2450,
    markPrice: 2580,
    pnl: 650,
    pnlPercent: 5.31,
    margin: 2450,
    liquidationPrice: 1960,
  },
  {
    id: '3',
    coin: 'SOL',
    direction: 'Short',
    size: 20.0,
    entryPrice: 145,
    markPrice: 142.5,
    pnl: 50,
    pnlPercent: 1.72,
    margin: 1450,
    liquidationPrice: 165,
  },
];

const OPEN_ORDERS = [
  {
    id: '1',
    coin: 'BTC',
    type: 'Limit',
    side: 'Buy',
    size: 0.25,
    price: 45000,
    status: 'Pending',
    created: '2 mins ago',
  },
  {
    id: '2',
    coin: 'ETH',
    type: 'Limit',
    side: 'Sell',
    size: 2.0,
    price: 2750,
    status: 'Pending',
    created: '15 mins ago',
  },
];

const TRADE_HISTORY = [
  {
    id: '1',
    date: '2024-03-28 14:32',
    coin: 'BTC',
    side: 'Buy',
    size: 0.5,
    entry: 45230,
    exit: 46850,
    pnl: 810,
    strategy: 'MACD Crossover',
  },
  {
    id: '2',
    date: '2024-03-27 11:15',
    coin: 'ETH',
    side: 'Sell',
    size: 3.0,
    entry: 2600,
    exit: 2450,
    pnl: 450,
    strategy: 'RSI Divergence',
  },
];

interface OrderFormState {
  coin: string;
  orderType: 'market' | 'limit' | 'stop-limit';
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
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    coin: 'BTC',
    orderType: 'market',
    direction: 'long',
    size: 0.1,
    price: 46850,
    leverage: 2,
    stopLoss: 0,
    stopLossEnabled: false,
    takeProfit: 0,
    takeProfitEnabled: false,
  });

  const totalPnL = ACTIVE_POSITIONS.reduce((acc, p) => acc + p.pnl, 0);

  const estimatedCost = orderForm.size * orderForm.price;
  const fees = estimatedCost * 0.0005;
  const totalCost = (estimatedCost + fees) / orderForm.leverage;
  const liquidationPrice =
    orderForm.direction === 'long'
      ? orderForm.price * 0.8
      : orderForm.price * 1.2;

  const setSizePercent = (percent: number) => {
    const maxSize = 10; // Mock max position size
    setOrderForm((prev) => ({
      ...prev,
      size: (maxSize * percent) / 100,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Trade Management</h1>
          <p className="text-gray-400 mt-1">Manage positions, place orders, and track trades</p>
        </div>

        {/* Active Positions Section */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Active Positions</h2>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors">
                Close All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Coin
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Direction
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Size
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Entry Price
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Mark Price
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      PnL ($)
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      PnL (%)
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Margin
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Liq. Price
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVE_POSITIONS.map((pos) => (
                    <tr
                      key={pos.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-semibold">{pos.coin}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                            pos.direction === 'Long'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {pos.direction === 'Long' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {pos.direction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {pos.size.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${pos.entryPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${pos.markPrice.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pos.pnl >= 0 ? '+' : ''} ${pos.pnl.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        pos.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${pos.margin.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-yellow-400">
                        ${pos.liquidationPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Close Position">
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Add to Position">
                            <Plus className="w-4 h-4 text-green-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Reduce Position">
                            <Minus className="w-4 h-4 text-yellow-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PnL Summary */}
            <div className="mt-6 pt-6 border-t border-gray-700 flex justify-end">
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-1">Total PnL</p>
                <p className={`text-3xl font-bold ${
                  totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6">New Order</h2>

                <div className="space-y-6">
                  {/* Coin Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Coin
                    </label>
                    <select
                      value={orderForm.coin}
                      onChange={(e) =>
                        setOrderForm((prev) => ({ ...prev, coin: e.target.value }))
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option>BTC</option>
                      <option>ETH</option>
                      <option>SOL</option>
                      <option>ARB</option>
                    </select>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Order Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['market', 'limit', 'stop-limit'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setOrderForm((prev) => ({ ...prev, orderType: type }))
                          }
                          className={`py-2 rounded-lg font-medium transition-colors ${
                            orderForm.orderType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() +
                            type
                              .slice(1)
                              .replace('-', ' ')
                              .toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Direction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setOrderForm((prev) => ({ ...prev, direction: 'long' }))
                        }
                        className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          orderForm.direction === 'long'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-green-500'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Long
                      </button>
                      <button
                        onClick={() =>
                          setOrderForm((prev) => ({ ...prev, direction: 'short' }))
                        }
                        className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          orderForm.direction === 'short'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-red-500'
                        }`}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        Short
                      </button>
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Size
                    </label>
                    <input
                      type="number"
                      value={orderForm.size}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          size: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none mb-2"
                      placeholder="0.0"
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

                  {/* Price (for limit orders) */}
                  {orderForm.orderType !== 'market' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price
                      </label>
                      <input
                        type="number"
                        value={orderForm.price}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            price: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        placeholder="0.0"
                      />
                    </div>
                  )}

                  {/* Leverage */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        Leverage
                      </label>
                      <span className="text-sm font-semibold text-blue-400">
                        {orderForm.leverage}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={orderForm.leverage}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          leverage: parseInt(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Stop Loss & Take Profit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={orderForm.stopLossEnabled}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              stopLossEnabled: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-red-600"
                        />
                        <label className="text-sm font-medium text-gray-300">
                          Stop Loss
                        </label>
                      </div>
                      <input
                        type="number"
                        disabled={!orderForm.stopLossEnabled}
                        value={orderForm.stopLoss}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            stopLoss: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none disabled:opacity-50"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={orderForm.takeProfitEnabled}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              takeProfitEnabled: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-green-600"
                        />
                        <label className="text-sm font-medium text-gray-300">
                          Take Profit
                        </label>
                      </div>
                      <input
                        type="number"
                        disabled={!orderForm.takeProfitEnabled}
                        value={orderForm.takeProfit}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            takeProfit: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none disabled:opacity-50"
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {/* Order Preview */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Cost</span>
                      <span className="text-white font-medium">
                        ${estimatedCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fees</span>
                      <span className="text-white font-medium">
                        ${fees.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 flex justify-between">
                      <span className="text-gray-300 font-medium">Total Cost</span>
                      <span className="text-blue-400 font-semibold">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-400">Liquidation Price</span>
                      <span className="text-yellow-400 font-medium">
                        ${liquidationPrice.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                    Place Order
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Market Info & Quick Stats */}
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Current Price
                </h3>
                <div>
                  <p className="text-3xl font-bold text-white">$46,850</p>
                  <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +2.34% (24h)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">24h Volume</p>
                  <p className="text-white font-semibold">$28.5B</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Funding Rate</p>
                  <p className="text-blue-400 font-semibold">+0.0156%</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Open Interest</p>
                  <p className="text-white font-semibold">$12.4B</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Available Balance</p>
                  <p className="text-green-400 font-semibold">$50,000</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Open Orders */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Open Orders</h2>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors">
                Cancel All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Coin
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Side
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Size
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Created
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OPEN_ORDERS.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-semibold">{order.coin}</td>
                      <td className="py-3 px-4 text-gray-300">{order.type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            order.side === 'Buy'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {order.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {order.size}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${order.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{order.created}</td>
                      <td className="py-3 px-4 text-center">
                        <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Trade History */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Trade History</h2>
              <button className="px-4 py-2 flex items-center gap-2 border border-gray-700 hover:border-blue-500 text-gray-300 hover:text-white rounded text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Coin
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Side
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Size
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Entry
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Exit
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      PnL
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Strategy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TRADE_HISTORY.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white">{trade.date}</td>
                      <td className="py-3 px-4 text-white font-semibold">{trade.coin}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.side === 'Buy'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {trade.size}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${trade.entry.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${trade.exit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-400">
                        +${trade.pnl.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-400">{trade.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <button className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-300">
                Previous
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                1
              </button>
              <button className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-300">
                2
              </button>
              <button className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-300">
                Next
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}