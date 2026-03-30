/**
 * Bollinger Bands Trading Strategy
 * Mean reversion and volatility analysis
 */

import { CandleData, StrategySignal } from './types';
import { calculateBollingerBandsArray, calculateSMA } from './math-helpers';

export interface BollingerConfig {
  period: number; // Default 20
  stdDev: number; // Default 2
  useBandSqueeze: boolean;
}

/**
 * Calculate band width (upper - lower)
 * @param upper Upper band
 * @param lower Lower band
 * @returns Band width
 */
function getBandWidth(upper: number | null, lower: number | null): number | null {
  if (upper === null || lower === null) return null;
  return upper - lower;
}

/**
 * Calculate band position (where price is between bands)
 * 0 = at lower band, 1 = at upper band
 * @param price Current price
 * @param upper Upper band
 * @param lower Lower band
 * @returns Band position or null
 */
function getBandPosition(price: number, upper: number | null, lower: number | null): number | null {
  if (upper === null || lower === null) return null;
  const bandWidth = upper - lower;
  if (bandWidth === 0) return null;
  return (price - lower) / bandWidth;
}

/**
 * Detect band squeeze (low volatility)
 * Compare current band width with average of recent band widths
 * @param bandsArray Array of Bollinger Band objects
 * @param lookback Period to average
 * @param squeezeFactor Threshold for squeeze (default 0.5 = 50% of average)
 * @returns true if band squeeze detected
 */
function isBandSqueeze(
  bandsArray: Array<{ upper: number | null; middle: number | null; lower: number | null }>,
  lookback: number = 20,
  squeezeFactor: number = 0.5
): boolean {
  if (bandsArray.length < lookback) return false;

  const recent = bandsArray.slice(-lookback);
  const widths = recent.map((b) => getBandWidth(b.upper, b.lower)).filter((w) => w !== null) as number[];

  if (widths.length < lookback) return false;

  const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
  const currentWidth = getBandWidth(recent[recent.length - 1].upper, recent[recent.length - 1].lower);

  if (currentWidth === null) return false;

  return currentWidth < avgWidth * squeezeFactor;
}

/**
 * Check if price is touching/breaking the bands
 * @param price Current price
 * @param upper Upper band
 * @param lower Lower band
 * @param sensitivity How close to band counts as touching (default 0.02 = 2%)
 * @returns 'upper' | 'lower' | 'none'
 */
function checkBandTouch(
  price: number,
  upper: number | null,
  lower: number | null,
  sensitivity: number = 0.02
): 'upper' | 'lower' | 'none' {
  if (upper === null || lower === null) return 'none';

  const bandWidth = upper - lower;
  const touchThreshold = bandWidth * sensitivity;

  if (price >= upper - touchThreshold) {
    return 'upper';
  }

  if (price <= lower + touchThreshold) {
    return 'lower';
  }

  return 'none';
}

/**
 * Analyze Bollinger Bands and generate trading signals
 * @param candles Array of candle data
 * @param config Bollinger Bands configuration
 * @returns Trading signal
 */
export function analyzeBollingerBands(
  candles: CandleData[],
  config?: Partial<BollingerConfig>
): StrategySignal {
  const settings: BollingerConfig = {
    period: config?.period ?? 20,
    stdDev: config?.stdDev ?? 2,
    useBandSqueeze: config?.useBandSqueeze ?? true,
  };

  const timestamp = candles[candles.length - 1].timestamp;
  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];

  const bandsArray = calculateBollingerBandsArray(closes, settings.period, settings.stdDev);
  const currentBands = bandsArray[bandsArray.length - 1];

  if (currentBands.upper === null || currentBands.lower === null || currentBands.middle === null) {
    return {
      strategy: 'BollingerBands',
      signal: 'HOLD',
      strength: 0,
      confidence: 0,
      reason: 'Insufficient data for Bollinger Bands calculation',
      timestamp,
      indicators: {},
    };
  }

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;
  let confidence = 0;
  let reason = '';

  const bandTouch = checkBandTouch(currentPrice, currentBands.upper, currentBands.lower);
  const bandPosition = getBandPosition(currentPrice, currentBands.upper, currentBands.lower);
  const squeeze = settings.useBandSqueeze && isBandSqueeze(bandsArray);

  if (bandTouch === 'lower') {
    signal = 'BUY';
    strength = 60;
    confidence = 65;
    reason = `Price touching/breaking lower Bollinger Band. Mean reversion signal.`;

    // More strength if price is below the band (more oversold)
    if (currentPrice < currentBands.lower) {
      strength = Math.min(100, strength + 20);
      confidence = Math.min(100, confidence + 15);
      reason += ` Price has broken below lower band (${currentPrice.toFixed(6)} < ${currentBands.lower.toFixed(6)}).`;
    }

    // More strength if band squeeze just ended
    if (squeeze) {
      reason += ` Band squeeze detected - potential volatility increase.`;
    }
  } else if (bandTouch === 'upper') {
    signal = 'SELL';
    strength = 60;
    confidence = 65;
    reason = `Price touching/breaking upper Bollinger Band. Mean reversion signal.`;

    // More strength if price is above the band (more overbought)
    if (currentPrice > currentBands.upper) {
      strength = Math.min(100, strength + 20);
      confidence = Math.min(100, confidence + 15);
      reason += ` Price has broken above upper band (${currentPrice.toFixed(6)} > ${currentBands.upper.toFixed(6)}).`;
    }

    // More strength if band squeeze just ended
    if (squeeze) {
      reason += ` Band squeeze detected - potential volatility increase.`;
    }
  } else if (bandPosition !== null && bandPosition < 0.3) {
    // Price in lower 30% of bands - slight mean reversion buy bias
    signal = 'BUY';
    strength = Math.round((0.3 - bandPosition) * 100); // Stronger as price gets closer to lower band
    confidence = 50;
    reason = `Price in lower 30% of Bollinger Bands. Slight mean reversion bias.`;

    if (squeeze) {
      confidence = 55;
      reason += ` Band squeeze - watch for volatility breakout.`;
    }
  } else if (bandPosition !== null && bandPosition > 0.7) {
    // Price in upper 30% of bands - slight mean reversion sell bias
    signal = 'SELL';
    strength = Math.round((bandPosition - 0.7) * 100); // Stronger as price gets closer to upper band
    confidence = 50;
    reason = `Price in upper 30% of Bollinger Bands. Slight mean reversion bias.`;

    if (squeeze) {
      confidence = 55;
      reason += ` Band squeeze - watch for volatility breakout.`;
    }
  } else {
    reason = `Price in middle of Bollinger Bands (no clear signal).`;

    if (squeeze) {
      signal = 'HOLD';
      strength = 40;
      confidence = 55;
      reason += ` Band squeeze detected - low volatility environment. Potential breakout imminent.`;
    } else {
      reason += ` Neutral price position.`;
    }
  }

  const bandWidth = getBandWidth(currentBands.upper, currentBands.lower);

  return {
    strategy: 'BollingerBands',
    signal,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    reason,
    timestamp,
    indicators: {
      upper: Math.round(currentBands.upper * 1000000) / 1000000,
      middle: Math.round(currentBands.middle * 1000000) / 1000000,
      lower: Math.round(currentBands.lower * 1000000) / 1000000,
      bandWidth: bandWidth ? Math.round(bandWidth * 1000000) / 1000000 : 0,
      bandPosition: bandPosition ? Math.round(bandPosition * 100) / 100 : 0,
      squeeze: squeeze ? 1 : 0,
    },
  };
}
