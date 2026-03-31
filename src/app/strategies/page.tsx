'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap,
  Brain,
  ToggleRight,
  ToggleLeft,
  Settings,
  Play,
  ChevronDown,
  ChevronUp,
  Gauge,
  Award,
} from 'lucide-react';
import { useState } from 'react';

const STRATEGIES = [
  {
    id: 'rsi',
    name: 'RSI Divergence',
    icon: Gauge,
    enabled: true,
    signal: 'BUY',
    strength: 75,
    winRate: 62,
    totalSignals: 247,
    profitFactor: 1.85,
    weight: 15,
  },
  {
    id: 'macd',
    name: 'MACD Crossover',
    icon: Activity,
    enabled: true,
    signal: 'HOLD',
    strength: 45,
    winRate: 58,
    totalSignals: 189,
    profitFactor: 1.65,
    weight: 15,
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands',
    icon: BarChart3,
    enabled: true,
    signal: 'SELL',
    strength: 60,
    winRate: 55,
    totalSignals: 156,
    profitFactor: 1.42,
    weight: 12,
  },
  {
    id: 'ma',
    name: 'MA Crossover',
    icon: TrendingUp,
    enabled: true,
    signal: 'BUY',
    strength: 70,
    winRate: 61,
    totalSignals: 203,
    profitFactor: 1.72,
    weight: 18,
  },
  {
    id: 'volume',
    name: 'Volume Analysis',
    icon: Zap,
    enabled: true,
    signal: 'HOLD',
    strength: 52,
    winRate: 57,
    totalSignals: 178,
    profitFactor: 1.58,
    weight: 10,
  },
  {
    id: 'ai',
    name: 'AI Sentiment',
    icon: Brain,
    enabled: true,
    signal: 'BUY',
    strength: 82,
    winRate: 67,
    totalSignals: 134,
    profitFactor: 2.15,
    weight: 30,
  },
];

const PRESETS = [
  { name: 'Conservative', description: 'Lower risk, stable returns' },
  { name: 'Balanced', description: 'Moderate risk/reward balance' },
  { name: 'Aggressive', description: 'High risk, maximum returns' },
];

interface StrategyState {
  [key: string]: {
    enabled: boolean;
    weight: number;
    expanded: boolean;
  };
}

export default function StrategiesPage() {
  const store = useStore();
  const [strategies, setStrategies] = useState<StrategyState>(
    STRATEGIES.reduce(
      (acc, s) => ({
        ...acc,
        [s.id]: { enabled: s.enabled, weight: s.weight, expanded: false },
      }),
      {}
    )
  );

  const compositeSignal = calculateCompositeSignal();

  function calculateCompositeSignal() {
    const buyWeight = STRATEGIES.reduce((acc, s) => {
      if (strategies[s.id].enabled && s.signal === 'BUY') {
        return acc + strategies[s.id].weight;
      }
      return acc;
    }, 0);

    const sellWeight = STRATEGIES.reduce((acc, s) => {
      if (strategies[s.id].enabled && s.signal === 'SELL') {
        return acc + strategies[s.id].weight;
      }
      return acc;
    }, 0);

    const totalWeight = STRATEGIES.reduce(
      (acc, s) => (strategies[s.id].enabled ? acc + strategies[s.id].weight : acc),
      0
    );

    if (buyWeight > sellWeight && buyWeight > totalWeight * 0.4) {
      return { signal: 'BUY', strength: (buyWeight / totalWeight) * 100 };
    } else if (sellWeight > buyWeight && sellWeight > totalWeight * 0.4) {
      return { signal: 'SELL', strength: (sellWeight / totalWeight) * 100 };
    }
    return { signal: 'HOLD', strength: 50 };
  }

  const toggleStrategy = (id: string) => {
    setStrategies((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const toggleExpanded = (id: string) => {
    setStrategies((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  };

  const updateWeight = (id: string, weight: number) => {
    setStrategies((prev) => ({
      ...prev,
      [id]: { ...prev[id], weight: Math.min(100, Math.max(0, weight)) },
    }));
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-400';
      case 'SELL':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getSignalBg = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-500/20';
      case 'SELL':
        return 'bg-red-500/20';
      default:
        return 'bg-yellow-500/20';
    }
  };

  const compositeColor =
    compositeSignal.signal === 'BUY'
      ? 'text-green-400'
      : compositeSignal.signal === 'SELL'
        ? 'text-red-400'
        : 'text-yellow-400';

  const compositeBg =
    compositeSignal.signal === 'BUY'
      ? 'bg-green-500/20'
      : compositeSignal.signal === 'SELL'
        ? 'bg-red-500/20'
        : 'bg-yellow-500/20';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Strategy Management</h1>
            <p className="text-gray-400 mt-1">Configure and monitor trading strategies</p>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Play className="w-4 h-4" />
            Run All Strategies
          </button>
        </div>

        {/* Composite Signal Card */}
        <Card className="border-2 border-blue-500/30">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Composite Signal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className={`text-5xl font-bold ${compositeColor} mb-2`}>
                  {compositeSignal.signal}
                </div>
                <p className="text-gray-400">Overall Market Direction</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-400 mb-2">
                    {compositeSignal.strength.toFixed(0)}%
                  </div>
                  <p className="text-gray-400">Signal Strength</p>
                  <div className="mt-4 w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        compositeSignal.signal === 'BUY'
                          ? 'bg-green-500'
                          : compositeSignal.signal === 'SELL'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }`}
                      style={{ width: `${compositeSignal.strength}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    className="px-4 py-2 border border-gray-600 hover:border-blue-500 rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Strategy Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {STRATEGIES.map((strategy) => {
            const IconComponent = strategy.icon;
            const state = strategies[strategy.id];

            return (
              <Card
                key={strategy.id}
                className={`cursor-pointer transition-all ${
                  state.enabled ? 'border-blue-500/30' : 'border-gray-700'
                }`}
              >
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{strategy.name}</h3>
                        <p className="text-xs text-gray-400">Strategy</p>
                      </div>
                    </div>
                    <button onClick={() => toggleStrategy(strategy.id)}>
                      {state.enabled ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Signal Badge */}
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${getSignalBg(
                        strategy.signal
                      )} ${getSignalColor(strategy.signal)}`}
                    >
                      {strategy.signal}
                    </span>
                  </div>

                  {/* Signal Strength */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Signal Strength</span>
                      <span className="text-xs font-medium text-white">
                        {strategy.strength}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${strategy.strength}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-gray-400">Win Rate</p>
                      <p className="text-white font-semibold">{strategy.winRate}%</p>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-gray-400">Signals</p>
                      <p className="text-white font-semibold">{strategy.totalSignals}</p>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-gray-400">P.Factor</p>
                      <p className="text-white font-semibold">{strategy.profitFactor}</p>
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Weight</span>
                      <span className="text-xs font-medium text-blue-400">
                        {state.weight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.weight}
                      onChange={(e) =>
                        updateWeight(strategy.id, parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Configure Button */}
                  <button
                    onClick={() => toggleExpanded(strategy.id)}
                    className="w-full py-2 border border-gray-700 hover:border-blue-500 rounded text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                    {state.expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Expanded Configuration */}
                  {state.expanded && (
                    <div className="pt-4 border-t border-gray-700 space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 block">
                          Threshold
                        </label>
                        <input
                          type="number"
                          defaultValue={50}
                          className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 block">
                          Period
                        </label>
                        <input
                          type="number"
                          defaultValue={14}
                          className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                        />
                      </div>
                      <button className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        Save Parameters
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Strategy Comparison Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Strategy Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Strategy
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Signal
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Win Rate
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Profit Factor
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Total Signals
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                      Weight
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STRATEGIES.map((strategy) => (
                    <tr
                      key={strategy.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {strategy.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSignalBg(
                            strategy.signal
                          )} ${getSignalColor(strategy.signal)}`}
                        >
                          {strategy.signal}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {strategy.winRate}%
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {strategy.profitFactor}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {strategy.totalSignals}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                        {strategies[strategy.id].weight}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}