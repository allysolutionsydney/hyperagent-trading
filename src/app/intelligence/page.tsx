'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import {
  Brain,
  CheckCircle,
  RefreshCw,
  Target,
  AlertCircle,
} from 'lucide-react';
import { IntelligenceEngine } from '@/lib/intelligence';
import { useMemo, useState } from 'react';

export default function IntelligencePage() {
  const store = useStore();
  const [message, setMessage] = useState<string | null>(null);

  const intelligenceReport = useMemo(() => {
    const state = store.intelligenceState;
    if (!state) return null;

    try {
      const engine = IntelligenceEngine.fromJSON(state);
      return engine.generateReport();
    } catch (error) {
      console.error('Failed to build intelligence report:', error);
      return null;
    }
  }, [store.intelligenceState]);

  const progress = store.learningProgress;
  const strategyRankings = store.strategyRankings;

  const handleGenerateSnapshot = () => {
    const engine = new IntelligenceEngine(store.intelligenceState || undefined);
    store.setIntelligenceState(engine.exportIntelligence());
    setMessage('Intelligence snapshot refreshed from current local state.');
  };

  const learningPercent = Math.min(100, Math.round((progress.totalTrades / 100) * 100));
  const confidenceLabel =
    progress.confidence >= 0.8 ? 'High' : progress.confidence >= 0.5 ? 'Medium' : 'Low';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Intelligence</h1>
          <p className="text-gray-400 mt-1">Review what the system has actually learned so far</p>
          {message && <p className="text-sm text-blue-300 mt-2">{message}</p>}
        </div>

        {!store.intelligenceState && (
          <Card className="border border-yellow-500/30 bg-yellow-500/5">
            <div className="p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-white">No persisted intelligence yet</h2>
                <p className="text-sm text-gray-300 mt-2">
                  This page was previously showing static mock data. It now reflects real local state only.
                  Generate a snapshot once trades and learning data exist.
                </p>
                <button
                  onClick={handleGenerateSnapshot}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate Empty Snapshot
                </button>
              </div>
            </div>
          </Card>
        )}

        <Card className="border-2 border-blue-500/30">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Learning Progress</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - learningPercent / 100)}`}
                      className="text-blue-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-400">{learningPercent}%</p>
                      <p className="text-xs text-gray-400 mt-1">Learning Progress</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Trades Analyzed</p>
                  <p className="text-2xl font-bold text-white">{progress.totalTrades}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{(progress.winRate * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Profit Factor</p>
                  <p className="text-2xl font-bold text-green-400">{progress.profitFactor.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-purple-400">{confidenceLabel}</p>
                </div>
              </div>

              <div>
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-4 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-gray-200 text-xs mb-1">Current Regime</p>
                    <p className="text-white font-semibold">{store.currentRegime}</p>
                    <p className="text-xs text-gray-200 mt-2">Driven by current local state</p>
                  </div>
                  <p className="text-xl font-bold text-yellow-300 mt-4">
                    {strategyRankings.length} strategy scores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Strategy Rankings</h2>
              <button
                onClick={handleGenerateSnapshot}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Refresh Snapshot
              </button>
            </div>

            {strategyRankings.length === 0 ? (
              <p className="text-sm text-gray-400">No live strategy rankings stored yet.</p>
            ) : (
              <div className="space-y-3">
                {strategyRankings.map((strategy, idx) => (
                  <div key={`${strategy.strategy}-${idx}`} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{strategy.strategy}</p>
                        <p className="text-xs text-gray-400">Score-based ranking from local state</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-400">{strategy.score.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Learning Report</h2>

            {!intelligenceReport ? (
              <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 text-sm text-gray-400">
                No generated intelligence report yet. Once the engine has stored trades/patterns, this section will summarize real insights.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-600/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    Summary
                  </h3>
                  <p className="text-sm text-gray-300">{intelligenceReport.summary}</p>
                </div>

                <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-600/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Recommendations
                  </h3>
                  {intelligenceReport.recommendations.length === 0 ? (
                    <p className="text-sm text-gray-300">No recommendations yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-gray-300">
                      {intelligenceReport.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
