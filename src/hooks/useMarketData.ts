import { useEffect, useRef, useState } from 'react';
import { useStore } from './useStore';

interface UseMarketDataReturn {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function normalizeCandle(c: any) {
  return {
    timestamp: c.timestamp ?? c.t,
    open: Number(c.open ?? c.o),
    high: Number(c.high ?? c.h),
    low: Number(c.low ?? c.l),
    close: Number(c.close ?? c.c),
    volume: Number(c.volume ?? c.v),
  };
}

function normalizeOrderBook(ob: any) {
  if (!ob) return null;

  const bids = Array.isArray(ob.bids)
    ? ob.bids.map((b: any) => [Number(b.px ?? b[0]), Number(b.sz ?? b[1])])
    : [];
  const asks = Array.isArray(ob.asks)
    ? ob.asks.map((a: any) => [Number(a.px ?? a[0]), Number(a.sz ?? a[1])])
    : [];

  const bestBid = bids[0]?.[0] ?? 0;
  const bestAsk = asks[0]?.[0] ?? 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const totalBid = bids.reduce((sum: number, [, size]: any) => sum + size, 0);
  const totalAsk = asks.reduce((sum: number, [, size]: any) => sum + size, 0);
  const bidAskRatio = totalAsk > 0 ? totalBid / totalAsk : 0;

  return {
    timestamp: ob.ts ?? Date.now(),
    bids,
    asks,
    spread,
    bidAskRatio,
  };
}

export function useMarketData(): UseMarketDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    selectedCoin,
    setCandles,
    setOrderBook,
    setAllMids,
    updateAllMids,
    isTestnet,
  } = useStore();

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const candlesResponse = await fetch(
        `/api/hyperliquid?action=candles&coin=${selectedCoin}&interval=1h${
          isTestnet ? '&testnet=true' : ''
        }`
      );

      if (!candlesResponse.ok) {
        throw new Error(`Failed to fetch candles: ${candlesResponse.statusText}`);
      }

      const candlesData = await candlesResponse.json();
      if (Array.isArray(candlesData.data)) {
        setCandles(candlesData.data.map(normalizeCandle));
      }

      const orderBookResponse = await fetch(
        `/api/hyperliquid?action=orderbook&coin=${selectedCoin}${
          isTestnet ? '&testnet=true' : ''
        }`
      );

      if (!orderBookResponse.ok) {
        throw new Error(`Failed to fetch order book: ${orderBookResponse.statusText}`);
      }

      const orderBookData = await orderBookResponse.json();
      if (orderBookData.data) {
        const normalized = normalizeOrderBook(orderBookData.data);
        if (normalized) setOrderBook(normalized);
      }

      const midsResponse = await fetch(
        `/api/hyperliquid?action=allmids${isTestnet ? '&testnet=true' : ''}`
      );

      if (!midsResponse.ok) {
        throw new Error(`Failed to fetch mid prices: ${midsResponse.statusText}`);
      }

      const midsData = await midsResponse.json();
      if (midsData.data) {
        if (Object.keys(midsData.data).length > 10) {
          setAllMids(midsData.data);
        } else {
          updateAllMids(midsData.data);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Market data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchMarketData();
  };

  useEffect(() => {
    fetchMarketData();

    pollIntervalRef.current = setInterval(() => {
      fetchMarketData();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedCoin, isTestnet]);

  return {
    isLoading,
    error,
    refresh,
  };
}
