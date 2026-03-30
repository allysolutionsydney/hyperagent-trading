/**
 * Strategy Manager
 * Orchestrates all trading strategies and aggregates signals
 */

import { CandleData, StrategySignal, StrategyConfig, AggregatedSignal, StrategyPerformance } from './types';
import { analyzeRSI, RSIConfig } from './rsi';
import { analyzeMACD, MACDConfig } from './macd';
import { analyzeBollingerBands, BollingerConfig } from './bollinger';
import { analyzeMAcrossover, MAConfig } from './ma-crossover';
import { analyzeVolume, VolumeConfig } from './volume';
import { generateAISentimentAnalysis, parseAIResponse, getFallbackSignal, prepareAnalysisContext, AIAnalysisContext } from './ai-sentiment';

export type StrategyName = 'RSI' | 'MACD' | 'BollingerBands' | 'MAcrossover' | 'Volume' | 'AISentiment';

export interface StrategyWeights {
  RSI?: number;
  MACD?: number;
  BollingerBands?: number;
  MAcrossover?: number;
  Volume?: number;
  AISentiment?: number;
}

export interface StrategyManagerConfig {
  enabledStrategies: StrategyName[];
  weights: StrategyWeights;
  rsi?: Partial<RSIConfig>;
  macd?: Partial<MACDConfig>;
  bollinger?: Partial<BollingerConfig>;
  macrossover?: Partial<MAConfig>;
  volume?: Partial<VolumeConfig>;
  aiSentimentContext?: string; // Additional context for AI analysis
}

/**
 * Strategy Manager Class
 * Manages all trading strategies and generates composite signals
 */
export class StrategyManager {
  private config: StrategyManagerConfig;
  private performance: Map<StrategyName, StrategyPerformance>;

  constructor(config: StrategyManagerConfig) {
    this.config = {
      enabledStrategies: config.enabledStrategies || ['RSI', 'MACD', 'BollingerBands', 'MAcrossover', 'Volume'],
      weights: this.normalizeWeights(config.weights),
      rsi: config.rsi,
      macd: config.macd,
      bollinger: config.bollinger,
      macrossover: config.macrossover,
      volume: config.volume,
      aiSentimentContext: config.aiSentimentContext,
    };

    this.performance = new Map();
    this.initializePerformance();
  }

  /**
   * Initialize performance tracking for all strategies
   */
  private initializePerformance(): void {
    const strategies: StrategyName[] = ['RSI', 'MACD', 'BollingerBands', 'MAcrossover', 'Volume', 'AISentiment'];

    strategies.forEach((strategy) => {
      this.performance.set(strategy, {
        strategy,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        profitFactor: 1,
        lastUpdated: Date.now(),
      });
    });
  }

  /**
   * Normalize weights to sum to 100
   * @param weights Raw weights from config
   * @returns Normalized weights
   */
  private normalizeWeights(weights: StrategyWeights): StrategyWeights {
    const normalized: StrategyWeights = {};

    // Default weights if not specified
    const defaultWeights: StrategyWeights = {
      RSI: 1,
      MACD: 1.2,
      BollingerBands: 1,
      MAcrossover: 1.3,
      Volume: 0.8,
      AISentiment: 1.5,
    };

    // Merge provided weights with defaults
    const finalWeights = { ...defaultWeights, ...weights };

    // Normalize to sum to 100
    const sum = Object.values(finalWeights).reduce((a, b) => a + (b || 0), 0);

    Object.entries(finalWeights).forEach(([key, value]) => {
      normalized[key as StrategyName] = value ? (value / sum) * 100 : 0;
    });

    return normalized;
  }

  /**
   * Get weight for a specific strategy
   * @param strategy Strategy name
   * @returns Weight (0-100)
   */
  private getWeight(strategy: StrategyName): number {
    return this.config.weights[strategy] || 0;
  }

  /**
   * Run all enabled strategies against candle data
   * @param candles Array of candle data
   * @returns Array of strategy signals
   */
  private runAllStrategies(candles: CandleData[]): StrategySignal[] {
    const signals: StrategySignal[] = [];

    if (this.config.enabledStrategies.includes('RSI')) {
      signals.push(analyzeRSI(candles, this.config.rsi));
    }

    if (this.config.enabledStrategies.includes('MACD')) {
      signals.push(analyzeMACD(candles, this.config.macd));
    }

    if (this.config.enabledStrategies.includes('BollingerBands')) {
      signals.push(analyzeBollingerBands(candles, this.config.bollinger));
    }

    if (this.config.enabledStrategies.includes('MAcrossover')) {
      signals.push(analyzeMAcrossover(candles, this.config.macrossover));
    }

    if (this.config.enabledStrategies.includes('Volume')) {
      signals.push(analyzeVolume(candles, this.config.volume));
    }

    // Note: AISentiment requires async API call - handled separately in main analysis function

    return signals;
  }

  /**
   * Convert signal direction to numeric value for weighted averaging
   * BUY = 1, SELL = -1, HOLD = 0
   * @param signal Signal direction
   * @returns Numeric value
   */
  private signalToNumeric(signal: 'BUY' | 'SELL' | 'HOLD'): number {
    switch (signal) {
      case 'BUY':
        return 1;
      case 'SELL':
        return -1;
      case 'HOLD':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Convert numeric value to signal direction
   * @param value Numeric value
   * @returns Signal direction
   */
  private numericToSignal(value: number): 'BUY' | 'SELL' | 'HOLD' {
    if (value > 0.15) return 'BUY';
    if (value < -0.15) return 'SELL';
    return 'HOLD';
  }

  /**
   * Aggregate multiple strategy signals into a composite signal
   * @param signals Array of strategy signals
   * @returns Aggregated signal
   */
  private aggregateSignals(signals: StrategySignal[]): Omit<AggregatedSignal, 'timestamp'> {
    if (signals.length === 0) {
      return {
        compositeSignal: 'HOLD',
        compositeStrength: 0,
        compositeConfidence: 0,
        signals: [],
        reasoning: 'No signals available',
      };
    }

    let totalWeightedSignal = 0;
    let totalWeightedStrength = 0;
    let totalWeightedConfidence = 0;
    let totalWeight = 0;

    const reasoning: string[] = [];
    let bullishCount = 0;
    let bearishCount = 0;
    let holdCount = 0;

    signals.forEach((signal) => {
      const weight = this.getWeight(signal.strategy as StrategyName);
      const signalValue = this.signalToNumeric(signal.signal);

      totalWeightedSignal += signalValue * weight;
      totalWeightedStrength += signal.strength * weight;
      totalWeightedConfidence += signal.confidence * weight;
      totalWeight += weight;

      if (signal.signal === 'BUY') bullishCount++;
      else if (signal.signal === 'SELL') bearishCount++;
      else holdCount++;

      // Add to reasoning if signal is strong
      if (signal.strength >= 60 || signal.confidence >= 70) {
        reasoning.push(`${signal.strategy}: ${signal.signal} (${signal.strength}% strength, ${signal.confidence}% confidence) - ${signal.reason}`);
      }
    });

    // Avoid division by zero
    if (totalWeight === 0) {
      return {
        compositeSignal: 'HOLD',
        compositeStrength: 0,
        compositeConfidence: 0,
        signals,
        reasoning: 'No weights assigned',
      };
    }

    const compositeSignal = this.numericToSignal(totalWeightedSignal / totalWeight);
    const compositeStrength = Math.round(totalWeightedStrength / totalWeight);
    const compositeConfidence = Math.round(totalWeightedConfidence / totalWeight);

    const reasoningText =
      reasoning.length > 0
        ? reasoning.join('\n')
        : `Mixed signals: ${bullishCount} BUY, ${bearishCount} SELL, ${holdCount} HOLD. Composite: ${compositeSignal}`;

    return {
      compositeSignal,
      compositeStrength,
      compositeConfidence,
      signals,
      reasoning: reasoningText,
    };
  }

  /**
   * Analyze market with all strategies
   * @param candles Array of candle data
   * @param aiResponse Optional AI response to include
   * @returns Aggregated signal with all strategy breakdowns
   */
  public analyze(candles: CandleData[], aiResponse?: string): AggregatedSignal {
    if (candles.length === 0) {
      return {
        timestamp: Date.now(),
        compositeSignal: 'HOLD',
        compositeStrength: 0,
        compositeConfidence: 0,
        signals: [],
        reasoning: 'No candle data available',
      };
    }

    const timestamp = candles[candles.length - 1].timestamp;
    const signals = this.runAllStrategies(candles);

    // Add AI sentiment signal if response provided
    if (aiResponse && this.config.enabledStrategies.includes('AISentiment')) {
      const aiSignal = parseAIResponse(aiResponse, timestamp);
      signals.push(aiSignal);
    } else if (this.config.enabledStrategies.includes('AISentiment') && !aiResponse) {
      // Use fallback if AI is enabled but no response
      const context = prepareAnalysisContext(candles, this.config.aiSentimentContext);
      const fallbackSignal = getFallbackSignal(context);
      signals.push(fallbackSignal);
    }

    const aggregated = this.aggregateSignals(signals);

    return {
      ...aggregated,
      timestamp,
    };
  }

  /**
   * Get AI analysis prompt and context for external API calls
   * @param candles Array of candle data
   * @returns Prompt and context for OpenAI
   */
  public getAIAnalysisContext(candles: CandleData[]): { prompt: string; context: AIAnalysisContext } {
    const analysis = generateAISentimentAnalysis(candles, this.config.aiSentimentContext);
    return {
      prompt: analysis.prompt,
      context: analysis.context,
    };
  }

  /**
   * Update strategy performance after a trade
   * @param strategy Strategy name
   * @param profit Profit from the trade (positive or negative)
   */
  public updatePerformance(strategy: StrategyName, profit: number): void {
    const perf = this.performance.get(strategy);

    if (!perf) return;

    perf.totalTrades++;

    if (profit > 0) {
      perf.winningTrades++;
    } else if (profit < 0) {
      perf.losingTrades++;
    }

    perf.winRate = (perf.winningTrades / perf.totalTrades) * 100;

    // Calculate profit factor
    const totalProfit = perf.winningTrades * (profit > 0 ? Math.abs(profit) : 1);
    const totalLoss = perf.losingTrades * (profit < 0 ? Math.abs(profit) : 1);

    perf.profitFactor = totalLoss === 0 ? (totalProfit > 0 ? 999 : 1) : totalProfit / totalLoss;
    perf.lastUpdated = Date.now();
  }

  /**
   * Get performance stats for all strategies
   * @returns Array of strategy performance data
   */
  public getPerformance(): StrategyPerformance[] {
    return Array.from(this.performance.values());
  }

  /**
   * Get performance for a specific strategy
   * @param strategy Strategy name
   * @returns Strategy performance or null
   */
  public getStrategyPerformance(strategy: StrategyName): StrategyPerformance | null {
    return this.performance.get(strategy) || null;
  }

  /**
   * Reset performance tracking
   */
  public resetPerformance(): void {
    this.initializePerformance();
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  public updateConfig(config: Partial<StrategyManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      weights: config.weights ? this.normalizeWeights(config.weights) : this.config.weights,
    };
  }

  /**
   * Get current configuration
   * @returns Current config
   */
  public getConfig(): StrategyManagerConfig {
    return this.config;
  }

  /**
   * Enable a strategy
   * @param strategy Strategy name
   */
  public enableStrategy(strategy: StrategyName): void {
    if (!this.config.enabledStrategies.includes(strategy)) {
      this.config.enabledStrategies.push(strategy);
    }
  }

  /**
   * Disable a strategy
   * @param strategy Strategy name
   */
  public disableStrategy(strategy: StrategyName): void {
    this.config.enabledStrategies = this.config.enabledStrategies.filter((s) => s !== strategy);
  }
}

/**
 * Create a default strategy manager with standard configuration
 * @returns Preconfigured StrategyManager
 */
export function createDefaultStrategyManager(): StrategyManager {
  return new StrategyManager({
    enabledStrategies: ['RSI', 'MACD', 'BollingerBands', 'MAcrossover', 'Volume'],
    weights: {
      RSI: 1,
      MACD: 1.2,
      BollingerBands: 1,
      MAcrossover: 1.3,
      Volume: 0.8,
    },
  });
}

/**
 * Create a momentum-focused strategy manager
 * @returns Preconfigured StrategyManager
 */
export function createMomentumStrategyManager(): StrategyManager {
  return new StrategyManager({
    enabledStrategies: ['MACD', 'MAcrossover', 'Volume'],
    weights: {
      MACD: 2,
      MAcrossover: 2,
      Volume: 1.5,
    },
  });
}

/**
 * Create a mean-reversion focused strategy manager
 * @returns Preconfigured StrategyManager
 */
export function createMeanReversionStrategyManager(): StrategyManager {
  return new StrategyManager({
    enabledStrategies: ['RSI', 'BollingerBands'],
    weights: {
      RSI: 1.2,
      BollingerBands: 1,
    },
  });
}

// Export all strategy analyzers for direct use
export { analyzeRSI } from './rsi';
export { analyzeMACD } from './macd';
export { analyzeBollingerBands } from './bollinger';
export { analyzeMAcrossover } from './ma-crossover';
export { analyzeVolume } from './volume';
export {
  generateAISentimentAnalysis,
  parseAIResponse,
  getFallbackSignal,
  prepareAnalysisContext,
  generateAIPrompt,
} from './ai-sentiment';

// Export types
export type { CandleData, StrategySignal, StrategyConfig, AggregatedSignal, StrategyPerformance } from './types';
