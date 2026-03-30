import { ethers } from 'ethers';
import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MarketData {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

export interface AssetContext {
  dayNtlVlm: string;
  markPx: string;
  midPx: string;
  prevDayPx: string;
  openInterest: string;
  impactPxs: string[];
}

export interface CandleData {
  t: number;
  T: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
  n: number;
}

export interface OrderBookLevel {
  px: string;
  sz: string;
  n?: number;
}

export interface OrderBook {
  coin: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  ts: number;
}

export interface Position {
  coin: string;
  szi: string;
  leverage: {
    type: string;
    value: number;
  };
  marginUsed: string;
  liquidationPx: string | null;
  unrealizedPnl: string;
  realizedPnl: string;
  fundingUnrealized: string;
  openCost: string;
}

export interface Balance {
  coin: string;
  total: string;
  hold: string;
}

export interface AccountState {
  assetPositions: Position[];
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalNtlVlm: string;
  };
  crossCollateral: string;
  crossMarginSummary: {
    totalMarginUsed: string;
  } | null;
  time: number;
}

export interface OrderStatus {
  order: OrderRequest;
  status: string;
  filledSize: string;
  avgFillPx: string;
  clOrdId: string;
}

export interface Fill {
  coin: string;
  px: string;
  sz: string;
  side: 'A' | 'B';
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string | null;
  oid: number;
  fee: string;
  tid: number;
  clOrdId: string;
}

export interface FundingRate {
  time: number;
  fundingRate: string;
  premium: string;
  openInterest: string;
}

export interface OrderRequest {
  coin: string;
  isBuy: boolean;
  sz: number;
  limitPx: number;
  orderType: 'Limit' | 'Market';
  reduceOnly: boolean;
  clOrdId?: string;
}

export interface OrderResponse {
  status: string;
  response: {
    type: string;
    data?: {
      orderId: number;
      clOrdId: string;
    };
  };
}

export interface AllMids {
  [coin: string]: string;
}

export interface L2Snapshot {
  coin: string;
  time: number;
  levels: Array<[OrderBookLevel[], OrderBookLevel[]]>;
}

export interface HyperliquidConfig {
  privateKey?: string;
  walletAddress?: string;
  isTestnet?: boolean;
  timeout?: number;
  maxRetries?: number;
}

// ============================================================================
// EIP-712 Typed Data
// ============================================================================

const EIP712_ORDER_TYPES = {
  Order: [
    { name: 'coin', type: 'string' },
    { name: 'isBuy', type: 'bool' },
    { name: 'sz', type: 'uint64' },
    { name: 'limitPx', type: 'uint64' },
    { name: 'orderType', type: 'string' },
    { name: 'reduceOnly', type: 'bool' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'clOrdId', type: 'uint64' },
  ],
};

const EIP712_CANCEL_TYPES = {
  CancelOrder: [
    { name: 'coin', type: 'string' },
    { name: 'oid', type: 'uint64' },
    { name: 'orderType', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
  ],
};

const EIP712_CANCEL_ALL_TYPES = {
  CancelAllOrders: [
    { name: 'time', type: 'uint64' },
  ],
};

// ============================================================================
// HyperliquidClient Class
// ============================================================================

export class HyperliquidClient {
  private apiBaseUrl: string;
  private wallet: ethers.Wallet | null;
  private walletAddress: string | null;
  private isTestnet: boolean;
  private client: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;
  private chainId: number;

  constructor(config: HyperliquidConfig = {}) {
    const {
      privateKey,
      walletAddress,
      isTestnet = false,
      timeout = 30000,
      maxRetries = 3,
    } = config;

    this.isTestnet = isTestnet;
    this.chainId = isTestnet ? 1337 : 42161;
    this.apiBaseUrl = isTestnet
      ? 'https://api.hyperliquid-testnet.xyz'
      : 'https://api.hyperliquid.xyz';
    this.maxRetries = maxRetries;
    this.retryDelay = 1000; // milliseconds

    // Initialize wallet if private key provided
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey);
      this.walletAddress = this.wallet.address;
    } else {
      this.wallet = null;
      this.walletAddress = walletAddress || null;
    }

    // Initialize axios client with rate limiting
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          // Rate limited - could implement exponential backoff here
          console.warn('Rate limited by Hyperliquid API');
        }
        return Promise.reject(error);
      }
    );
  }

  // ========================================================================
  // Public Methods - Market Data (No Auth Required)
  // ========================================================================

  /**
   * Fetch all market metadata and asset contexts
   */
  async getMarketData(): Promise<{
    metas: MarketData[];
    contexts: AssetContext[];
  }> {
    try {
      const metas = await this.infoPost({ type: 'metaAndAssetCtxs' });
      return metas;
    } catch (error) {
      throw new Error(`Failed to fetch market data: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch candlestick OHLCV data
   */
  async getCandles(
    coin: string,
    interval: string,
    startTime?: number,
    endTime?: number
  ): Promise<CandleData[]> {
    try {
      const payload: any = {
        type: 'candle',
        req: {
          coin,
          interval,
        },
      };

      if (startTime !== undefined) payload.req.startTime = startTime;
      if (endTime !== undefined) payload.req.endTime = endTime;

      const candles = await this.infoPost(payload);
      return candles;
    } catch (error) {
      throw new Error(
        `Failed to fetch candles for ${coin}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Fetch current order book for a coin
   */
  async getOrderBook(coin: string): Promise<OrderBook> {
    try {
      const orderBook = await this.infoPost({
        type: 'l1',
        coin,
      });
      return orderBook;
    } catch (error) {
      throw new Error(
        `Failed to fetch order book for ${coin}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Fetch all mid prices
   */
  async getAllMids(): Promise<AllMids> {
    try {
      const mids = await this.infoPost({ type: 'allMids' });
      return mids;
    } catch (error) {
      throw new Error(`Failed to fetch all mids: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch level 2 snapshot for a coin
   */
  async getL2Snapshot(coin: string): Promise<L2Snapshot> {
    try {
      const snapshot = await this.infoPost({
        type: 'l2Book',
        coin,
      });
      return snapshot;
    } catch (error) {
      throw new Error(
        `Failed to fetch L2 snapshot for ${coin}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Fetch recent trades for a coin
   */
  async getRecentTrades(coin: string): Promise<any[]> {
    try {
      const trades = await this.infoPost({
        type: 'trades',
        coin,
      });
      return trades;
    } catch (error) {
      throw new Error(
        `Failed to fetch recent trades for ${coin}: ${this.getErrorMessage(error)}`
      );
    }
  }

  // ========================================================================
  // Account Methods (Require Wallet Address)
  // ========================================================================

  /**
   * Get account state including positions, balances, and margin
   */
  async getAccountState(): Promise<AccountState> {
    if (!this.walletAddress) {
      throw new Error(
        'Wallet address required. Initialize client with walletAddress or privateKey'
      );
    }

    try {
      const accountState = await this.infoPost({
        type: 'clearinghouseState',
        user: this.walletAddress,
      });
      return accountState;
    } catch (error) {
      throw new Error(
        `Failed to fetch account state: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get all open orders for the account
   */
  async getOpenOrders(): Promise<OrderStatus[]> {
    if (!this.walletAddress) {
      throw new Error(
        'Wallet address required. Initialize client with walletAddress or privateKey'
      );
    }

    try {
      const orders = await this.infoPost({
        type: 'openOrders',
        user: this.walletAddress,
      });
      return orders;
    } catch (error) {
      throw new Error(
        `Failed to fetch open orders: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get user fills/trade history
   */
  async getUserFills(coin?: string): Promise<Fill[]> {
    if (!this.walletAddress) {
      throw new Error(
        'Wallet address required. Initialize client with walletAddress or privateKey'
      );
    }

    try {
      const payload: any = {
        type: 'userFills',
        user: this.walletAddress,
      };

      if (coin) payload.coin = coin;

      const fills = await this.infoPost(payload);
      return fills;
    } catch (error) {
      throw new Error(
        `Failed to fetch user fills: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get funding rate history for a coin
   */
  async getFundingHistory(coin: string): Promise<FundingRate[]> {
    try {
      const history = await this.infoPost({
        type: 'fundingHistory',
        coin,
        startTime: 0,
      });
      return history;
    } catch (error) {
      throw new Error(
        `Failed to fetch funding history for ${coin}: ${this.getErrorMessage(error)}`
      );
    }
  }

  // ========================================================================
  // Trading Methods (Require Private Key for Signing)
  // ========================================================================

  /**
   * Place a new order (limit or market)
   */
  async placeOrder(
    coin: string,
    isBuy: boolean,
    size: number,
    price: number,
    orderType: 'Limit' | 'Market' = 'Limit',
    reduceOnly: boolean = false,
    clOrdId?: string
  ): Promise<OrderResponse> {
    if (!this.wallet) {
      throw new Error(
        'Private key required to place orders. Initialize client with privateKey'
      );
    }

    try {
      const order = this.buildOrderWire({
        coin,
        isBuy,
        sz: size,
        limitPx: price,
        orderType,
        reduceOnly,
        clOrdId: clOrdId ? BigInt(clOrdId) : undefined,
      });

      const nonce = Date.now();
      const signature = await this.signRequest('order', order, nonce);

      const payload = {
        action: 'order',
        nonce,
        signature,
        order,
      };

      const response = await this.post('/exchange', payload);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to place order: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Cancel an open order
   */
  async cancelOrder(coin: string, orderId: number): Promise<OrderResponse> {
    if (!this.wallet) {
      throw new Error(
        'Private key required to cancel orders. Initialize client with privateKey'
      );
    }

    try {
      const nonce = Date.now();
      const cancelData = {
        coin,
        oid: orderId,
        orderType: 'Limit',
        timestamp: BigInt(nonce),
      };

      const signature = await this.signRequest('cancelOrder', cancelData, nonce);

      const payload = {
        action: 'cancelOrder',
        nonce,
        signature,
        cancelOrder: cancelData,
      };

      const response = await this.post('/exchange', payload);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to cancel order ${orderId}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Cancel all open orders
   */
  async cancelAllOrders(): Promise<OrderResponse> {
    if (!this.wallet) {
      throw new Error(
        'Private key required to cancel orders. Initialize client with privateKey'
      );
    }

    try {
      const nonce = Date.now();
      const cancelAllData = {
        time: BigInt(nonce),
      };

      const signature = await this.signRequest('cancelAllOrders', cancelAllData, nonce);

      const payload = {
        action: 'cancelAllOrders',
        nonce,
        signature,
        cancelAllOrders: cancelAllData,
      };

      const response = await this.post('/exchange', payload);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to cancel all orders: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(
    orderId: number,
    coin: string,
    isBuy: boolean,
    size: number,
    price: number
  ): Promise<OrderResponse> {
    if (!this.wallet) {
      throw new Error(
        'Private key required to modify orders. Initialize client with privateKey'
      );
    }

    try {
      // Cancel existing order and place new one
      await this.cancelOrder(coin, orderId);
      const newOrder = await this.placeOrder(coin, isBuy, size, price, 'Limit', false);
      return newOrder;
    } catch (error) {
      throw new Error(
        `Failed to modify order ${orderId}: ${this.getErrorMessage(error)}`
      );
    }
  }

  // ========================================================================
  // Private/Helper Methods
  // ========================================================================

  /**
   * Build order data structure for API
   */
  private buildOrderWire(order: Partial<OrderRequest>): any {
    const timestamp = Date.now();

    return {
      coin: order.coin,
      isBuy: order.isBuy,
      sz: BigInt(Math.floor((order.sz || 0) * 1e8)), // Convert to satoshis
      limitPx: BigInt(Math.floor((order.limitPx || 0) * 1e8)),
      orderType: order.orderType || 'Limit',
      reduceOnly: order.reduceOnly || false,
      timestamp: BigInt(timestamp),
      clOrdId: order.clOrdId || BigInt(0),
    };
  }

  /**
   * Sign request using EIP-712
   */
  private async signRequest(
    action: 'order' | 'cancelOrder' | 'cancelAllOrders',
    data: any,
    nonce: number
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const domain = {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId: this.chainId,
    };

    let types: any;
    let value: any;

    if (action === 'order') {
      types = EIP712_ORDER_TYPES;
      value = data;
    } else if (action === 'cancelOrder') {
      types = EIP712_CANCEL_TYPES;
      value = data;
    } else if (action === 'cancelAllOrders') {
      types = EIP712_CANCEL_ALL_TYPES;
      value = data;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    try {
      const signature = await this.wallet.signTypedData(domain, types, value);
      return signature;
    } catch (error) {
      throw new Error(
        `Failed to sign request: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * POST request to info API endpoint (no auth required)
   */
  private async infoPost(payload: any): Promise<any> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.post('/info', payload);
      return response.data;
    });
  }

  /**
   * POST request to exchange endpoint (auth required)
   */
  private async post(endpoint: string, payload: any): Promise<any> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.post(endpoint, payload);
      return response.data;
    });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        attempt < this.maxRetries &&
        axios.isAxiosError(error) &&
        (error.code === 'ECONNABORTED' ||
          error.code === 'ECONNREFUSED' ||
          (error.response?.status && error.response.status >= 500))
      ) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
        return this.retryWithBackoff(fn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error'
      );
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Get client configuration
   */
  getConfig(): {
    isTestnet: boolean;
    walletAddress: string | null;
    apiBaseUrl: string;
    hasPrivateKey: boolean;
  } {
    return {
      isTestnet: this.isTestnet,
      walletAddress: this.walletAddress,
      apiBaseUrl: this.apiBaseUrl,
      hasPrivateKey: this.wallet !== null,
    };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

let defaultClient: HyperliquidClient | null = null;

export function initializeHyperliquidClient(config: HyperliquidConfig): HyperliquidClient {
  defaultClient = new HyperliquidClient(config);
  return defaultClient;
}

export function getHyperliquidClient(): HyperliquidClient {
  if (!defaultClient) {
    defaultClient = new HyperliquidClient();
  }
  return defaultClient;
}
