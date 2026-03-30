/**
 * MACD (Moving Average Convergence Divergence) Trading Strategy
 * Identifies trend changes and momentum
 */

import { CandleData, StrategySignal } from './types';
import { calculateMACD, calculateMACDArray } from './math-helpers';

const ZERO_LINE_PROXIMITY = 0.0001; // Consider as crossing zero line within this threshold

export interface MACDConfig {
  fastEMA: number; // Default 12
  slowEMA: number; // Default 26
  signalEMA: number; // Default 9
  useZeroLineCrossover: boolean;
}

/**
 * Check if MACD just crossed above signal line (bullish crossover)
 * @param macdArray Array of MACD values
 * @returns true if bullish crossover detected
 */
function isBullishCrossover(
  macdArray: Array<{ macd: number | null; signal: number | null; histogram: number | null }>
): boolean {
  if (macdArray.length < 2) return false;

  const prev = macdArray[macdArray.length - 2];
  const curr = macdArray[macdArray.length - 1];

  if (prev.macd === null || prev.signal === null || curr.macd === null || curr.signal === null) {
    return false;
  }

  // Previous histogram was negative, current is positive (or crossing)
  return prev.macd <= prev.signal && curr.macd > curr.signal;
}

/**
 * Check if MACD just crossed below signal line (bearish crossover)
 * @param macdArray Array of MACD values
 * @returns true if bearish crossover detected
 */
function isBearishCrossover(
  macdArray: Array<{ macd: number | null; signal: number | null; histogram: number | null }>
): boolean {
  if (macdArray.length < 2) return false;

  const prev = macdArray[macdArray.length - 2];
  const curr = macdArray[macdArray.length - 1];

  if (prev.macd === null || prev.signal === null || curr.macd === null || curr.signal === null) {
    return false;
  }

  // Previous histogram was positive, current is negative (or crossing)
  return prev.macd >= prev.signal && curr.macd < curr.signal;
}

/**
 * Check if MACD crossed above zero line (bullish)
 * @param macdArray Array of MACD values
 * @returns true if zero line crossover detected
 */
function isBullishZeroCrossover(
  macdArray: Array<{ macd: number | null; signal: number | null; histogram: number | null }>
): boolean {
  if (macdArray.length < 2) return false;

  const prev = macdArray[macdArray.length - 2];
  const curr = macdArray[macdArray.length - 1];

  if (prev.macd === null || curr.macd === null) return false;

  return prev.macd <= ZERO_LINE_PROXIMITY && curr.macd > ZERO_LINE_PROXIMITY;
}

/**
 * Check if MACD crossed below zero line (bearish)
 * @param macdArray Array of MACD values
 * @returns true if zero line crossover detected
 */
function isBearishZeroCrossover(
  macdArray: Array<{ macd: number | null; signal: number | null; histogram: number | null }>
): boolean {
  if (macdArray.length < 2) return false;

  const prev = macdArray[macdArray.length - 2];
  const curr = macdArray[macdArray.length - 1];

  if (prev.macd === null || curr.macd === null) return false;

  return prev.macd >= -ZERO_LINE_PROXIMITY && curr.macd < -ZERO_LINE_PROXIMITY;
}

/**
 * Calculate histogram momentum (how fast it's changing)
 * @param macdArray Array of MACD values
 * @param period Number of candles to look back
 * @returns momentum value or null
 */
function getHistogramMomentum(
  macdArray: Array<{ macd: number | null; signal: number | null; histogram: number | null }>,
  period: number = 3
): number | null {
  if (macdArray.length < period) return null;

  const recent = macdArray.slice(-period);
  const histograms = recent.map((m) => m.histogram).filter((h) => h !== null) as number[];

  if (histograms.length < 2) return null;

  // Calculate rate of change of histogram
  return histograms[histograms.length - 1] - histograms[0];
}

/**
 * Analyze MACD and generate trading signals
 * @param candles Array of candle data
 * @param config MACD configuration
 * @returns Trading signal
 */
export function analyzeMACD(candles: CandleData[], config?: Partial<MACDConfig>): StrategySignal {
  const settings: MACDConfig = {
    fastEMA: config?.fastEMA ?? 12,
    slowEMA: config?.slowEMA ?? 26,
    signalEMA: config?.signalEMA ?? 9,
    useZeroLineCrossover: config?.useZeroLineCrossover ?? true,
  };

  const timestamp = candles[candles.length - 1].timestamp;
  const closes = candles.map((c) => c.close);

  // Calculate MACD for all candles to detect crossovers
  const macdArray = calculateMACDArray(closes);
  const currentMACD = macdArray[macdArray.length - 1];

  if (
    currentMACD.macd === null ||
    currentMACD.signal === null ||
    currentMACD.histogram === null
  ) {
    return {
      strategy: 'MACD',
      signal: 'HOLD',
      strength: 0,
      confidence: 0,
      reason: 'Insufficient data for MACD calculation',
      timestamp,
      indicators: {},
    };
  }

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;
  let confidence = 0;
  let reason = '';

  const bullishCrossover = isBullishCrossover(macdArray);
  const bearishCrossover = isBearishCrossover(macdArray);
  const bullishZeroCross = settings.useZeroLineCrossover && isBullishZeroCrossover(macdArray);
  const bearishZeroCross = settings.useZeroLineCrossover && isBearishZeroCrossover(macdArray);
  const histogramMomentum = getHistogramMomentum(macdArray);

  if (bullishCrossover) {
    signal = 'BUY';
    strength = 70;
    confidence = 75;
    reason = 'MACD bullish crossover (MACD > Signal)';

    // Add strength if zero line crossover also occurred
    if (bullishZeroCross) {
      strength = Math.min(100, strength + 15);
      confidence = Math.min(100, confidence + 15);
      reason += ' and zero line crossover';
    }

    // Add strength if histogram momentum is strong
    if (histogramMomentum !== null && histogramMomentum > 0) {
      const momentumBoost = Math.min(15, histogramMomentum * 100);
      strength = Math.min(100, strength + momentumBoost);
      confidence = Math.min(100, confidence + 10);
    }
  } else if (bearishCrossover) {
    signal = 'SELL';
    strength = 70;
    confidence = 75;
    reason = 'MACD bearish crossover (MACD < Signal)';

    // Add strength if zero line crossover also occurred
    if (bearishZeroCross) {
      strength = Math.min(100, strength + 15);
      confidence = Math.min(100, confidence + 15);
      reason += ' and zero line crossover';
    }

    // Add strength if histogram momentum is strong
    if (histogramMomentum !== null && histogramMomentum < 0) {
      const momentumBoost = Math.min(15, Math.abs(histogramMomentum) * 100);
      strength = Math.min(100, strength + momentumBoost);
      confidence = Math.min(100, confidence + 10);
    }
  } else if (bullishZeroCross) {
    signal = 'BUY';
    strength = 55;
    confidence = 60;
    reason = 'MACD bullish zero line crossover';
  } else if (bearishZeroCross) {
    signal = 'SELL';
    strength = 55;
    confidence = 60;
    reason = 'MACD bearish zero line crossover';
  } else {
    // No crossover, but we can assess trend strength
    if (currentMACD.macd > currentMACD.signal) {
      signal = 'BUY';
      // Strength based on histogram magnitude
      const histogramPercent = Math.abs(currentMACD.histogram) * 1000;
      strength = Math.min(50, histogramPercent);
      confidence = 45;
      reason = `MACD above signal line (no crossover), histogram: ${currentMACD.histogram.toFixed(6)}`;
    } else if (currentMACD.macd < currentMACD.signal) {
      signal = 'SELL';
      const histogramPercent = Math.abs(currentMACD.histogram) * 1000;
      strength = Math.min(50, histogramPercent);
      confidence = 45;
      reason = `MACD below signal line (no crossover), histogram: ${currentMACD.histogram.toFixed(6)}`;
    } else {
      reason = 'MACD neutral';
    }
  }

  return {
    strategy: 'MACD',
    signal,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    reason,
    timestamp,
    indicators: {
      macd: Math.round(currentMACD.macd * 1000000) / 1000000,
      signal: Math.round(currentMACD.signal * 1000000) / 1000000,
      histogram: Math.round(currentMACD.histogram * 1000000) / 1000000,
    },
  };
}
