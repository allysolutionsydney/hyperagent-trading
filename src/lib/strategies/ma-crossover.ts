/**
 * Moving Average Crossover Trading Strategy
 * Identifies trend changes and momentum
 */

import { CandleData, StrategySignal } from './types';
import { calculateEMA, calculateSMA, calculateEMAArray } from './math-helpers';

const SHORT_EMA_PERIOD = 9;
const LONG_EMA_PERIOD = 21;
const TREND_SMA_SHORT = 50;
const TREND_SMA_LONG = 200;

export interface MAConfig {
  shortEMA: number; // Default 9
  longEMA: number; // Default 21
  useTrendContext: boolean; // Use 50/200 SMA for trend
  trendSMAShort: number; // Default 50
  trendSMALong: number; // Default 200
}

/**
 * Determine overall trend based on price and moving averages
 * 'uptrend' | 'downtrend' | 'neutral'
 * @param price Current price
 * @param sma50 50-period SMA
 * @param sma200 200-period SMA
 * @returns Trend direction
 */
function getTrendContext(price: number, sma50: number | null, sma200: number | null): 'uptrend' | 'downtrend' | 'neutral' {
  if (sma50 === null || sma200 === null) return 'neutral';

  if (price > sma50 && sma50 > sma200) {
    return 'uptrend';
  } else if (price < sma50 && sma50 < sma200) {
    return 'downtrend';
  } else {
    return 'neutral';
  }
}

/**
 * Check if short EMA just crossed above long EMA (golden cross)
 * @param shortEMAArray Array of short EMA values
 * @param longEMAArray Array of long EMA values
 * @returns true if golden cross detected
 */
function isGoldenCross(
  shortEMAArray: (number | null)[],
  longEMAArray: (number | null)[]
): boolean {
  if (shortEMAArray.length < 2 || longEMAArray.length < 2) return false;

  const prevShort = shortEMAArray[shortEMAArray.length - 2];
  const currShort = shortEMAArray[shortEMAArray.length - 1];
  const prevLong = longEMAArray[longEMAArray.length - 2];
  const currLong = longEMAArray[longEMAArray.length - 1];

  if (prevShort === null || currShort === null || prevLong === null || currLong === null) {
    return false;
  }

  return prevShort <= prevLong && currShort > currLong;
}

/**
 * Check if short EMA just crossed below long EMA (death cross)
 * @param shortEMAArray Array of short EMA values
 * @param longEMAArray Array of long EMA values
 * @returns true if death cross detected
 */
function isDeathCross(
  shortEMAArray: (number | null)[],
  longEMAArray: (number | null)[]
): boolean {
  if (shortEMAArray.length < 2 || longEMAArray.length < 2) return false;

  const prevShort = shortEMAArray[shortEMAArray.length - 2];
  const currShort = shortEMAArray[shortEMAArray.length - 1];
  const prevLong = longEMAArray[longEMAArray.length - 2];
  const currLong = longEMAArray[longEMAArray.length - 1];

  if (prevShort === null || currShort === null || prevLong === null || currLong === null) {
    return false;
  }

  return prevShort >= prevLong && currShort < currLong;
}

/**
 * Calculate spread between two moving averages as percentage
 * @param short Short MA value
 * @param long Long MA value
 * @returns Percentage spread or null
 */
function getMAsSpread(short: number | null, long: number | null): number | null {
  if (short === null || long === null || long === 0) return null;
  return ((short - long) / long) * 100;
}

/**
 * Analyze Moving Average Crossover and generate trading signals
 * @param candles Array of candle data
 * @param config MA configuration
 * @returns Trading signal
 */
export function analyzeMAcrossover(
  candles: CandleData[],
  config?: Partial<MAConfig>
): StrategySignal {
  const settings: MAConfig = {
    shortEMA: config?.shortEMA ?? SHORT_EMA_PERIOD,
    longEMA: config?.longEMA ?? LONG_EMA_PERIOD,
    useTrendContext: config?.useTrendContext ?? true,
    trendSMAShort: config?.trendSMAShort ?? TREND_SMA_SHORT,
    trendSMALong: config?.trendSMALong ?? TREND_SMA_LONG,
  };

  const timestamp = candles[candles.length - 1].timestamp;
  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];

  // Calculate short and long EMAs
  const shortEMAArray = calculateEMAArray(closes, settings.shortEMA);
  const longEMAArray = calculateEMAArray(closes, settings.longEMA);

  const currShortEMA = shortEMAArray[shortEMAArray.length - 1];
  const currLongEMA = longEMAArray[longEMAArray.length - 1];

  if (currShortEMA === null || currLongEMA === null) {
    return {
      strategy: 'MAcrossover',
      signal: 'HOLD',
      strength: 0,
      confidence: 0,
      reason: 'Insufficient data for MA calculation',
      timestamp,
      indicators: {},
    };
  }

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;
  let confidence = 0;
  let reason = '';

  // Check for crossovers
  const goldenCross = isGoldenCross(shortEMAArray, longEMAArray);
  const deathCross = isDeathCross(shortEMAArray, longEMAArray);

  // Get trend context if enabled
  let trendContext: 'uptrend' | 'downtrend' | 'neutral' = 'neutral';
  let sma50: number | null = null;
  let sma200: number | null = null;

  if (settings.useTrendContext) {
    sma50 = calculateSMA(closes, settings.trendSMAShort);
    sma200 = calculateSMA(closes, settings.trendSMALong);
    trendContext = getTrendContext(currentPrice, sma50, sma200);
  }

  const maSpread = getMAsSpread(currShortEMA, currLongEMA);

  if (goldenCross) {
    signal = 'BUY';
    strength = 75;
    confidence = 80;
    reason = `Golden Cross: ${settings.shortEMA}-EMA crossed above ${settings.longEMA}-EMA`;

    // Add strength if trend context is bullish
    if (trendContext === 'uptrend') {
      strength = Math.min(100, strength + 15);
      confidence = Math.min(100, confidence + 15);
      reason += '. Trend context: Uptrend.';
    } else if (trendContext === 'neutral') {
      reason += '. Trend context: Neutral.';
    }
  } else if (deathCross) {
    signal = 'SELL';
    strength = 75;
    confidence = 80;
    reason = `Death Cross: ${settings.shortEMA}-EMA crossed below ${settings.longEMA}-EMA`;

    // Add strength if trend context is bearish
    if (trendContext === 'downtrend') {
      strength = Math.min(100, strength + 15);
      confidence = Math.min(100, confidence + 15);
      reason += '. Trend context: Downtrend.';
    } else if (trendContext === 'neutral') {
      reason += '. Trend context: Neutral.';
    }
  } else {
    // No crossover - assess current position
    if (currShortEMA > currLongEMA) {
      signal = 'BUY';

      // Strength based on spread between EMAs
      if (maSpread !== null) {
        strength = Math.min(60, Math.abs(maSpread) * 10);
      } else {
        strength = 40;
      }

      confidence = 55;
      reason = `${settings.shortEMA}-EMA above ${settings.longEMA}-EMA. Bullish alignment.`;

      // Enhance with trend context
      if (trendContext === 'uptrend') {
        confidence = Math.min(100, confidence + 20);
        reason += ` Trend context: Uptrend.`;
      }
    } else if (currShortEMA < currLongEMA) {
      signal = 'SELL';

      // Strength based on spread between EMAs
      if (maSpread !== null) {
        strength = Math.min(60, Math.abs(maSpread) * 10);
      } else {
        strength = 40;
      }

      confidence = 55;
      reason = `${settings.shortEMA}-EMA below ${settings.longEMA}-EMA. Bearish alignment.`;

      // Enhance with trend context
      if (trendContext === 'downtrend') {
        confidence = Math.min(100, confidence + 20);
        reason += ` Trend context: Downtrend.`;
      }
    } else {
      reason = `MAs aligned - no clear signal.`;
    }
  }

  // Build indicators object
  const indicators: Record<string, number> = {
    shortEMA: Math.round(currShortEMA * 1000000) / 1000000,
    longEMA: Math.round(currLongEMA * 1000000) / 1000000,
  };

  if (maSpread !== null) {
    indicators.maSpreadPercent = Math.round(maSpread * 100) / 100;
  }

  if (settings.useTrendContext && sma50 !== null && sma200 !== null) {
    indicators.sma50 = Math.round(sma50 * 1000000) / 1000000;
    indicators.sma200 = Math.round(sma200 * 1000000) / 1000000;
  }

  return {
    strategy: 'MAcrossover',
    signal,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    reason,
    timestamp,
    indicators,
  };
}
