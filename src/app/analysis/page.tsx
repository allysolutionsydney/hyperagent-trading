'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import {
  Send,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Volume2,
  Wind,
} from 'lucide-react';
import { useState } from 'react';

const MARKET_OVERVIEW = {
  price: 46850,
  change24h: 2.34,
  volume24h: 28500000000,
  fundingRate: 0.0156,
};

const TECHNICAL_INDICATORS = {
  rsi: 65,
  rsiStatus: 'Overbought',
  macd: 'Bullish',
  bb: 'Upper',
  support: 44500,
  resistance: 48200,
  trend: 'Uptrend',
  trendConfidence: 78,
};

const MARKET_REGIMES = [
  'Trending Up',
  'Ranging',
  'Trending Up',
  'Trending Up',
  'High Vol',
  'Trending Up',
];

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What's the current trend?",
  'Should I go long?',
  'Analyze support/resistance levels',
  'What patterns do you see?',
];

const TRADE_IDEAS = [
  {
    id: '1',
    direction: 'Long',
    entry: 46500,
    stopLoss: 45000,
    takeProfit: 49500,
    riskReward: 3.33,
    confidence: 78,
  },
  {
    id: '2',
    direction: 'Short',
    entry: 48200,
    stopLoss: 49500,
    takeProfit: 46000,
    riskReward: 2.86,
    confidence: 65,
  },
];

export default function AnalysisPage() {
  const store = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content:
        'Hello! I am your AI trading analyst. I can help you analyze market conditions, identify trading opportunities, and provide technical insights. What would you like to know?',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content:
          'Based on current technical indicators, BTC is showing strong bullish momentum. The RSI is at 65 (approaching overbought), but the MACD is still above the signal line. I recommend watching for support at $45,000 and resistance at $48,200. The funding rate is positive at 0.0156%, indicating bullish sentiment.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);

    setInputValue('');
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const currentRegime = MARKET_REGIMES[MARKET_REGIMES.length - 1];
  const regimeColor =
    currentRegime === 'Trending Up'
      ? 'text-green-400'
      : currentRegime === 'Trending Down'
        ? 'text-red-400'
        : 'text-yellow-400';

  const regimeBg =
    currentRegime === 'Trending Up'
      ? 'bg-green-500/20'
      : currentRegime === 'Trending Down'
        ? 'bg-red-500/20'
        : 'bg-yellow-500/20';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">AI Market Analysis</h1>
          <p className="text-gray-400 mt-1">Ask questions, analyze patterns, and discover opportunities</p>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Current Price</p>
              <p className="text-2xl font-bold text-white">
                ${MARKET_OVERVIEW.price.toLocaleString()}
              </p>
              <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +{MARKET_OVERVIEW.change24h}% (24h)
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">24h Volume</p>
              <p className="text-2xl font-bold text-white">
                ${(MARKET_OVERVIEW.volume24h / 1000000000).toFixed(1)}B
              </p>
              <p className="text-blue-400 text-sm mt-2">Exchange Volume</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Funding Rate</p>
              <p className="text-2xl font-bold text-white">
                {MARKET_OVERVIEW.fundingRate.toFixed(4)}%
              </p>
              <p className="text-green-400 text-sm mt-2">Bullish Signal</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Market Regime</p>
              <p className={`text-2xl font-bold ${regimeColor}`}>{currentRegime}</p>
              <p className="text-gray-400 text-sm mt-2">Current Condition</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4">
                  AI Chat Analysis
                </h2>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-96">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-800 text-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested Questions */}
                {messages.length === 1 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-gray-400">Suggested questions:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTED_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedQuestion(q)}
                          className="text-left px-3 py-2 border border-gray-700 hover:border-blue-500 rounded text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me about the market..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Technical Analysis Panel */}
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-4">
                  TECHNICAL INDICATORS
                </h3>

                {/* RSI */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">RSI (14)</p>
                    <p className="text-sm font-semibold text-white">
                      {TECHNICAL_INDICATORS.rsi}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                      style={{ width: `${TECHNICAL_INDICATORS.rsi}%` }}
                    />
                  </div>
                  <p className="text-xs text-yellow-400 mt-2">
                    {TECHNICAL_INDICATORS.rsiStatus}
                  </p>
                </div>

                {/* MACD */}
                <div className="bg-gray-800/50 rounded p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">MACD</span>
                    <span className="text-sm font-semibold text-green-400">
                      {TECHNICAL_INDICATORS.macd}
                    </span>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="bg-gray-800/50 rounded p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Bollinger Bands</span>
                    <span className="text-sm font-semibold text-yellow-400">
                      {TECHNICAL_INDICATORS.bb}
                    </span>
                  </div>
                </div>
              </div>

              {/* Support & Resistance */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  SUPPORT & RESISTANCE
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-gray-800/50 rounded p-3">
                    <span className="text-sm text-gray-400">Resistance</span>
                    <span className="text-sm font-semibold text-red-400">
                      ${TECHNICAL_INDICATORS.resistance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800/50 rounded p-3">
                    <span className="text-sm text-gray-400">Support</span>
                    <span className="text-sm font-semibold text-green-400">
                      ${TECHNICAL_INDICATORS.support.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  TREND ANALYSIS
                </h3>
                <div className="bg-gray-800/50 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Direction</span>
                    <span className="text-sm font-semibold text-green-400 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {TECHNICAL_INDICATORS.trend}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Confidence</span>
                    <span className="text-sm font-semibold text-blue-400">
                      {TECHNICAL_INDICATORS.trendConfidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Market Regime Section */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Market Regime History
            </h2>

            {/* Current Regime */}
            <div className="mb-6 pb-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg font-semibold ${regimeBg} ${regimeColor}`}>
                  {currentRegime}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Market Regime</p>
                  <p className="text-xs text-gray-500 mt-1">Updated 2 minutes ago</p>
                </div>
              </div>
            </div>

            {/* Regime Timeline */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 mb-4">Last 30 periods</p>
              <div className="flex gap-1 h-20 items-end">
                {MARKET_REGIMES.map((regime, idx) => {
                  const colors = {
                    'Trending Up': 'bg-green-500',
                    'Trending Down': 'bg-red-500',
                    'Ranging': 'bg-yellow-500',
                    'High Vol': 'bg-purple-500',
                    'Low Vol': 'bg-blue-500',
                  };
                  return (
                    <div
                      key={idx}
                      className={`flex-1 ${colors[regime as keyof typeof colors]} opacity-${
                        Math.ceil(((idx + 1) / MARKET_REGIMES.length) * 100) / 10
                      } rounded-t`}
                      style={{
                        height: `${((idx + 1) / MARKET_REGIMES.length) * 100}%`,
                        opacity: 0.5 + (idx / MARKET_REGIMES.length) * 0.5,
                      }}
                      title={regime}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Trade Ideas Section */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              AI-Generated Trade Ideas
            </h2>

            <div className="space-y-4">
              {TRADE_IDEAS.map((idea) => (
                <div
                  key={idea.id}
                  className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Left side */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-4 py-2 rounded-lg font-semibold text-white ${
                            idea.direction === 'Long'
                              ? 'bg-green-600'
                              : 'bg-red-600'
                          }`}
                        >
                          {idea.direction === 'Long' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {idea.direction} Position
                          </p>
                          <p className="text-xs text-gray-400">
                            Confidence: {idea.confidence}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-800/50 rounded p-2">
                          <p className="text-gray-400 text-xs">Entry</p>
                          <p className="text-white font-semibold">
                            ${idea.entry.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <p className="text-gray-400 text-xs">Stop Loss</p>
                          <p className="text-red-400 font-semibold">
                            ${idea.stopLoss.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2 col-span-2">
                          <p className="text-gray-400 text-xs">Take Profit</p>
                          <p className="text-green-400 font-semibold">
                            ${idea.takeProfit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Risk/Reward */}
                    <div className="flex flex-col justify-between">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Risk/Reward Ratio</p>
                        <p className="text-4xl font-bold text-blue-400">
                          {idea.riskReward.toFixed(2)}
                        </p>
                      </div>

                      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                        <Target className="w-4 h-4" />
                        Execute This Trade
                      </button>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                      style={{ width: `${idea.confidence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}