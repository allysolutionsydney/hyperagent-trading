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
import { StoredIntelligence } from '../lib/intelligence';

interface ApiKeys {
  openai: string;
  hyperliquidPrivateKey: string;
  hyperliquidWallet: string;
  openRouter: string;
}

interface SettingsSnapshot {
  apiKeys: {
    openai: string;
    hyperliquid: string;
    walletAddress: string;
    openrouter: string;
  };
  network: 'testnet' | 'mainnet';
  riskSettings: Record<string, any>;
  strategies: Record<string, any>;
  tradingPrefs: Record<string, any>;
}

interface SettingsSlice {
  apiKeys: ApiKeys;
  isTestnet: boolean;
  settings: SettingsSnapshot;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setTestnet: (testnet: boolean) => void;
  saveSettings: () => void;
  loadSettings: () => void;
  updateSettings: (settings: Partial<SettingsSnapshot>) => void;
}

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

interface AISlice {
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  chatMessages: Message[];
  setAnalysis: (result: AnalysisResult | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  addChatMessage: (message: Message) => void;
  clearChatMessages: () => void;
}

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
  intelligenceState: StoredIntelligence | null;
  setLearningProgress: (progress: Partial<LearningProgress>) => void;
  setStrategyRankings: (rankings: StrategyRanking[]) => void;
  setCurrentRegime: (regime: MarketRegime) => void;
  setIntelligenceState: (state: StoredIntelligence | null) => void;
  resetLearningData: () => void;
}

type AppStore = SettingsSlice &
  MarketSlice &
  StrategySlice &
  TradingSlice &
  AISlice &
  IntelligenceSlice;

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

const defaultSettings: SettingsSnapshot = {
  apiKeys: {
    openai: '',
    hyperliquid: '',
    walletAddress: '',
    openrouter: '',
  },
  network: 'testnet',
  riskSettings: {
    maxPositionSize: 10000,
    maxLeverage: 10,
    stopLossDefault: 5,
    takeProfitDefault: 15,
    maxDailyLoss: 5000,
    maxOpenPositions: 5,
  },
  strategies: {},
  tradingPrefs: {
    orderType: 'limit',
    defaultCoin: 'USDC',
    minSignalStrength: 60,
    minConfidence: 70,
    analysisInterval: 60,
    tradeCooldown: 30,
  },
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
      apiKeys: defaultApiKeys,
      isTestnet: false,
      settings: defaultSettings,

      setApiKey: (provider, key) =>
        set((state) => {
          const nextApiKeys = { ...state.apiKeys, [provider]: key };
          return {
            apiKeys: nextApiKeys,
            settings: {
              ...state.settings,
              apiKeys: {
                openai: nextApiKeys.openai,
                hyperliquid: nextApiKeys.hyperliquidPrivateKey,
                walletAddress: nextApiKeys.hyperliquidWallet,
                openrouter: nextApiKeys.openRouter,
              },
            },
          };
        }),

      setTestnet: (testnet) =>
        set((state) => ({
          isTestnet: testnet,
          settings: {
            ...state.settings,
            network: testnet ? 'testnet' : 'mainnet',
          },
        })),

      saveSettings: () => {
        const state = get();
        const settings = {
          apiKeys: state.apiKeys,
          isTestnet: state.isTestnet,
          settings: state.settings,
        };
        localStorage.setItem('trading-agent-settings', JSON.stringify(settings));
      },

      loadSettings: () => {
        const stored = localStorage.getItem('trading-agent-settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set({
              apiKeys: parsed.apiKeys || defaultApiKeys,
              isTestnet: parsed.isTestnet ?? false,
              settings: parsed.settings || defaultSettings,
            });
          } catch (error) {
            console.error('Failed to load settings:', error);
          }
        }
      },

      updateSettings: (incoming) =>
        set((state) => {
          const nextSettings: SettingsSnapshot = {
            ...state.settings,
            ...incoming,
            apiKeys: {
              ...state.settings.apiKeys,
              ...(incoming.apiKeys || {}),
            },
          };

          return {
            settings: nextSettings,
            apiKeys: {
              openai: nextSettings.apiKeys.openai || '',
              hyperliquidPrivateKey: nextSettings.apiKeys.hyperliquid || '',
              hyperliquidWallet: nextSettings.apiKeys.walletAddress || '',
              openRouter: nextSettings.apiKeys.openrouter || '',
            },
            isTestnet: nextSettings.network === 'testnet',
          };
        }),

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

      learningProgress: defaultLearningProgress,
      strategyRankings: [],
      currentRegime: 'ranging' as MarketRegime,
      intelligenceState: null,

      setLearningProgress: (progress) =>
        set((state) => ({
          learningProgress: { ...state.learningProgress, ...progress },
        })),

      setStrategyRankings: (rankings) => set({ strategyRankings: rankings }),
      setCurrentRegime: (regime) => set({ currentRegime: regime }),
      setIntelligenceState: (state) => set({ intelligenceState: state }),
      resetLearningData: () =>
        set({
          intelligenceState: null,
          learningProgress: defaultLearningProgress,
          strategyRankings: [],
          currentRegime: 'ranging' as MarketRegime,
        }),
    }),
    {
      name: 'trading-agent-store',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        isTestnet: state.isTestnet,
        settings: state.settings,
        riskSettings: state.riskSettings,
        strategies: state.strategies,
        learningProgress: state.learningProgress,
        strategyRankings: state.strategyRankings,
        intelligenceState: state.intelligenceState,
      }),
    }
  )
);
