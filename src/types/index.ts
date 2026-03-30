// ============================================================================
// MARKET DATA TYPES
// ============================================================================

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBook {
  timestamp: number;
  bids: Array<[price: number, size: number]>;
  asks: Array<[price: number, size: number]>;
  spread: number;
  bidAskRatio: number;
}

export interface Ticker {
  symbol: string;
  timestamp: number;
  price: number;
  priceChange24h: number;
  percentChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
  bid: number;
  ask: number;
  lastTrade: number;
}

export interface MarketData {
  candles: Candle[];
  orderBook: OrderBook;
  ticker: Ticker;
  indicators: TechnicalIndicators;
}

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

export interface MAType {
  fast: number;
  slow: number;
  signal: number;
  histogram: number;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  width: number;
}

export interface VolumeProfile {
  interpretation: string;
  pocLevel: number;
  valueLow: number;
  valueHigh: number;
}

export interface TechnicalIndicators {
  rsi?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  macd?: MAType;
  bb?: BollingerBands;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  atr?: number;
  volumeProfile?: VolumeProfile;
  stochastic?: {
    k: number;
    d: number;
  };
  adx?: number;
  obv?: number;
  vpt?: number;
}

// ============================================================================
// TRADING TYPES
// ============================================================================

export interface Order {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop-loss' | 'take-profit';
  price: number;
  quantity: number;
  filled: number;
  remaining: number;
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected';
  fee?: number;
  reduceOnly?: boolean;
  postOnly?: boolean;
}

export interface Fill {
  id: string;
  orderId: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  fee: number;
  feeRate: number;
}

export interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  collateralUsed: number;
  unrealizedPnL: number;
  timestamp: number;
}

export interface PnL {
  realized: number;
  unrealized: number;
  total: number;
  percent: number;
  timestamp: number;
}

export interface Trade {
  id?: string;
  timestamp?: number;
  coin: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  size: number;
  leverage: number;
  thesis: string;
  strategySignals?: string[];
  status?: 'open' | 'closed' | 'cancelled';
}

export interface TradeOutcome {
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  win: boolean;
  exitReason: string;
  durationMinutes: number;
}

// ============================================================================
// STRATEGY TYPES
// ============================================================================

export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface Signal {
  strategy: string;
  type: SignalType;
  confidence: number;
  timestamp: number;
  reason: string;
  price?: number;
}

export interface StrategyConfig {
  name: string;
  enabled: boolean;
  parameters: Record<string, number | boolean | string>;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  minConfidence: number;
  weight: number;
}

export interface StrategyPerformance {
  name: string;
  trades: string[];
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  lastUsed: number;
  enabled: boolean;
  weight: number;
}

// ============================================================================
// AI ANALYSIS TYPES
// ============================================================================

export interface AnalysisResult {
  timestamp: number;
  coin: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  keyLevels: {
    resistance: number[];
    support: number[];
  };
  patterns: string[];
  volumeProfile: string;
  recommendation: 'LONG' | 'SHORT' | 'NEUTRAL';
  recommendationReason: string;
  riskRewardRatio: number;
  confidence: number;
  technicalSummary: string;
  rawResponse: string;
}

export interface SentimentResult {
  timestamp: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number;
  keyDrivers: string[];
  catalysts: string[];
  riskFactors: string[];
  positioning: string;
  summary: string;
  rawResponse: string;
}

export interface TradeIdea {
  timestamp: number;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  entryRange: [number, number];
  stopLoss: number;
  takeProfits: number[];
  positionSize: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  leverage: number;
  thesis: string;
  exitConditions: string[];
  timeHorizon: string;
  confidence: number;
  rawResponse: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// ============================================================================
// INTELLIGENCE & LEARNING TYPES
// ============================================================================

export type MarketRegime = 'trending_up' | 'trending_down' | 'ranging' | 'high_volatility' | 'low_volatility';

export interface TradeJournal {
  id: string;
  timestamp: number;
  coin: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  positionSize: number;
  leverage: number;
  thesis: string;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  win: boolean;
  exitReason: string;
  durationMinutes: number;
  strategySignals: string[];
  marketConditions: {
    trend: string;
    volatility: string;
    regime: MarketRegime;
  };
}

export interface PatternMemory {
  id: string;
  strategies: string[];
  marketRegime: MarketRegime;
  timeOfDay: string;
  volatilityLevel: string;
  trades: string[];
  winRate: number;
  totalTrades: number;
  averageProfit: number;
  weight: number;
}

// ============================================================================
// SETTINGS & CONFIGURATION TYPES
// ============================================================================

export interface APIKeys {
  hyperliquid?: string;
  openai?: string;
  alpaca?: string;
  binance?: string;
}

export interface AppSettings {
  apiKeys: APIKeys;
  trading: {
    enabled: boolean;
    maxRiskPerTrade: number;
    maxLeverage: number;
    maxOpenPositions: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
  strategies: StrategyConfig[];
  intelligence: {
    enabled: boolean;
    autoLearn: boolean;
    minTradesForRecommendation: number;
  };
  notifications: {
    email?: string;
    discord?: string;
    telegram?: string;
  };
  interface: {
    theme: 'light' | 'dark';
    defaultTimeframe: string;
    chartType: string;
  };
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface ChartConfig {
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  coin: string;
  indicators: string[];
  showVolume: boolean;
  showOrderBook: boolean;
}

export interface DashboardState {
  selectedCoin: string;
  selectedTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  chartConfig: ChartConfig;
  showAnalysis: boolean;
  showIntelligence: boolean;
  openPositions: Position[];
  recentTrades: TradeJournal[];
  accountStats: {
    balance: number;
    availableMargin: number;
    usedMargin: number;
    realizedPnL: number;
    unrealizedPnL: number;
    totalPnL: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'success' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>;
}

// ============================================================================
// ALERT & NOTIFICATION TYPES
// ============================================================================

export interface Alert {
  id: string;
  type: 'price' | 'volume' | 'technical' | 'news' | 'risk' | 'performance';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  coin?: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    handler: string;
  };
}

// ============================================================================
// BACKTEST & ANALYSIS TYPES
// ============================================================================

export interface BacktestConfig {
  strategy: string;
  symbol: string;
  startDate: number;
  endDate: number;
  initialBalance: number;
  riskPerTrade: number;
  leverage: number;
  slippage: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortino: number;
  cagr: number;
  trades: TradeJournal[];
  equity: Array<{ timestamp: number; value: number }>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market' | 'stop-loss' | 'take-profit';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected';
export type PositionSide = 'long' | 'short' | 'both';

export enum TradingMode {
  MANUAL = 'manual',
  SEMI_AUTO = 'semi_auto',
  AUTO = 'auto',
}

export enum RiskLevel {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}
