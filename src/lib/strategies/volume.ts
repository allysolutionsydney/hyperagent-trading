/**
 * Volume Analysis Trading Strategy
 * Detects volume spikes and confirms price movements
 */

import { CandleData, StrategySignal } from './types';
import { calculateSMA, calculateEMA } from './math-helpers';

export interface VolumeConfig {
  volumeMAPeriod: number; // Default 20
  volumeSpikeThreshold: number; // Default 2.0 (2x average)
  onBalanceVolumeEnabled: boolean;
}

/**
 * Calculate volume moving average
 * @param volumes Array of volumes
 * @param period MA period
 * @returns Volume MA or null
 */
function getVolumeMA(volumes: number[], period: number): number | null {
  return calculateSMA(volumes, period);
}

/**
 * Detect if volume is spiking above average
 * @param volumes Array of volumes
 * @param period MA period
 * @param threshold How many times the average (default 2.0)
 * @returns Spike ratio or null
 */
function getVolumeSpikeRatio(volumes: number[], period: number, threshold: number): number | null {
  if (volumes.length < period) return null;

  const ma = getVolumeMA(volumes, period);
  if (ma === null || ma === 0) return null;

  const currentVolume = volumes[volumes.length - 1];
  return currentVolume / ma;
}

/**
 * Calculate On-Balance Volume (OBV)
 * @param closes Array of close prices
 * @param volumes Array of volumes
 * @returns Array of OBV values
 */
function calculateOBVArray(closes: number[], volumes: number[]): number[] {
  if (closes.length !== volumes.length || closes.length === 0) return [];

  const obv: number[] = [0];

  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv.push(obv[i - 1] + volumes[i]);
    } else if (closes[i] < closes[i - 1]) {
      obv.push(obv[i - 1] - volumes[i]);
    } else {
      obv.push(obv[i - 1]);
    }
  }

  return obv;
}

/**
 * Detect if OBV is trending up
 * @param obvArray Array of OBV values
 * @param lookback Period to check
 * @returns true if OBV is making higher lows
 */
function isOBVTrendingUp(obvArray: number[], lookback: number = 5): boolean {
  if (obvArray.length < lookback) return false;

  const recent = obvArray.slice(-lookback);

  // Check if each OBV value is generally higher than previous
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] < recent[i - 1]) {
      // Allow some minor drops, but trend should be up overall
      const avgChange = (recent[recent.length - 1] - recent[0]) / (lookback - 1);
      return avgChange > 0;
    }
  }

  return true;
}

/**
 * Detect if OBV is trending down
 * @param obvArray Array of OBV values
 * @param lookback Period to check
 * @returns true if OBV is making lower highs
 */
function isOBVTrendingDown(obvArray: number[], lookback: number = 5): boolean {
  if (obvArray.length < lookback) return false;

  const recent = obvArray.slice(-lookback);

  // Check if each OBV value is generally lower than previous
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) {
      // Allow some minor increases, but trend should be down overall
      const avgChange = (recent[recent.length - 1] - recent[0]) / (lookback - 1);
      return avgChange < 0;
    }
  }

  return true;
}

/**
 * Detect climactic volume at resistance
 * Volume spike + price not moving much = exhaustion/reversal signal
 * @param candles Recent candles
 * @param volumeSpikeRatio Current spike ratio
 * @returns true if climactic volume detected
 */
function isClimaticVolume(candles: CandleData[], volumeSpikeRatio: number | null): boolean {
  if (volumeSpikeRatio === null || volumeSpikeRatio < 2.0) return false;

  if (candles.length < 2) return false;

  const currentCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  // Climactic volume: high volume but small price movement
  const priceRange = currentCandle.high - currentCandle.low;
  const priceChange = Math.abs(currentCandle.close - prevCandle.close);

  // If volume is high but price movement is minimal, it's climactic
  return priceRange < (prevCandle.high - prevCandle.low) * 0.5 && volumeSpikeRatio > 2.5;
}

/**
 * Analyze Volume and generate trading signals
 * @param candles Array of candle data
 * @param config Volume configuration
 * @returns Trading signal
 */
export function analyzeVolume(
  candles: CandleData[],
  config?: Partial<VolumeConfig>
): StrategySignal {
  const settings: VolumeConfig = {
    volumeMAPeriod: config?.volumeMAPeriod ?? 20,
    volumeSpikeThreshold: config?.volumeSpikeThreshold ?? 2.0,
    onBalanceVolumeEnabled: config?.onBalanceVolumeEnabled ?? true,
  };

  const timestamp = candles[candles.length - 1].timestamp;
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const currentPrice = closes[closes.length - 1];
  const prevPrice = closes.length > 1 ? closes[closes.length - 2] : currentPrice;

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;
  let confidence = 0;
  let reason = '';

  // Volume spike detection
  const volumeMA = getVolumeMA(volumes, settings.volumeMAPeriod);
  const volumeSpikeRatio = getVolumeSpikeRatio(volumes, settings.volumeMAPeriod, settings.volumeSpikeThreshold);

  const isVolumeSpiking = volumeSpikeRatio !== null && volumeSpikeRatio >= settings.volumeSpikeThreshold;

  if (isVolumeSpiking && volumeSpikeRatio !== null) {
    // Volume spike detected - direction matters
    if (currentPrice > prevPrice) {
      // Price up with volume spike = strong buy confirmation
      signal = 'BUY';
      strength = Math.min(100, 60 + (volumeSpikeRatio - 2) * 10);
      confidence = 75;
      reason = `High volume (${volumeSpikeRatio.toFixed(2)}x avg) + price increase = strong buying.`;

      // Check for climactic volume (reversal signal)
      if (isClimaticVolume(candles, volumeSpikeRatio)) {
        signal = 'SELL';
        strength = 70;
        confidence = 60;
        reason = `Climactic volume at resistance: High volume but minimal price movement = exhaustion/reversal signal.`;
      }
    } else if (currentPrice < prevPrice) {
      // Price down with volume spike = strong sell confirmation
      signal = 'SELL';
      strength = Math.min(100, 60 + (volumeSpikeRatio - 2) * 10);
      confidence = 75;
      reason = `High volume (${volumeSpikeRatio.toFixed(2)}x avg) + price decrease = strong selling.`;

      // Check for climactic volume (reversal signal)
      if (isClimaticVolume(candles, volumeSpikeRatio)) {
        signal = 'BUY';
        strength = 70;
        confidence = 60;
        reason = `Climactic volume at support: High volume but minimal price movement = exhaustion/reversal signal.`;
      }
    } else {
      // Volume spike but price unchanged - potential reversal
      reason = `High volume (${volumeSpikeRatio.toFixed(2)}x avg) but price unchanged. Indecision/potential reversal.`;
    }
  } else {
    reason = `Volume normal (${volumeSpikeRatio ? volumeSpikeRatio.toFixed(2) : '?'}x avg).`;
  }

  // OBV analysis for trend confirmation
  if (settings.onBalanceVolumeEnabled) {
    const obv = calculateOBVArray(closes, volumes);

    if (obv.length >= 5) {
      const obvTrendingUp = isOBVTrendingUp(obv);
      const obvTrendingDown = isOBVTrendingDown(obv);

      if (obvTrendingUp && signal === 'HOLD') {
        signal = 'BUY';
        strength = 40;
        confidence = 55;
        reason += ` OBV trending up - volume supporting upside.`;
      } else if (obvTrendingUp && (signal === 'BUY' || signal === 'HOLD')) {
        if (signal === 'HOLD') {
          signal = 'BUY';
          strength = 40;
          confidence = 55;
        } else {
          strength = Math.min(100, strength + 15);
          confidence = Math.min(100, confidence + 10);
        }
        reason += ` OBV trend: Up (volume supporting upside).`;
      } else if (obvTrendingDown && signal === 'HOLD') {
        signal = 'SELL';
        strength = 40;
        confidence = 55;
        reason += ` OBV trending down - volume supporting downside.`;
      } else if (obvTrendingDown && (signal === 'SELL' || signal === 'HOLD')) {
        if (signal === 'HOLD') {
          signal = 'SELL';
          strength = 40;
          confidence = 55;
        } else {
          strength = Math.min(100, strength + 15);
          confidence = Math.min(100, confidence + 10);
        }
        reason += ` OBV trend: Down (volume supporting downside).`;
      }
    }
  }

  const indicators: Record<string, number> = {};

  if (volumeMA !== null) {
    indicators.volumeMA = Math.round(volumeMA);
  }

  if (volumeSpikeRatio !== null) {
    indicators.volumeSpikeRatio = Math.round(volumeSpikeRatio * 100) / 100;
  }

  indicators.currentVolume = volumes[volumes.length - 1];

  return {
    strategy: 'Volume',
    signal,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    reason,
    timestamp,
    indicators,
  };
}
