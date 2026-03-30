import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Candle,
  OrderBook,
  Position,
  Order,
  Trade,
  AnalysisResult,
  Message,
  Signal,
  MarketRegime,
} from '../types';

// ============================================================================
// SETTINGS SLICE
// ============================================================================

interface ApiKeys {
  openai: string;
  hyperliquidPrivateKey: string;
  hyperliquidWallet: string;
  openRouter: string;
}

interface SettingsSlice {
  apiKeys: ApiKeys;
  isTestnet: boolean;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setTestnet: (testnet: boolean) => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

// ============================================================================
// MARKET SLICE
// ============================================================================

interface MarketSlice {
  selectedCoin: string;
  candles: Candle[];
  orderBook: OrderBook | null;
  positions: Position[];
  accountBalance: number;
  allMids: Record<string, string>;
  setSelectedCoin: (coin: string) => void;
  setCandles: (candles: Candle[]) => void;
  setOrderBook: (orderBook: OrderBook) => void;
  setPositions: (positions: Position[]) => void;
  setAccountBalance: (balance: number) => void;
  setAllMids: (mids: Record<string, string>) => void;
  updateAllMids: (updates: Record<string, string>) => void;
}

// ============================================================================
// STRATEGY SLICE
// ============================================================================

interface StrategyState {
  enabled: boolean;
  weight: number;
  params: Record<string, number>;
}

interface CompositeSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  strength: number;
  confidence: number;
}

interface StrategySlice {
  strategies: Record<string, StrategyState>;
  signals: Signal[];
  compositeSignal: CompositeSignal | null;
  toggleStrategy: (strategyName: string, enabled: boolean) => void;
  setWeight: (strategyName: string, weight: number) => void;
  setStrategyParam: (strategyName: string, param: string, value: number) => void;
  setSignals: (signals: Signal[]) => void;
  setCompositeSignal: (signal: CompositeSignal) => void;
}

// ============================================================================
// TRADING SLICE
// ============================================================================

interface RiskSettings {
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
}

interface TradingSlice {
  openOrders: Order[];
  recentTrades: Trade[];
  isAutoTrading: boolean;
  riskSettings: RiskSettings;
  setOpenOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  addTrade: (trade: Trade) => void;
  toggleAutoTrading: (enabled: boolean) => void;
  setRiskSettings: (settings: Partial<RiskSettings>) => void;
}

// ============================================================================
// AI SLICE
// ============================================================================

interface AISlice {
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  chatMessages: Message[];
  setAnalysis: (result: AnalysisResult | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  addChatMessage: (message: Message) => void;
  clearChatMessages: () => void;
}

// ============================================================================
// INTELLIGENCE SLICE
// ============================================================================

interface LearningProgress {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  confidence: number;
}

interface StrategyRanking {
  strategy: string;
  score: number;
}

interface IntelligenceSlice {
  learningProgress: LearningProgress;
  strategyRankings: StrategyRanking[];
  currentRegime: MarketRegime;
  setLearningProgress: (progress: Partial<LearningProgress>) => void;
  setStrategyRankings: (rankings: StrategyRanking[]) => void;
  setCurrentRegime: (regime: MarketRegime) => void;
}

// ============================================================================
// COMBINED STORE TYPE
// ============================================================================

type AppStore = SettingsSlice &
  MarketSlice &
  StrategySlice &
  TradingSlice &
  AISlice &
  IntelligenceSlice;

// ============================================================================
// ZUSTAND STORE
// ============================================================================

const defaultRiskSettings: RiskSettings = {
  maxPositionSize: 5000,
  stopLossPercent: 2,
  takeProfitPercent: 5,
  maxDailyLoss: 1000,
  maxOpenPositions: 5,
};

const defaultApiKeys: ApiKeys = {
  openai: '',
  hyperliquidPrivateKey: '',
  hyperliquidWallet: '',
  openRouter: '',
};

const defaultCompositeSignal: CompositeSignal = {
  signal: 'NEUTRAL',
  strength: 0,
  confidence: 0,
};

const defaultLearningProgress: LearningProgress = {
  totalTrades: 0,
  winRate: 0,
  profitFactor: 0,
  confidence: 0,
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // SETTINGS SLICE
      // ========================================================================
      apiKeys: defaultApiKeys,
      isTestnet: false,

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      setTestnet: (testnet) => set({ isTestnet: testnet }),

      saveSettings: () => {
        const state = get();
        const settings = {
          apiKeys: state.apiKeys,
          isTestnet: state.isTestnet,
        };
        localStorage.setItem('trading-agent-settings', JSON.stringify(settings));
      },

      loadSettings: () => {
        const stored = localStorage.getItem('trading-agent-settings');
        if (stored) {
          try {
            const settings = JSON.parse(stored);
            set({
              apiKeys: settings.apiKeys || defaultApiKeys,
              isTestnet: settings.isTestnet ?? false,
            });
          } catch (error) {
            console.error('Failed to load settings:', error);
          }
        }
      },

      // ========================================================================
      // MARKET SLICE
      // ========================================================================
      selectedCoin: 'BTC',
      candles: [],
      orderBook: null,
      positions: [],
      accountBalance: 0,
      allMids: {},

      setSelectedCoin: (coin) => set({ selectedCoin: coin }),

      setCandles: (candles) => set({ candles }),

      setOrderBook: (orderBook) => set({ orderBook }),

      setPositions: (positions) => set({ positions }),

      setAccountBalance: (balance) => set({ accountBalance: balance }),

      setAllMids: (mids) => set({ allMids: mids }),

      updateAllMids: (updates) =>
        set((state) => ({
          allMids: { ...state.allMids, ...updates },
        })),

      // ========================================================================
      // STRATEGY SLICE
      // ========================================================================
      strategies: {
        mean_reversion: { enabled: true, weight: 1, params: { threshold: 2 } },
        momentum: { enabled: true, weight: 1, params: { period: 20 } },
        breakout: { enabled: true, weight: 1, params: { lookback: 20 } },
        macd_cross: { enabled: true, weight: 1, params: {} },
      },
      signals: [],
      compositeSignal: defaultCompositeSignal,

      toggleStrategy: (strategyName, enabled) =>
        set((state) => ({
          strategies: {
            ...state.strategies,
            [strategyName]: { ...state.strategies[strategyName], enabled },
          },
        })),

      setWeight: (strategyName, weight) =>
        set((state) => ({
          strategies: {
            ...state.strategies,
            [strategyName]: { ...state.strategies[strategyName], weight },
          },
        })),

      setStrategyParam: (strategyName, param, value) =>
        set((state) => ({
          strategies: {
            ...state.strategies,
            [strategyName]: {
              ...state.strategies[strategyName],
              params: {
                ...state.strategies[strategyName].params,
                [param]: value,
              },
            },
          },
        })),

      setSignals: (signals) => set({ signals }),

      setCompositeSignal: (signal) => set({ compositeSignal: signal }),

      // ========================================================================
      // TRADING SLICE
      // ========================================================================
      openOrders: [],
      recentTrades: [],
      isAutoTrading: false,
      riskSettings: defaultRiskSettings,

      setOpenOrders: (orders) => set({ openOrders: orders }),

      addOrder: (order) =>
        set((state) => ({
          openOrders: [...state.openOrders, order],
        })),

      removeOrder: (orderId) =>
        set((state) => ({
          openOrders: state.openOrders.filter((o) => o.id !== orderId),
        })),

      addTrade: (trade) =>
        set((state) => ({
          recentTrades: [trade, ...state.recentTrades].slice(0, 50),
        })),

      toggleAutoTrading: (enabled) => set({ isAutoTrading: enabled }),

      setRiskSettings: (settings) =>
        set((state) => ({
          riskSettings: { ...state.riskSettings, ...settings },
        })),

      // ========================================================================
      // AI SLICE
      // ========================================================================
      analysisResult: null,
      isAnalyzing: false,
      chatMessages: [],

      setAnalysis: (result) => set({ analysisResult: result }),

      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      clearChatMessages: () => set({ chatMessages: [] }),

      // ========================================================================
      // INTELLIGENCE SLICE
      // ========================================================================
      learningProgress: defaultLearningProgress,
      strategyRankings: [],
      currentRegime: 'ranging' as MarketRegime,

      setLearningProgress: (progress) =>
        set((state) => ({
          learningProgress: { ...state.learningProgress, ...progress },
        })),

      setStrategyRankings: (rankings) => set({ strategyRankings: rankings }),

      setCurrentRegime: (regime) => set({ currentRegime: regime }),
    }),
    {
      name: 'trading-agent-store',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        isTestnet: state.isTestnet,
        riskSettings: state.riskSettings,
        strategies: state.strategies,
        learningProgress: state.learningProgress,
        strategyRankings: state.strategyRankings,
      }),
    }
  )
);
