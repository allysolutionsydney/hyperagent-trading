'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import {
  Brain,
  TrendingUp,
  CheckCircle,
  Zap,
  Clock,
  RefreshCw,
  Download,
  ArrowRight,
  AlertCircle,
  Award,
  Target,
} from 'lucide-react';
import { useState } from 'react';

const STRATEGY_RANKINGS = [
  {
    name: 'AI Sentiment',
    winRate: 67,
    profitFactor: 2.15,
    sharpeRatio: 1.82,
    currentWeight: 30,
    recommendedWeight: 35,
  },
  {
    name: 'RSI Divergence',
    winRate: 62,
    profitFactor: 1.85,
    sharpeRatio: 1.45,
    currentWeight: 15,
    recommendedWeight: 18,
  },
  {
    name: 'MA Crossover',
    winRate: 61,
    profitFactor: 1.72,
    sharpeRatio: 1.28,
    currentWeight: 18,
    recommendedWeight: 20,
  },
  {
    name: 'MACD Crossover',
    winRate: 58,
    profitFactor: 1.65,
    sharpeRatio: 1.12,
    currentWeight: 15,
    recommendedWeight: 15,
  },
  {
    name: 'Volume Analysis',
    winRate: 57,
    profitFactor: 1.58,
    sharpeRatio: 0.95,
    currentWeight: 10,
    recommendedWeight: 7,
  },
  {
    name: 'Bollinger Bands',
    winRate: 55,
    profitFactor: 1.42,
    sharpeRatio: 0.78,
    currentWeight: 12,
    recommendedWeight: 5,
  },
];

const PATTERNS = [
  {
    pattern: 'Morning Star',
    regime: 'Trending Up',
    successRate: 78,
    occurrences: 24,
    lastSeen: '2024-03-27',
  },
  {
    pattern: 'Bullish Divergence',
    regime: 'Ranging',
    successRate: 72,
    occurrences: 18,
    lastSeen: '2024-03-28',
  },
  {
    pattern: 'Support Bounce',
    regime: 'Trending Up',
    successRate: 68,
    occurrences: 34,
    lastSeen: '2024-03-28',
  },
  {
    pattern: 'Volume Spike',
    regime: 'Trending Up',
    successRate: 65,
    occurrences: 42,
    lastSeen: '2024-03-28',
  },
  {
    pattern: 'Golden Cross',
    regime: 'Trending Up',
    successRate: 62,
    occurrences: 12,
    lastSeen: '2024-03-27',
  },
];

const OPTIMIZATION_LOG = [
  {
    timestamp: '2024-03-28 14:32',
    adjustment: 'Increased AI Sentiment weight from 25% to 30%',
    reason: 'Improved performance in current market regime',
    result: 'Win rate improved by 2.1%',
  },
  {
    timestamp: '2024-03-27 09:15',
    adjustment: 'Reduced Bollinger Bands weight from 15% to 12%',
    reason: 'Underperforming in trending markets',
    result: 'Sharpe ratio improved by 0.15',
  },
  {
    timestamp: '2024-03-26 16:45',
    adjustment: 'Reordered strategy priority based on recent performance',
    reason: 'Market conditions changed, AI sentiment more reliable',
    result: 'Overall composite signal accuracy up 3.4%',
  },
];

export default function IntelligencePage() {
  const store = useStore();
  const [selectedStrategy, setSelectedStrategy] = useState('AI Sentiment');

  const learningProgress = 65;
  const totalTradesAnalyzed = 1247;
  const patternsIdentified = 5;
  const accuracyImprovement = 12.4;

  const intelligenceLevel = (() => {
    if (learningProgress < 20) return 'Novice';
    if (learningProgress < 40) return 'Beginner';
    if (learningProgress < 60) return 'Intermediate';
    if (learningProgress < 80) return 'Advanced';
    return 'Expert';
  })();

  const levelColor =
    intelligenceLevel === 'Expert'
      ? 'text-green-400'
      : intelligenceLevel === 'Advanced'
        ? 'text-blue-400'
        : 'text-yellow-400';

  const topStrategy = STRATEGY_RANKINGS[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Intelligence</h1>
          <p className="text-gray-400 mt-1">Monitor learning progress and optimization history</p>
        </div>

        {/* Learning Progress Section */}
        <Card className="border-2 border-blue-500/30">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Learning Progress</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Circular Progress */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - learningProgress / 100)}`}
                      className="text-blue-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-400">{learningProgress}%</p>
                      <p className="text-xs text-gray-400 mt-1">Learning Progress</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Trades Analyzed</p>
                  <p className="text-2xl font-bold text-white">{totalTradesAnalyzed}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Patterns Identified</p>
                  <p className="text-2xl font-bold text-blue-400">{patternsIdentified}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Accuracy Improvement</p>
                  <p className="text-2xl font-bold text-green-400">+{accuracyImprovement}%</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Current Level</p>
                  <p className={`text-2xl font-bold ${levelColor}`}>{intelligenceLevel}</p>
                </div>
              </div>

              {/* Next Milestone */}
              <div>
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-4 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-gray-200 text-xs mb-1">Next Milestone</p>
                    <p className="text-white font-semibold">Expert Level</p>
                    <p className="text-xs text-gray-200 mt-2">Reach 80% learning</p>
                  </div>
                  <p className="text-xl font-bold text-yellow-300 mt-4">
                    {80 - learningProgress}% away
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Strategy Performance Rankings */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Strategy Performance Rankings</h2>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Apply Recommended Weights
              </button>
            </div>

            <div className="space-y-4">
              {STRATEGY_RANKINGS.map((strategy, idx) => (
                <div
                  key={strategy.name}
                  className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedStrategy(strategy.name)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Ranking & Name */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <p className="text-white font-bold text-sm">{idx + 1}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{strategy.name}</p>

                        {/* Performance bars */}
                        <div className="mt-3 space-y-2">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400">Win Rate</span>
                              <span className="text-xs font-medium text-white">
                                {strategy.winRate}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${strategy.winRate}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400">Profit Factor</span>
                              <span className="text-xs font-medium text-white">
                                {strategy.profitFactor}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{
                                  width: `${(strategy.profitFactor / 3) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Weights */}
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-gray-400 text-xs mb-1">Current Weight</p>
                        <p className="text-xl font-bold text-blue-400">
                          {strategy.currentWeight}%
                        </p>
                      </div>

                      <div className="text-2xl text-gray-600 mx-3">
                        <ArrowRight className="w-5 h-5" />
                      </div>

                      <div className="text-center flex-1">
                        <p className="text-gray-400 text-xs mb-1">Recommended</p>
                        <p className="text-xl font-bold text-green-400">
                          {strategy.recommendedWeight}%
                        </p>
                      </div>

                      {strategy.recommendedWeight !== strategy.currentWeight && (
                        <div className="text-xs font-semibold text-yellow-400 ml-3">
                          {strategy.recommendedWeight > strategy.currentWeight ? '+' : ''}
                          {strategy.recommendedWeight - strategy.currentWeight}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sharpe Ratio */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Sharpe Ratio</span>
                      <span className="text-sm font-semibold text-purple-400">
                        {strategy.sharpeRatio}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pattern Library */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Pattern Library</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">
                        Pattern
                      </th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">
                        Regime
                      </th>
                      <th className="text-right py-3 px-3 text-gray-400 font-medium">
                        Success
                      </th>
                      <th className="text-right py-3 px-3 text-gray-400 font-medium">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PATTERNS.map((p) => (
                      <tr
                        key={p.pattern}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <p className="text-white font-medium">{p.pattern}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Last: {p.lastSeen}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-sm">
                          {p.regime}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${p.successRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-green-400 w-8">
                              {p.successRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-white font-medium">
                          {p.occurrences}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Most reliable patterns are highlighted with strong success rates
              </p>
            </div>
          </Card>

          {/* Recent Optimizations */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Optimization Log</h2>

              <div className="space-y-4">
                {OPTIMIZATION_LOG.map((log, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="mt-1">
                        <RefreshCw className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {log.adjustment}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
                      </div>
                    </div>

                    <div className="ml-7 space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400">Reason: </span>
                        <span className="text-gray-300">{log.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">{log.result}</span>
                      </div>
                    </div>

                    <button className="mt-3 ml-7 px-3 py-1 border border-gray-700 hover:border-yellow-500 rounded text-xs text-gray-300 hover:text-yellow-400 transition-colors">
                      Rollback
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Learning Report */}
        <Card className="border-2 border-purple-500/30">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Learning Report</h2>
                <p className="text-sm text-gray-400 mt-1">
                  AI-generated summary of trading agent insights
                </p>
              </div>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Generate New Report
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-600/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Key Insights
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>
                      AI Sentiment strategy has emerged as the most reliable with 67% win
                      rate and 2.15 profit factor
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>
                      Morning Star and Bullish Divergence patterns show 78% and 72% success
                      rates respectively
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>
                      Recent market regime changes suggest system adaptation is effective
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>
                      Bollinger Bands strategy underperforming in trending markets, recommend
                      weight reduction
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-600/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>
                      Increase AI Sentiment weight to 35% and MA Crossover to 20% for better
                      composite signal
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>
                      Reduce Bollinger Bands weight to 5% during strongly trending markets
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>
                      Monitor Morning Star pattern more closely for entry opportunities
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>
                      Continue current learning trajectory - projected Expert level in 2 weeks
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Report Stats */}
            <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-2">Report Generated</p>
                <p className="text-sm font-semibold text-white">Today 14:32 UTC</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-2">Confidence Score</p>
                <p className="text-sm font-semibold text-blue-400">87%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-2">Next Update</p>
                <p className="text-sm font-semibold text-white">Tomorrow 00:00 UTC</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
