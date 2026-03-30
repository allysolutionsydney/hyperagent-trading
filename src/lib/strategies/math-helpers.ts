/**
 * Mathematical Helper Functions
 * Core calculations for all technical indicators
 * No external dependencies - all calculations are manual implementations
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param prices Array of prices
 * @param period Number of periods to average
 * @returns SMA value or null if insufficient data
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param prices Array of prices
 * @param period Number of periods
 * @param prevEMA Previous EMA value (for incremental calculation)
 * @returns EMA value or null if insufficient data
 */
export function calculateEMA(
  prices: number[],
  period: number,
  prevEMA?: number
): number | null {
  if (prices.length === 0) return null;

  const multiplier = 2 / (period + 1);

  // If no previous EMA, start with SMA
  if (prevEMA === undefined) {
    if (prices.length < period) return null;
    const sma = calculateSMA(prices, period);
    if (sma === null) return null;
    // Use the last price with the multiplier for the first EMA
    const lastPrice = prices[prices.length - 1];
    return sma * (1 - multiplier) + lastPrice * multiplier;
  }

  // Incremental EMA calculation
  const lastPrice = prices[prices.length - 1];
  return prevEMA * (1 - multiplier) + lastPrice * multiplier;
}

/**
 * Calculate all EMAs for a price series
 * @param prices Array of prices
 * @param period Period for EMA
 * @returns Array of EMA values (null for insufficient data)
 */
export function calculateEMAArray(prices: number[], period: number): (number | null)[] {
  const emaArray: (number | null)[] = [];
  let currentEMA: number | null = null;

  for (let i = 0; i < prices.length; i++) {
    const priceSlice = prices.slice(0, i + 1);

    if (currentEMA === null) {
      currentEMA = calculateEMA(priceSlice, period);
    } else {
      currentEMA = calculateEMA([prices[i]], period, currentEMA);
    }

    emaArray.push(currentEMA);
  }

  return emaArray;
}

/**
 * Calculate standard deviation
 * @param prices Array of prices
 * @param period Period for calculation
 * @returns Standard deviation or null if insufficient data
 */
export function calculateStandardDeviation(prices: number[], period: number): number | null {
  if (prices.length < period) return null;

  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = slice.map((price) => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;

  return Math.sqrt(variance);
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param prices Array of close prices
 * @param period Period for RSI (default 14)
 * @returns RSI value (0-100) or null if insufficient data
 */
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));

  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return avgGain > 0 ? 100 : 0;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

/**
 * Calculate RSI array for all data points
 * @param prices Array of close prices
 * @param period Period for RSI
 * @returns Array of RSI values
 */
export function calculateRSIArray(prices: number[], period: number = 14): (number | null)[] {
  const rsiArray: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    const priceSlice = prices.slice(0, i + 1);
    rsiArray.push(calculateRSI(priceSlice, period));
  }

  return rsiArray;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param prices Array of close prices
 * @returns Object with MACD line, signal line, and histogram
 */
export function calculateMACD(
  prices: number[]
): { macd: number | null; signal: number | null; histogram: number | null } | null {
  if (prices.length < 26) return null;

  const ema12Array = calculateEMAArray(prices, 12);
  const ema26Array = calculateEMAArray(prices, 26);

  const lastEMA12 = ema12Array[ema12Array.length - 1];
  const lastEMA26 = ema26Array[ema26Array.length - 1];

  if (lastEMA12 === null || lastEMA26 === null) return null;

  const macdLine = lastEMA12 - lastEMA26;

  // Calculate signal line (9-EMA of MACD line)
  const macdArray: number[] = [];
  for (let i = 0; i < ema12Array.length; i++) {
    if (ema12Array[i] !== null && ema26Array[i] !== null) {
      macdArray.push((ema12Array[i] as number) - (ema26Array[i] as number));
    }
  }

  if (macdArray.length < 9) return null;

  const signalLine = calculateEMA(macdArray, 9);
  if (signalLine === null) return null;

  const histogram = macdLine - signalLine;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

/**
 * Calculate MACD array for all data points
 * @param prices Array of close prices
 * @returns Array of MACD objects
 */
export function calculateMACDArray(
  prices: number[]
): Array<{ macd: number | null; signal: number | null; histogram: number | null }> {
  const macdArray: Array<{ macd: number | null; signal: number | null; histogram: number | null }> = [];

  for (let i = 0; i < prices.length; i++) {
    const priceSlice = prices.slice(0, i + 1);
    macdArray.push(calculateMACD(priceSlice) || { macd: null, signal: null, histogram: null });
  }

  return macdArray;
}

/**
 * Calculate Bollinger Bands
 * @param prices Array of close prices
 * @param period Period for SMA (default 20)
 * @param stdDev Number of standard deviations (default 2)
 * @returns Object with upper, middle, and lower bands
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number | null; middle: number | null; lower: number | null } | null {
  if (prices.length < period) return null;

  const middle = calculateSMA(prices, period);
  if (middle === null) return null;

  const std = calculateStandardDeviation(prices, period);
  if (std === null) return null;

  return {
    upper: middle + stdDev * std,
    middle,
    lower: middle - stdDev * std,
  };
}

/**
 * Calculate Bollinger Bands for all data points
 * @param prices Array of close prices
 * @param period Period for SMA
 * @param stdDev Number of standard deviations
 * @returns Array of Bollinger Band objects
 */
export function calculateBollingerBandsArray(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): Array<{ upper: number | null; middle: number | null; lower: number | null }> {
  const bandsArray: Array<{ upper: number | null; middle: number | null; lower: number | null }> = [];

  for (let i = 0; i < prices.length; i++) {
    const priceSlice = prices.slice(0, i + 1);
    bandsArray.push(
      calculateBollingerBands(priceSlice, period, stdDev) || {
        upper: null,
        middle: null,
        lower: null,
      }
    );
  }

  return bandsArray;
}

/**
 * Calculate On-Balance Volume (OBV)
 * @param candles Array of candle data with close and volume
 * @returns Array of OBV values
 */
export function calculateOBV(closes: number[], volumes: number[]): number[] {
  if (closes.length !== volumes.length || closes.length === 0) return [];

  const obv: number[] = [0]; // Start with 0

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
 * Calculate highest price in range
 * @param prices Array of prices
 * @param period Period to check
 * @returns Highest price or null
 */
export function getHighest(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return Math.max(...slice);
}

/**
 * Calculate lowest price in range
 * @param prices Array of prices
 * @param period Period to check
 * @returns Lowest price or null
 */
export function getLowest(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return Math.min(...slice);
}

/**
 * Calculate percentage change
 * @param oldValue Old value
 * @param newValue New value
 * @returns Percentage change
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

/**
 * Detect if a higher high was made
 * @param highs Array of high prices
 * @param period Period to check
 * @returns true if current high is higher than previous period high
 */
export function isHigherHigh(highs: number[], period: number = 1): boolean {
  if (highs.length < 2) return false;
  return highs[highs.length - 1] > highs[highs.length - 2];
}

/**
 * Detect if a higher low was made
 * @param lows Array of low prices
 * @param period Lookback period
 * @returns true if current low is higher than previous period low
 */
export function isHigherLow(lows: number[], period: number = 1): boolean {
  if (lows.length < 2) return false;
  return lows[lows.length - 1] > lows[lows.length - 2];
}

/**
 * Detect if a lower high was made
 * @param highs Array of high prices
 * @returns true if current high is lower than previous high
 */
export function isLowerHigh(highs: number[]): boolean {
  if (highs.length < 2) return false;
  return highs[highs.length - 1] < highs[highs.length - 2];
}

/**
 * Detect if a lower low was made
 * @param lows Array of low prices
 * @returns true if current low is lower than previous low
 */
export function isLowerLow(lows: number[]): boolean {
  if (lows.length < 2) return false;
  return lows[lows.length - 1] < lows[lows.length - 2];
}
