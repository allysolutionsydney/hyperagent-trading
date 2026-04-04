'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import { useStore } from '@/hooks/useStore';
import { useMarketData } from '@/hooks/useMarketData';
import {
  Send,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Message as ChatMessage, TechnicalIndicators } from '@/types';
import { formatPrice, formatTimestamp } from '@/utils/format';

function buildBasicIndicators(candles: Array<{ close: number; high: number; low: number; volume: number }>): TechnicalIndicators {
  if (!candles.length) return {};

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const sma = (period: number) => {
    if (closes.length < period) return undefined;
    const slice = closes.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  return {
    sma20: sma(20),
    sma50: sma(50),
    sma200: sma(200),
    atr: Math.max(...highs) - Math.min(...lows),
    volumeProfile: {
      interpretation: `Average volume ${(volumes.reduce((a, b) => a + b, 0) / volumes.length).toFixed(2)}`,
      pocLevel: closes[closes.length - 1],
      valueLow: Math.min(...lows),
      valueHigh: Math.max(...highs),
    },
  };
}

const SUGGESTED_QUESTIONS = [
  "What's the current trend?",
  'What are the key support and resistance levels?',
  'Should I be looking for a breakout or mean reversion?',
  'What does current market structure suggest?',
];

export default function AnalysisPage() {
  const store = useStore();
  const { isLoading, error } = useMarketData();
  const [inputValue, setInputValue] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);

  const candles = store.candles || [];
  const selectedCoin = store.selectedCoin;
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const periodChange = candles.length > 1 ? ((candles[candles.length - 1].close - candles[0].open) / candles[0].open) * 100 : 0;
  const indicators = useMemo(() => buildBasicIndicators(candles), [candles]);

  const chatMessages: ChatMessage[] = store.chatMessages.length
    ? store.chatMessages
    : [
        {
          id: 'seed',
          role: 'assistant',
          content: 'Ask for analysis once market data and API keys are loaded. I will use the actual AI route, not canned responses.',
          timestamp: Date.now(),
        },
      ];

  const runStructuredAnalysis = async () => {
    if (!store.apiKeys.openai) {
      return;
    }
    if (!candles.length) {
      return;
    }

    setAnalysisBusy(true);
    store.setAnalyzing(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          apiKey: store.apiKeys.openai,
          data: {
            coin: selectedCoin,
            candles,
            indicators,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      store.setAnalysis(result.data);
    } catch (err) {
      console.error('Structured analysis failed:', err);
    } finally {
      setAnalysisBusy(false);
      store.setAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const nextMessages: ChatMessage[] = [
      ...store.chatMessages,
      {
        id: `${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: Date.now(),
      },
    ];

    store.clearChatMessages();
    nextMessages.forEach((msg) => store.addChatMessage(msg));
    const currentInput = inputValue;
    setInputValue('');

    if (!store.apiKeys.openai) {
      store.addChatMessage({
        id: `${Date.now()}-warn`,
        role: 'assistant',
        content: 'OpenAI API key is missing in Settings, so live AI chat is unavailable right now.',
        timestamp: Date.now(),
      });
      return;
    }

    setChatBusy(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          apiKey: store.apiKeys.openai,
          data: {
            messages: [
              ...nextMessages,
              {
                id: `${Date.now()}-context`,
                role: 'user',
                content: `Current coin: ${selectedCoin}. Current price: ${currentPrice}. Period change: ${periodChange.toFixed(2)}%. User question: ${currentInput}`,
                timestamp: Date.now(),
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const result = await response.json();
      store.addChatMessage({
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: result.data,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Chat analysis failed:', err);
      store.addChatMessage({
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Live AI chat failed. Check the API key and backend route health.',
        timestamp: Date.now(),
      });
    } finally {
      setChatBusy(false);
    }
  };

  const latestAnalysis = store.analysisResult;
  const marketStateText = currentPrice
    ? `${selectedCoin} is trading at ${formatPrice(currentPrice)} (${periodChange >= 0 ? '+' : ''}${periodChange.toFixed(2)}% over loaded period).`
    : 'No live market price available yet.';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Market Analysis</h1>
          <p className="text-gray-400 mt-1">Real market context, real AI route, no canned analysis</p>
        </div>

        {error && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
            Market data issue: {error}
          </div>
        )}

        {!store.apiKeys.openai && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
            OpenAI API key is not configured. Analysis page can still show market context, but live AI analysis/chat is disabled until you add a key in Settings.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Current Price</p>
              <p className="text-2xl font-bold text-white">{currentPrice ? formatPrice(currentPrice) : '—'}</p>
              <p className={`text-sm mt-2 flex items-center gap-1 ${periodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {periodChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {periodChange.toFixed(2)}% loaded-period change
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Candles Loaded</p>
              <p className="text-2xl font-bold text-white">{candles.length}</p>
              <p className="text-blue-400 text-sm mt-2">Market data hook</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Current Regime</p>
              <p className="text-2xl font-bold text-white">{store.currentRegime}</p>
              <p className="text-gray-400 text-sm mt-2">Store-driven</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-2">Analysis Status</p>
              <p className="text-2xl font-bold text-white">{latestAnalysis ? 'Ready' : 'Idle'}</p>
              <p className="text-gray-400 text-sm mt-2">{analysisBusy || store.isAnalyzing ? 'Running now' : 'On demand'}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">AI Chat Analysis</h2>
                  <button
                    onClick={runStructuredAnalysis}
                    disabled={analysisBusy || !store.apiKeys.openai || candles.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {analysisBusy ? 'Analyzing...' : 'Run Structured Analysis'}
                  </button>
                </div>

                <div className="mb-4 rounded-lg border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-300">
                  {marketStateText}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-96">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-800 text-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">{formatTimestamp(msg.timestamp, true)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {store.chatMessages.length <= 1 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-gray-400">Suggested questions:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTED_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInputValue(q)}
                          className="text-left px-3 py-2 border border-gray-700 hover:border-blue-500 rounded text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder="Ask about the current market..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatBusy || !inputValue.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-4">LIVE MARKET SNAPSHOT</h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                    <span className="text-gray-400">Selected Coin</span>
                    <span className="text-white font-semibold">{selectedCoin}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white font-semibold">{currentPrice ? formatPrice(currentPrice) : '—'}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                    <span className="text-gray-400">SMA20</span>
                    <span className="text-blue-400 font-semibold">{indicators.sma20 ? formatPrice(indicators.sma20) : '—'}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                    <span className="text-gray-400">SMA50</span>
                    <span className="text-blue-400 font-semibold">{indicators.sma50 ? formatPrice(indicators.sma50) : '—'}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                    <span className="text-gray-400">ATR Proxy</span>
                    <span className="text-yellow-400 font-semibold">{indicators.atr ? indicators.atr.toFixed(2) : '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">STRUCTURED ANALYSIS</h3>
                {!latestAnalysis ? (
                  <div className="bg-gray-800/50 rounded p-3 text-sm text-gray-400">
                    No structured AI analysis yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                      <span className="text-gray-400">Trend</span>
                      <span className="text-white font-semibold">{latestAnalysis.trend}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                      <span className="text-gray-400">Recommendation</span>
                      <span className="text-blue-400 font-semibold">{latestAnalysis.recommendation}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-green-400 font-semibold">{latestAnalysis.confidence}%</span>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                      <span className="text-gray-400">Support</span>
                      <span className="text-green-400 font-semibold">{formatPrice(latestAnalysis.keyLevels?.support?.[0] || 0)}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3 flex justify-between">
                      <span className="text-gray-400">Resistance</span>
                      <span className="text-red-400 font-semibold">{formatPrice(latestAnalysis.keyLevels?.resistance?.[0] || 0)}</span>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-sm text-gray-300">
                      {latestAnalysis.technicalSummary}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-800 text-xs text-gray-500 flex items-start gap-2">
                {store.apiKeys.openai ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span>Live AI route available if the configured key is valid.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <span>Add an OpenAI key in Settings to enable live analysis.</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
