import { useEffect, useRef, useState } from 'react';
import { useStore } from './useStore';

interface UseAccountStateReturn {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function normalizePosition(assetPosition: any, mids: Record<string, string>) {
  const position = assetPosition?.position || assetPosition;
  const size = Number(position?.szi || 0);
  const entryPrice = Number(position?.entryPx || position?.entryPrice || 0);
  const unrealizedPnL = Number(position?.unrealizedPnl || 0);
  const leverageValue = Number(position?.leverage?.value || 1);
  const liquidationPrice = Number(position?.liquidationPx || 0);
  const coin = position?.coin || 'UNKNOWN';
  const currentPrice = Number(mids?.[coin] || 0);

  return {
    symbol: coin,
    coin,
    asset: coin,
    size,
    szi: size,
    direction: size >= 0 ? 'Long' : 'Short',
    entryPrice,
    entryPx: entryPrice,
    currentPrice,
    pnl: unrealizedPnL,
    unrealizedPnl: unrealizedPnL,
    unrealizedPnL,
    pnlPercent: entryPrice ? (unrealizedPnL / Math.max(Math.abs(size * entryPrice), 1)) * 100 : 0,
    leverage: leverageValue,
    margin: Number(position?.marginUsed || 0),
    marginUsed: Number(position?.marginUsed || 0),
    liquidationPrice,
    liquidationPx: liquidationPrice,
    collateralUsed: Number(position?.marginUsed || 0),
    timestamp: Date.now(),
    raw: position,
  };
}

function normalizeOpenOrder(orderStatus: any) {
  const order = orderStatus?.order || orderStatus;
  const quantity = Number(order?.sz || 0);
  const filled = Number(orderStatus?.filledSize || 0);

  return {
    id: String(order?.clOrdId || orderStatus?.clOrdId || order?.oid || Date.now()),
    timestamp: Date.now(),
    symbol: order?.coin || 'UNKNOWN',
    coin: order?.coin || 'UNKNOWN',
    side: order?.isBuy ? 'buy' : 'sell',
    type: String(order?.orderType || 'limit').toLowerCase(),
    orderType: String(order?.orderType || 'Limit'),
    price: Number(order?.limitPx || 0),
    quantity,
    size: quantity,
    filled,
    remaining: Math.max(quantity - filled, 0),
    status: String(orderStatus?.status || 'open').toLowerCase(),
    raw: orderStatus,
  };
}

export function useAccountState(): UseAccountStateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    apiKeys,
    isTestnet,
    allMids,
    setPositions,
    setOpenOrders,
    setAccountBalance,
  } = useStore();

  const fetchAccountState = async () => {
    if (!apiKeys.hyperliquidWallet) {
      setPositions([]);
      setOpenOrders([]);
      setAccountBalance(0);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const wallet = encodeURIComponent(apiKeys.hyperliquidWallet);
      const privateKeyPart = apiKeys.hyperliquidPrivateKey
        ? `&privateKey=${encodeURIComponent(apiKeys.hyperliquidPrivateKey)}`
        : '';
      const testnetPart = isTestnet ? '&testnet=true' : '';

      const stateResponse = await fetch(
        `/api/hyperliquid/account?action=state&wallet=${wallet}${privateKeyPart}${testnetPart}`
      );

      if (!stateResponse.ok) {
        throw new Error(`Failed to fetch account state: ${stateResponse.statusText}`);
      }

      const stateJson = await stateResponse.json();
      const state = stateJson.data;

      const positions = Array.isArray(state?.assetPositions)
        ? state.assetPositions.map((p: any) => normalizePosition(p, allMids || {}))
        : [];
      setPositions(positions as any);
      setAccountBalance(Number(state?.marginSummary?.accountValue || 0));

      const ordersResponse = await fetch(
        `/api/hyperliquid/account?action=orders&wallet=${wallet}${privateKeyPart}${testnetPart}`
      );

      if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch open orders: ${ordersResponse.statusText}`);
      }

      const ordersJson = await ordersResponse.json();
      const orders = Array.isArray(ordersJson.data)
        ? ordersJson.data.map(normalizeOpenOrder)
        : [];
      setOpenOrders(orders as any);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Account state fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchAccountState();
  };

  useEffect(() => {
    void fetchAccountState();

    pollIntervalRef.current = setInterval(() => {
      void fetchAccountState();
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [apiKeys.hyperliquidWallet, apiKeys.hyperliquidPrivateKey, isTestnet, allMids]);

  return {
    isLoading,
    error,
    refresh,
  };
}
