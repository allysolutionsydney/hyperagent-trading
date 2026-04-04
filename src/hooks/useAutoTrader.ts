import { useEffect, useRef, useState } from 'react';
import { useStore } from './useStore';
import { Signal, TechnicalIndicators } from '../types';

interface UseAutoTraderReturn {
  isRunning: boolean;
  lastSignal: Signal | null;
  lastAction: string | null;
  toggleAutoTrading: (enabled: boolean) => void;
}

function buildBasicIndicators(candles: Array<{ close: number; high: number; low: number; volume: number }>): TechnicalIndicators {
  if (!candles.length) return {};

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const latestClose = closes[closes.length - 1];
  const sma = (period: number) => {
    if (closes.length < period) return undefined;
    const slice = closes.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  const avgVolume = volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;

  return {
    sma20: sma(20),
    sma50: sma(50),
    sma200: sma(200),
    atr: highs.length && lows.length ? Math.max(...highs) - Math.min(...lows) : undefined,
    volumeProfile: {
      interpretation: avgVolume > 0 ? `Average volume ${avgVolume.toFixed(2)}` : 'Volume unavailable',
      pocLevel: latestClose,
      valueLow: Math.min(...lows),
      valueHigh: Math.max(...highs),
    },
  };
}

export function useAutoTrader(): UseAutoTraderReturn {
  const [lastSignal, setLastSignal] = useState<Signal | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isAutoTrading,
    toggleAutoTrading: toggleAutoTradingStore,
    selectedCoin,
    candles,
    setCompositeSignal,
    setAnalysis,
    setAnalyzing,
    riskSettings,
    positions,
    accountBalance,
    addTrade,
    isTestnet,
    apiKeys,
  } = useStore();

  const logDecision = async (decision: string, details: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, decision, details };
    console.log('[AutoTrader]', logEntry);

    try {
      await fetch('/api/trading/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (err) {
      console.error('Failed to log decision to backend:', err);
    }
  };

  const runAnalysisLoop = async () => {
    try {
      if (!candles || candles.length === 0) {
        await logDecision('SKIP_ANALYSIS', {
          reason: 'No candle data available',
          coin: selectedCoin,
        });
        return;
      }

      const strategiesResponse = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          candles,
        }),
      });

      if (!strategiesResponse.ok) {
        throw new Error(`Strategy analysis failed: ${strategiesResponse.statusText}`);
      }

      const strategiesData = await strategiesResponse.json();
      const signals: Signal[] = strategiesData.data?.signals || [];
      const compositeSignal = {
        signal: strategiesData.data?.compositeSignal || 'NEUTRAL',
        strength: strategiesData.data?.compositeStrength || 0,
        confidence: strategiesData.data?.compositeConfidence || 0,
      };

      useStore.setState({ signals, compositeSignal });
      setLastSignal(signals[0] || null);

      if (!apiKeys.openai) {
        await logDecision('SKIP_AI_ANALYSIS', {
          reason: 'No OpenAI API key configured',
          coin: selectedCoin,
        });
        setLastAction('AI skipped: missing API key');
        return;
      }

      setAnalyzing(true);

      const aiResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          apiKey: apiKeys.openai,
          data: {
            coin: selectedCoin,
            candles,
            indicators: buildBasicIndicators(candles),
          },
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.data;

      setAnalysis(analysis);
      setAnalyzing(false);

      const finalCompositeSignal = {
        signal: compositeSignal.signal,
        strength: compositeSignal.strength,
        confidence: analysis?.confidence || compositeSignal.confidence || 0,
      };

      setCompositeSignal(finalCompositeSignal);

      const shouldTrade =
        finalCompositeSignal.confidence > 65 &&
        (finalCompositeSignal.signal === 'BUY' || finalCompositeSignal.signal === 'SELL');

      if (!shouldTrade) {
        await logDecision('NO_TRADE_SIGNAL', {
          confidence: finalCompositeSignal.confidence,
          signal: finalCompositeSignal.signal,
          threshold: 65,
          coin: selectedCoin,
        });
        return;
      }

      if (!apiKeys.hyperliquidPrivateKey || !apiKeys.hyperliquidWallet) {
        await logDecision('SKIP_TRADE_EXECUTION', {
          reason: 'Missing Hyperliquid credentials',
          coin: selectedCoin,
        });
        setLastAction('Trade skipped: missing Hyperliquid credentials');
        return;
      }

      const openPositionCount = positions.length;
      if (openPositionCount >= riskSettings.maxOpenPositions) {
        await logDecision('MAX_POSITIONS_REACHED', {
          current: openPositionCount,
          max: riskSettings.maxOpenPositions,
          coin: selectedCoin,
        });
        return;
      }

      const isBuy = finalCompositeSignal.signal === 'BUY';
      const currentPrice = candles[candles.length - 1]?.close || 0;
      const notionalSize = Math.min(accountBalance || 0, riskSettings.maxPositionSize);

      if (!currentPrice || notionalSize <= 0) {
        await logDecision('SKIP_TRADE_EXECUTION', {
          reason: 'Invalid current price or position size',
          currentPrice,
          notionalSize,
          coin: selectedCoin,
        });
        return;
      }

      const size = Number((notionalSize / currentPrice).toFixed(6));
      const stopLoss = currentPrice * (isBuy ? 1 - riskSettings.stopLossPercent / 100 : 1 + riskSettings.stopLossPercent / 100);
      const takeProfit = currentPrice * (isBuy ? 1 + riskSettings.takeProfitPercent / 100 : 1 - riskSettings.takeProfitPercent / 100);

      const tradeResponse = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place',
          wallet: apiKeys.hyperliquidWallet,
          privateKey: apiKeys.hyperliquidPrivateKey,
          isTestnet,
          riskConfig: {
            maxPositionSize: riskSettings.maxPositionSize,
            maxLeverage: 1,
            stopLossRequired: true,
          },
          coin: selectedCoin,
          isBuy,
          size,
          price: currentPrice,
          orderType: 'Limit',
          reduceOnly: false,
          stopLoss,
          leverage: 1,
        }),
      });

      if (!tradeResponse.ok) {
        throw new Error(`Trade execution failed: ${tradeResponse.statusText}`);
      }

      const tradeData = await tradeResponse.json();
      addTrade({
        coin: selectedCoin,
        direction: isBuy ? 'LONG' : 'SHORT',
        entryPrice: currentPrice,
        stopLoss,
        takeProfits: [takeProfit],
        size,
        leverage: 1,
        thesis: analysis?.recommendationReason || 'Composite strategy signal',
        strategySignals: signals.map((s) => s.strategy),
        status: 'open',
        timestamp: Date.now(),
        id: tradeData.data?.response?.data?.orderId?.toString?.() || undefined,
      });

      setLastAction(`TRADE_EXECUTED: ${isBuy ? 'LONG' : 'SHORT'} ${size} ${selectedCoin} @ ${currentPrice}`);

      await logDecision('TRADE_EXECUTED', {
        coin: selectedCoin,
        direction: isBuy ? 'LONG' : 'SHORT',
        size,
        entryPrice: currentPrice,
        stopLoss,
        takeProfit,
        confidence: finalCompositeSignal.confidence,
        signal: finalCompositeSignal.signal,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setLastAction(`ERROR: ${errorMessage}`);
      console.error('[AutoTrader] Analysis loop error:', err);
      await logDecision('ANALYSIS_LOOP_ERROR', {
        error: errorMessage,
        coin: selectedCoin,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleAutoTrading = (enabled: boolean) => {
    toggleAutoTradingStore(enabled);

    if (enabled) {
      void logDecision('AUTO_TRADING_ENABLED', {
        coin: selectedCoin,
        riskSettings,
      });
    } else {
      void logDecision('AUTO_TRADING_DISABLED', {
        coin: selectedCoin,
      });
    }
  };

  useEffect(() => {
    if (!isAutoTrading) {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      return;
    }

    void runAnalysisLoop();

    loopIntervalRef.current = setInterval(() => {
      void runAnalysisLoop();
    }, 30000);

    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
      }
    };
  }, [isAutoTrading, selectedCoin, candles, positions, riskSettings, accountBalance, isTestnet, apiKeys]);

  return {
    isRunning: isAutoTrading,
    lastSignal,
    lastAction,
    toggleAutoTrading: handleToggleAutoTrading,
  };
}
