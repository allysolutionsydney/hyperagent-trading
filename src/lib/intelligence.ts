import {
  Trade,
  TradeJournal,
  PatternMemory,
  MarketRegime,
  StrategyPerformance,
} from '../types/index';

interface PatternKey {
  strategies: string[];
  regime: MarketRegime;
  timeOfDay: string;
  volatilityLevel: string;
}

export interface StoredIntelligence {
  version: number;
  lastUpdated: number;
  trades: TradeJournal[];
  patterns: Record<string, PatternMemory>;
  strategyPerformance: Record<string, StrategyPerformance>;
  marketRegimeHistory: MarketRegime[];
  learningStats: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    totalProfit: number;
  };
}

export class IntelligenceEngine {
  private trades: TradeJournal[] = [];
  private patterns: Map<string, PatternMemory> = new Map();
  private strategyPerformance: Record<string, StrategyPerformance> = {};
  private marketRegimeHistory: MarketRegime[] = [];
  private learningStats = {
    totalTrades: 0,
    winRate: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    totalProfit: 0,
  };

  constructor(initialData?: StoredIntelligence) {
    if (initialData) {
      this.hydrate(initialData);
    }
  }

  private hydrate(data: StoredIntelligence): void {
    this.trades = data.trades || [];
    this.patterns = new Map(Object.entries(data.patterns || {}));
    this.strategyPerformance = data.strategyPerformance || {};
    this.marketRegimeHistory = data.marketRegimeHistory || [];
    this.learningStats = data.learningStats || this.learningStats;
  }

  toJSON(): StoredIntelligence {
    return {
      version: 1,
      lastUpdated: Date.now(),
      trades: this.trades,
      patterns: Object.fromEntries(this.patterns),
      strategyPerformance: this.strategyPerformance,
      marketRegimeHistory: this.marketRegimeHistory,
      learningStats: this.learningStats,
    };
  }

  static fromJSON(data: StoredIntelligence): IntelligenceEngine {
    return new IntelligenceEngine(data);
  }

  recordTrade(trade: Trade, outcome: {
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    win: boolean;
    exitReason: string;
    durationMinutes: number;
  }): void {
    const journal: TradeJournal = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      coin: trade.coin,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      takeProfits: trade.takeProfits,
      positionSize: trade.size,
      leverage: trade.leverage,
      thesis: trade.thesis,
      exitPrice: outcome.exitPrice,
      pnl: outcome.pnl,
      pnlPercent: outcome.pnlPercent,
      win: outcome.win,
      exitReason: outcome.exitReason,
      durationMinutes: outcome.durationMinutes,
      strategySignals: trade.strategySignals || [],
      marketConditions: {
        trend: 'NEUTRAL',
        volatility: 'NORMAL',
        regime: 'RANGING' as MarketRegime,
      },
    };

    this.trades.push(journal);
    this.updateLearningStats();
    this.extractPatterns(journal);
  }

  private updateLearningStats(): void {
    if (this.trades.length === 0) return;

    const wins = this.trades.filter((t) => t.win);
    const losses = this.trades.filter((t) => !t.win);

    this.learningStats.totalTrades = this.trades.length;
    this.learningStats.winRate = wins.length / this.trades.length;

    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    this.learningStats.totalProfit = totalWins - totalLosses;
    this.learningStats.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    this.learningStats.averageWin = wins.length > 0 ? totalWins / wins.length : 0;
    this.learningStats.averageLoss = losses.length > 0 ? totalLosses / losses.length : 0;
  }

  private extractPatterns(trade: TradeJournal): void {
    const timeOfDay = this.getTimeOfDay(trade.timestamp);
    const volatilityLevel = this.getVolatilityLevel(trade.marketConditions.volatility);
    const patternKey = `${trade.strategySignals.join(',')}_${trade.marketConditions.regime}_${timeOfDay}_${volatilityLevel}`;

    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        id: patternKey,
        strategies: trade.strategySignals,
        marketRegime: trade.marketConditions.regime,
        timeOfDay: timeOfDay,
        volatilityLevel: volatilityLevel,
        trades: [],
        winRate: 0,
        totalTrades: 0,
        averageProfit: 0,
        weight: 1,
      });
    }

    const pattern = this.patterns.get(patternKey)!;
    pattern.trades.push(trade.id);
    pattern.totalTrades = pattern.trades.length;
    pattern.winRate = this.calculateWinRate(pattern.trades);
    pattern.averageProfit = this.calculateAverageProfit(pattern.trades);
    pattern.weight = this.calculatePatternWeight(pattern);
  }

  private calculateWinRate(tradeIds: string[]): number {
    const trades = this.trades.filter((t) => tradeIds.includes(t.id));
    if (trades.length === 0) return 0;
    return trades.filter((t) => t.win).length / trades.length;
  }

  private calculateAverageProfit(tradeIds: string[]): number {
    const trades = this.trades.filter((t) => tradeIds.includes(t.id));
    if (trades.length === 0) return 0;
    return trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length;
  }

  private calculatePatternWeight(pattern: PatternMemory): number {
    if (pattern.totalTrades < 5) return 0.5;
    if (pattern.winRate < 0.3) return 0.3;
    if (pattern.winRate < 0.4) return 0.6;
    if (pattern.winRate < 0.5) return 0.8;
    if (pattern.winRate < 0.55) return 1;
    return 1.2 + (pattern.winRate - 0.55) * 5;
  }

  updateStrategyPerformance(strategyName: string, trade: TradeJournal): void {
    if (!this.strategyPerformance[strategyName]) {
      this.strategyPerformance[strategyName] = {
        name: strategyName,
        trades: [],
        winRate: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        lastUsed: Date.now(),
        enabled: true,
        weight: 1,
      };
    }

    const perf = this.strategyPerformance[strategyName];
    perf.trades.push(trade.id);
    perf.lastUsed = Date.now();

    const strategyTrades = this.trades.filter((t) => perf.trades.includes(t.id));
    const wins = strategyTrades.filter((t) => t.win);
    const losses = strategyTrades.filter((t) => !t.win);

    perf.winRate = wins.length / strategyTrades.length;
    perf.averageProfit = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    perf.averageLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses.length : 0;

    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    perf.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

    this.autoAdjustStrategy(strategyName, perf);
  }

  private autoAdjustStrategy(name: string, perf: StrategyPerformance): void {
    const recentTrades = this.trades.filter((t) => perf.trades.includes(t.id)).slice(-50);
    if (recentTrades.length < 10) return;

    const recentWins = recentTrades.filter((t) => t.win);
    const recentWinRate = recentWins.length / recentTrades.length;

    if (recentWinRate > 0.55) {
      perf.weight = Math.min(1.3, perf.weight + 0.05);
    } else if (recentWinRate < 0.35) {
      perf.weight = Math.max(0.5, perf.weight - 0.05);
    } else {
      perf.weight = 1;
    }

    perf.enabled = recentWinRate > 0.3;
  }

  detectMarketRegime(data: {
    volatility: number;
    trend: string;
    atr: number;
    averageAtr: number;
  }): MarketRegime {
    const volatilityRatio = data.atr / data.averageAtr;

    if (volatilityRatio > 1.5) {
      return 'high_volatility';
    } else if (volatilityRatio < 0.5) {
      return 'low_volatility';
    }

    if (data.trend === 'BULLISH') {
      return 'trending_up';
    } else if (data.trend === 'BEARISH') {
      return 'trending_down';
    }

    return 'ranging';
  }

  getOptimalStrategies(regime: MarketRegime): { name: string; weight: number }[] {
    const regimeStrategies: Record<MarketRegime, string[]> = {
      trending_up: ['momentum', 'breakout', 'trend_following'],
      trending_down: ['short_momentum', 'breakdown', 'trend_following'],
      ranging: ['mean_reversion', 'support_resistance'],
      high_volatility: ['volatility_expansion', 'options_strategies'],
      low_volatility: ['scalping', 'low_vol_consolidation'],
    };

    const strategies = regimeStrategies[regime] || [];
    return strategies
      .map((name) => ({
        name,
        weight: this.strategyPerformance[name]?.weight || 1,
      }))
      .sort((a, b) => b.weight - a.weight);
  }

  generateReport(): {
    summary: string;
    stats: typeof this.learningStats;
    topPatterns: PatternMemory[];
    strategyRankings: StrategyPerformance[];
    recommendations: string[];
  } {
    const topPatterns = Array.from(this.patterns.values())
      .filter((p) => p.totalTrades >= 3)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    const strategyRankings = Object.values(this.strategyPerformance).sort((a, b) => b.weight - a.weight);

    const recommendations = this.generateRecommendations(topPatterns, strategyRankings);

    return {
      summary: `Analyzed ${this.learningStats.totalTrades} trades with ${(this.learningStats.winRate * 100).toFixed(1)}% win rate. Total profit: $${this.learningStats.totalProfit.toFixed(2)}. Profit factor: ${this.learningStats.profitFactor.toFixed(2)}.`,
      stats: this.learningStats,
      topPatterns,
      strategyRankings,
      recommendations,
    };
  }

  private generateRecommendations(
    patterns: PatternMemory[],
    strategies: StrategyPerformance[]
  ): string[] {
    const recommendations: string[] = [];

    const bestPattern = patterns[0];
    if (bestPattern && bestPattern.winRate > 0.55) {
      recommendations.push(
        `Top performing pattern: ${bestPattern.strategies.join('+')} in ${bestPattern.marketRegime} with ${(bestPattern.winRate * 100).toFixed(1)}% win rate`
      );
    }

    const bestStrategy = strategies.find((s) => s.enabled && s.weight > 1);
    if (bestStrategy) {
      recommendations.push(
        `${bestStrategy.name} is outperforming with profit factor of ${bestStrategy.profitFactor.toFixed(2)}`
      );
    }

    if (this.learningStats.winRate < 0.45) {
      recommendations.push('Win rate below 45%. Review trade entries and risk management.');
    }

    if (this.learningStats.profitFactor < 1.5) {
      recommendations.push('Profit factor below 1.5. Focus on improving win rate or average win size.');
    }

    const underperformers = strategies.filter((s) => s.weight < 0.6 && s.trades.length > 5);
    if (underperformers.length > 0) {
      recommendations.push(
        `Consider disabling ${underperformers.map((s) => s.name).join(', ')} - underperforming`
      );
    }

    return recommendations;
  }

  getStrategyRankings(): StrategyPerformance[] {
    return Object.values(this.strategyPerformance)
      .sort((a, b) => b.weight - a.weight)
      .map((s) => ({
        ...s,
        winRate: isNaN(s.winRate) ? 0 : s.winRate,
        profitFactor: isNaN(s.profitFactor) ? 0 : s.profitFactor,
      }));
  }

  getOptimalSettings(): {
    recommendedStrategies: string[];
    riskPerTrade: number;
    maxLeverage: number;
    tradingHours: string[];
    regimeAdaptation: boolean;
  } {
    const topStrategy = this.getStrategyRankings()[0];
    const recommendedStrategies = this.getStrategyRankings()
      .filter((s) => s.enabled && s.weight > 0.8)
      .map((s) => s.name);

    return {
      recommendedStrategies: recommendedStrategies.length > 0 ? recommendedStrategies : ['breakout'],
      riskPerTrade: this.calculateOptimalRiskPerTrade(),
      maxLeverage: this.calculateOptimalLeverage(),
      tradingHours: this.calculateOptimalTradingHours(),
      regimeAdaptation: true,
    };
  }

  private calculateOptimalRiskPerTrade(): number {
    if (this.learningStats.profitFactor < 1.2) return 1;
    if (this.learningStats.profitFactor < 1.5) return 1.5;
    if (this.learningStats.profitFactor < 2) return 2;
    return 2.5;
  }

  private calculateOptimalLeverage(): number {
    const maxDrawdown = this.calculateMaxDrawdown();
    if (maxDrawdown > 0.3) return 2;
    if (maxDrawdown > 0.2) return 3;
    if (maxDrawdown > 0.1) return 5;
    return 10;
  }

  private calculateMaxDrawdown(): number {
    if (this.trades.length === 0) return 0;
    let runningProfit = 0;
    let peak = 0;
    let maxDD = 0;

    for (const trade of this.trades) {
      runningProfit += trade.pnl;
      if (runningProfit > peak) peak = runningProfit;
      const drawdown = (peak - runningProfit) / (peak || 1);
      maxDD = Math.max(maxDD, drawdown);
    }

    return maxDD;
  }

  private calculateOptimalTradingHours(): string[] {
    const hourlyStats: Record<string, { wins: number; losses: number }> = {};

    for (const trade of this.trades) {
      const hour = new Date(trade.timestamp).getHours();
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;

      if (!hourlyStats[hourStr]) {
        hourlyStats[hourStr] = { wins: 0, losses: 0 };
      }

      if (trade.win) hourlyStats[hourStr].wins++;
      else hourlyStats[hourStr].losses++;
    }

    return Object.entries(hourlyStats)
      .filter(([_, stats]) => {
        const total = stats.wins + stats.losses;
        return total >= 3 && stats.wins / total > 0.5;
      })
      .map(([hour]) => hour);
  }

  getLearningProgress(): {
    tradesAnalyzed: number;
    patternsIdentified: number;
    confidenceLevel: string;
    dataQuality: number;
    recommendedMinTrades: number;
  } {
    const tradesAnalyzed = this.trades.length;
    const patternsIdentified = Array.from(this.patterns.values()).filter((p) => p.totalTrades >= 3).length;
    const dataQuality = Math.min(100, (tradesAnalyzed / 100) * 100);

    let confidenceLevel = 'LOW';
    if (tradesAnalyzed >= 50) confidenceLevel = 'MEDIUM';
    if (tradesAnalyzed >= 100) confidenceLevel = 'HIGH';
    if (tradesAnalyzed >= 200) confidenceLevel = 'VERY_HIGH';

    return {
      tradesAnalyzed,
      patternsIdentified,
      confidenceLevel,
      dataQuality,
      recommendedMinTrades: 50,
    };
  }

  resetLearning(): void {
    this.trades = [];
    this.patterns.clear();
    this.strategyPerformance = {};
    this.marketRegimeHistory = [];
    this.updateLearningStats();
  }

  exportIntelligence(): StoredIntelligence {
    return this.toJSON();
  }

  importIntelligence(data: StoredIntelligence): void {
    this.hydrate(data);
    this.updateLearningStats();
  }

  private getTimeOfDay(timestamp: number): string {
    const hour = new Date(timestamp).getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getVolatilityLevel(volatility: string): string {
    return volatility || 'normal';
  }
}
