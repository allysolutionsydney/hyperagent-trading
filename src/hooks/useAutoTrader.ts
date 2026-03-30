import { useEffect, useRef, useState } from 'react';
import { useStore } from './useStore';
import { Signal } from '../types';

interface UseAutoTraderReturn {
  isRunning: boolean;
  lastSignal: Signal | null;
  lastAction: string | null;
  toggleAutoTrading: (enabled: boolean) => void;
}

/**
 * Custom hook for automated trading
 * When enabled, runs analysis loop every 30 seconds
 * Fetches candles -> runs strategies -> gets AI analysis -> executes trades
 * Respects risk settings and logs all decisions
 */
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
    addOrder,
    addTrade,
    isTestnet,
  } = useStore();

  /**
   * Logs trading decisions to console and optionally to backend
   */
  const logDecision = async (decision: string, details: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, decision, details };
    console.log('[AutoTrader]', logEntry);

    // Optionally send to backend for persistent logging
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

  /**
   * Runs the complete analysis loop
   * Fetches data -> analyzes -> generates signals -> determines trades
   */
  const runAnalysisLoop = async () => {
    try {
      if (!candles || candles.length === 0) {
        logDecision('SKIP_ANALYSIS', {
          reason: 'No candle data available',
          coin: selectedCoin,
        });
        return;
      }

      // Step 1: Run all enabled strategies
      const strategiesResponse = await fetch(
        `/api/strategies/analyze?coin=${selectedCoin}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candles,
            testnet: isTestnet,
          }),
        }
      );

      if (!strategiesResponse.ok) {
        throw new Error(`Strategy analysis failed: ${strategiesResponse.statusText}`);
      }

      const strategiesData = await strategiesResponse.json();
      const signals: Signal[] = strategiesData.data?.signals || [];

      // Update signals in store
      useStore.setState({ signals });

      // Step 2: Get AI analysis
      setAnalyzing(true);

      const aiResponse = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin: selectedCoin,
          candles,
          signals,
          currentPrice:
            candles.length > 0 ? candles[candles.length - 1].close : 0,
          testnet: isTestnet,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.data;

      setAnalysis(analysis);
      setAnalyzing(false);

      // Step 3: Compute composite signal
      const compositeSignal = {
        signal:
          signals.length > 0
            ? signals[0].type
            : ('NEUTRAL' as
                | 'STRONG_BUY'
                | 'BUY'
                | 'NEUTRAL'
                | 'SELL'
                | 'STRONG_SELL'),
        strength:
          signals.length > 0
            ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
            : 0,
        confidence: analysis?.confidence || 0,
      };

      useStore.setState({ compositeSignal });
      setLastSignal(signals[0] || null);

      // Step 4: Determine if we should trade
      const shouldTrade =
        compositeSignal.confidence > 0.65 &&
        (compositeSignal.signal === 'STRONG_BUY' ||
          compositeSignal.signal === 'STRONG_SELL');

      if (!shouldTrade) {
        logDecision('NO_TRADE_SIGNAL', {
          confidence: compositeSignal.confidence,
          signal: compositeSignal.signal,
          threshold: 0.65,
          coin: selectedCoin,
        });
        return;
      }

      // Step 5: Check risk constraints
      const currentLongPositions = positions.filter((p) => p.size > 0);
      const currentShortPositions = positions.filter((p) => p.size < 0);

      if (
        currentLongPositions.length + currentShortPositions.length >=
        riskSettings.maxOpenPositions
      ) {
        logDecision('MAX_POSITIONS_REACHED', {
          current:
            currentLongPositions.length + currentShortPositions.length,
          max: riskSettings.maxOpenPositions,
          coin: selectedCoin,
        });
        return;
      }

      // Step 6: Execute trade
      const isLong = compositeSignal.signal.includes('BUY');
      const riskAmount = accountBalance * (riskSettings.maxPositionSize / 100);
      const positionSize = Math.min(
        riskAmount,
        riskSettings.maxPositionSize
      );

      const currentPrice =
        candles.length > 0 ? candles[candles.length - 1].close : 0;
      const stopLoss =
        currentPrice *
        (isLong
          ? 1 - riskSettings.stopLossPercent / 100
          : 1 + riskSettings.stopLossPercent / 100);
      const takeProfit =
        currentPrice *
        (isLong
          ? 1 + riskSettings.takeProfitPercent / 100
          : 1 - riskSettings.takeProfitPercent / 100);

      const tradeResponse = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin: selectedCoin,
          direction: isLong ? 'LONG' : 'SHORT',
          positionSize,
          currentPrice,
          stopLoss,
          takeProfits: [takeProfit],
          leverage: 1,
          thesis: analysis?.recommendationReason || 'AI recommendation',
          strategySignals: signals.map((s) => s.strategy),
          testnet: isTestnet,
        }),
      });

      if (!tradeResponse.ok) {
        throw new Error(`Trade execution failed: ${tradeResponse.statusText}`);
      }

      const tradeData = await tradeResponse.json();
      const trade = tradeData.data;

      // Add to store
      addTrade(trade);

      setLastAction(
        `TRADE_EXECUTED: ${isLong ? 'LONG' : 'SHORT'} ${positionSize} @ ${currentPrice}`
      );

      logDecision('TRADE_EXECUTED', {
        coin: selectedCoin,
        direction: isLong ? 'LONG' : 'SHORT',
        positionSize,
        entryPrice: currentPrice,
        stopLoss,
        takeProfit,
        confidence: compositeSignal.confidence,
        signal: compositeSignal.signal,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setLastAction(`ERROR: ${errorMessage}`);
      console.error('[AutoTrader] Analysis loop error:', err);
      logDecision('ANALYSIS_LOOP_ERROR', {
        error: errorMessage,
        coin: selectedCoin,
      });
    }
  };

  /**
   * Toggle auto-trading on/off
   */
  const handleToggleAutoTrading = (enabled: boolean) => {
    toggleAutoTradingStore(enabled);

    if (enabled) {
      logDecision('AUTO_TRADING_ENABLED', {
        coin: selectedCoin,
        riskSettings,
      });
    } else {
      logDecision('AUTO_TRADING_DISABLED', {
        coin: selectedCoin,
      });
    }
  };

  // Set up analysis loop interval
  useEffect(() => {
    if (!isAutoTrading) {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      return;
    }

    // Initial run
    runAnalysisLoop();

    // Set up interval for subsequent runs (every 30 seconds)
    loopIntervalRef.current = setInterval(() => {
      runAnalysisLoop();
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
      }
    };
  }, [isAutoTrading, selectedCoin, candles, positions, riskSettings]);

  return {
    isRunning: isAutoTrading,
    lastSignal,
    lastAction,
    toggleAutoTrading: handleToggleAutoTrading,
  };
}
