/**
 * RSI (Relative Strength Index) Trading Strategy
 * Identifies overbought/oversold conditions and divergences
 */

import { CandleData, StrategySignal } from './types';
import { calculateRSI, calculateRSIArray, isLowerLow, isHigherLow } from './math-helpers';

const DEFAULT_PERIOD = 14;
const OVERSOLD_THRESHOLD = 30;
const OVERBOUGHT_THRESHOLD = 70;
const DIVERGENCE_LOOKBACK = 5;

export interface RSIConfig {
  period: number;
  oversoldThreshold: number;
  overboughtThreshold: number;
  useDivergence: boolean;
}

/**
 * Check for bullish divergence (price lower low, RSI higher low)
 * @param lows Array of low prices
 * @param rsis Array of RSI values
 * @param lookback Number of candles to check
 * @returns true if bullish divergence detected
 */
function detectBullishDivergence(lows: number[], rsis: (number | null)[], lookback: number = DIVERGENCE_LOOKBACK): boolean {
  if (lows.length < lookback + 1 || rsis.length < lookback + 1) return false;

  // Find the lowest low in the lookback period
  const recentLows = lows.slice(-lookback - 1);
  const minLowIndex = recentLows.indexOf(Math.min(...recentLows));

  if (minLowIndex === -1 || minLowIndex === recentLows.length - 1) return false;

  const previousMinLowIndex = recentLows.slice(0, minLowIndex).lastIndexOf(Math.min(...recentLows.slice(0, minLowIndex)));

  if (previousMinLowIndex === -1) return false;

  const currentLowIndex = recentLows.length - 1;
  const currentRSI = rsis[rsis.length - 1];
  const previousMinRSI = rsis[rsis.length - 1 - (recentLows.length - 1 - minLowIndex)];

  if (currentRSI === null || previousMinRSI === null) return false;

  // Bullish divergence: price makes lower low, but RSI makes higher low
  return recentLows[currentLowIndex] < recentLows[minLowIndex] && currentRSI > previousMinRSI;
}

/**
 * Check for bearish divergence (price higher high, RSI lower high)
 * @param highs Array of high prices
 * @param rsis Array of RSI values
 * @param lookback Number of candles to check
 * @returns true if bearish divergence detected
 */
function detectBearishDivergence(highs: number[], rsis: (number | null)[], lookback: number = DIVERGENCE_LOOKBACK): boolean {
  if (highs.length < lookback + 1 || rsis.length < lookback + 1) return false;

  // Find the highest high in the lookback period
  const recentHighs = highs.slice(-lookback - 1);
  const maxHighIndex = recentHighs.indexOf(Math.max(...recentHighs));

  if (maxHighIndex === -1 || maxHighIndex === recentHighs.length - 1) return false;

  const currentHighIndex = recentHighs.length - 1;
  const currentRSI = rsis[rsis.length - 1];
  const previousMaxRSI = rsis[rsis.length - 1 - (recentHighs.length - 1 - maxHighIndex)];

  if (currentRSI === null || previousMaxRSI === null) return false;

  // Bearish divergence: price makes higher high, but RSI makes lower high
  return recentHighs[currentHighIndex] > recentHighs[maxHighIndex] && currentRSI < previousMaxRSI;
}

/**
 * Analyze RSI and generate trading signals
 * @param candles Array of candle data
 * @param config RSI configuration
 * @returns Trading signal
 */
export function analyzeRSI(candles: CandleData[], config?: Partial<RSIConfig>): StrategySignal {
  const settings: RSIConfig = {
    period: config?.period ?? DEFAULT_PERIOD,
    oversoldThreshold: config?.oversoldThreshold ?? OVERSOLD_THRESHOLD,
    overboughtThreshold: config?.overboughtThreshold ?? OVERBOUGHT_THRESHOLD,
    useDivergence: config?.useDivergence ?? true,
  };

  const timestamp = candles[candles.length - 1].timestamp;
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const currentRSI = calculateRSI(closes, settings.period);

  if (currentRSI === null) {
    return {
      strategy: 'RSI',
      signal: 'HOLD',
      strength: 0,
      confidence: 0,
      reason: 'Insufficient data for RSI calculation',
      timestamp,
      indicators: {},
    };
  }

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;
  let confidence = 0;
  let reason = '';

  // Calculate signal strength based on how extreme RSI is
  if (currentRSI < settings.oversoldThreshold) {
    signal = 'BUY';
    // Strength increases as RSI gets more oversold (closer to 0)
    strength = Math.max(0, Math.min(100, (settings.oversoldThreshold - currentRSI) * 3));
    confidence = 60 + Math.min(40, (settings.oversoldThreshold - currentRSI) * 2);

    // Check for bullish divergence for extra confirmation
    if (settings.useDivergence) {
      const rsiArray = calculateRSIArray(closes, settings.period);
      if (detectBullishDivergence(lows, rsiArray)) {
        reason = `RSI oversold at ${currentRSI.toFixed(2)} with bullish divergence detected`;
        strength = Math.min(100, strength + 20);
        confidence = Math.min(100, confidence + 20);
      } else {
        reason = `RSI oversold at ${currentRSI.toFixed(2)}`;
      }
    } else {
      reason = `RSI oversold at ${currentRSI.toFixed(2)}`;
    }
  } else if (currentRSI > settings.overboughtThreshold) {
    signal = 'SELL';
    // Strength increases as RSI gets more overbought (closer to 100)
    strength = Math.max(0, Math.min(100, (currentRSI - settings.overboughtThreshold) * 3));
    confidence = 60 + Math.min(40, (currentRSI - settings.overboughtThreshold) * 2);

    // Check for bearish divergence for extra confirmation
    if (settings.useDivergence) {
      const rsiArray = calculateRSIArray(closes, settings.period);
      if (detectBearishDivergence(highs, rsiArray)) {
        reason = `RSI overbought at ${currentRSI.toFixed(2)} with bearish divergence detected`;
        strength = Math.min(100, strength + 20);
        confidence = Math.min(100, confidence + 20);
      } else {
        reason = `RSI overbought at ${currentRSI.toFixed(2)}`;
      }
    } else {
      reason = `RSI overbought at ${currentRSI.toFixed(2)}`;
    }
  } else {
    reason = `RSI neutral at ${currentRSI.toFixed(2)}`;
  }

  return {
    strategy: 'RSI',
    signal,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    reason,
    timestamp,
    indicators: {
      rsi: Math.round(currentRSI * 100) / 100,
      oversoldThreshold: settings.oversoldThreshold,
      overboughtThreshold: settings.overboughtThreshold,
    },
  };
}
