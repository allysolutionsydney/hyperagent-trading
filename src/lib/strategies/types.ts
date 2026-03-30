/**
 * Core Strategy Types and Interfaces
 * Defines the data structures used across all trading strategies
 */

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface StrategySignal {
  strategy: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100: how strong the signal is
  confidence: number; // 0-100: how confident the signal is
  reason: string; // Human-readable explanation
  timestamp: number;
  indicators: Record<string, number>; // Raw indicator values for transparency
}

export interface StrategyConfig {
  enabled: boolean;
  params: Record<string, number>;
}

export interface AggregatedSignal {
  timestamp: number;
  compositeSignal: 'BUY' | 'SELL' | 'HOLD';
  compositeStrength: number; // Weighted average strength
  compositeConfidence: number; // Weighted average confidence
  signals: StrategySignal[];
  reasoning: string;
}

export interface StrategyPerformance {
  strategy: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // 0-100
  profitFactor: number; // Total profit / total loss
  lastUpdated: number;
}
