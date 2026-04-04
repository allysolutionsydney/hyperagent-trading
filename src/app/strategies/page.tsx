'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import SignalBadge from '@/components/SignalBadge';
import { useStore } from '@/hooks/useStore';
import {
  Activity,
  BarChart3,
  Brain,
  Gauge,
  Play,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';

const ICON_MAP: Record<string, any> = {
  mean_reversion: Gauge,
  momentum: TrendingUp,
  breakout: Zap,
  macd_cross: Activity,
  RSI: Gauge,
  MACD: Activity,
  Bollinger: BarChart3,
  'MA Crossover': TrendingUp,
  Volume: Zap,
  'AI Sentiment': Brain,
};

function normalizeSignalType(type?: string): 'BUY' | 'SELL' | 'HOLD' {
  if (!type) return 'HOLD';
  if (type === 'STRONG_BUY' || type === 'BUY') return 'BUY';
  if (type === 'STRONG_SELL' || type === 'SELL') return 'SELL';
  return 'HOLD';
}

export default function StrategiesPage() {
  const store = useStore();

  const strategyEntries = useMemo(() => Object.entries(store.strategies || {}), [store.strategies]);

  const signalByStrategy = useMemo(() => {
    const map = new Map<string, any>();
    (store.signals || []).forEach((signal: any) => {
      map.set(signal.strategy, signal);
    });
    return map;
  }, [store.signals]);

  const composite = store.compositeSignal || {
    signal: 'NEUTRAL',
    strength: 0,
    confidence: 0,
  };

  const handleRunStrategies = async () => {
    if (!store.candles || store.candles.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          candles: store.candles,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to run strategies: ${response.statusText}`);
      }

      const result = await response.json();
      store.setSignals(result.data.signals || []);
      store.setCompositeSignal({
        signal: result.data.compositeSignal || 'NEUTRAL',
        strength: result.data.compositeStrength || 0,
        confidence: result.data.compositeConfidence || 0,
      });
    } catch (error) {
      console.error('Strategy run failed:', error);
    }
  };

  const compositeBadgeSignal =
    composite.signal === 'STRONG_BUY'
      ? 'BUY'
      : composite.signal === 'STRONG_SELL'
      ? 'SELL'
      : composite.signal === 'BUY'
      ? 'BUY'
      : composite.signal === 'SELL'
      ? 'SELL'
      : 'HOLD';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Strategy Management</h1>
            <p className="text-gray-400 mt-1">Real store-backed strategy controls and signals</p>
          </div>
          <button
            onClick={handleRunStrategies}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Run Strategies
          </button>
        </div>

        <Card className="border-2 border-blue-500/30">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Composite Signal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="text-5xl font-bold text-white mb-2">{composite.signal}</div>
                <p className="text-gray-400">Overall market direction</p>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-400 mb-2">{composite.strength.toFixed(0)}%</div>
                  <p className="text-gray-400">Signal strength</p>
                  <div className="mt-4 flex justify-center">
                    <SignalBadge signal={compositeBadgeSignal} strength={composite.strength} size="lg" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Confidence</p>
                  <p className="text-white font-semibold">{composite.confidence.toFixed(0)}%</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Signals Loaded</p>
                  <p className="text-white font-semibold">{store.signals.length}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Candles Available</p>
                  <p className="text-white font-semibold">{store.candles.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {strategyEntries.length === 0 ? (
          <Card>
            <div className="p-6 text-sm text-gray-400">No strategies are configured in the store yet.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {strategyEntries.map(([name, strategy]) => {
              const IconComponent = ICON_MAP[name] || Settings;
              const liveSignal = signalByStrategy.get(name);
              const normalizedSignal = normalizeSignalType(liveSignal?.type);
              const signalStrength = liveSignal?.strength ?? liveSignal?.confidence ?? 0;

              return (
                <Card key={name} className={`${strategy.enabled ? 'border-blue-500/30' : 'border-gray-700'} transition-all`}>
                  <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{name}</h3>
                          <p className="text-xs text-gray-400">Store strategy</p>
                        </div>
                      </div>
                      <button
                        onClick={() => store.toggleStrategy(name, !strategy.enabled)}
                        className={`px-3 py-1 rounded text-xs font-medium ${strategy.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}
                      >
                        {strategy.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <div>
                      <SignalBadge signal={normalizedSignal} strength={signalStrength} size="md" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Weight</span>
                        <span className="text-xs font-medium text-blue-400">{strategy.weight}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={strategy.weight}
                        onChange={(e) => store.setWeight(name, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Parameters</p>
                      {Object.keys(strategy.params || {}).length === 0 ? (
                        <div className="text-xs text-gray-500">No parameters configured.</div>
                      ) : (
                        Object.entries(strategy.params).map(([paramName, value]) => (
                          <div key={paramName}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400">{paramName}</span>
                              <span className="text-xs font-medium text-white">{Number(value)}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Number(value) > 20 ? 200 : 100}
                              step="1"
                              value={Number(value)}
                              onChange={(e) => store.setStrategyParam(name, paramName, parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
                      {liveSignal ? liveSignal.reasoning || 'Live strategy signal available.' : 'No live signal for this strategy yet.'}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Strategy Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Strategy</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Enabled</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Signal</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Strength</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {strategyEntries.map(([name, strategy]) => {
                    const liveSignal = signalByStrategy.get(name);
                    const normalizedSignal = normalizeSignalType(liveSignal?.type);
                    const signalStrength = liveSignal?.strength ?? liveSignal?.confidence ?? 0;

                    return (
                      <tr key={name} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{name}</td>
                        <td className="py-3 px-4 text-gray-300">{strategy.enabled ? 'Yes' : 'No'}</td>
                        <td className="py-3 px-4">
                          <SignalBadge signal={normalizedSignal} strength={signalStrength} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right text-white">{signalStrength.toFixed(0)}%</td>
                        <td className="py-3 px-4 text-right text-blue-400 font-semibold">{strategy.weight}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
