import { useEffect, useRef, useState } from 'react';
import { useStore } from './useStore';
import { Candle, OrderBook } from '../types';

interface UseMarketDataReturn {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook that polls market data every 5 seconds
 * Fetches candles, order book, and mid prices for the selected coin
 * Automatically updates the store
 */
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

      // Fetch candles (1-hour timeframe)
      const candlesResponse = await fetch(
        `/api/hyperliquid/candles?coin=${selectedCoin}&interval=1h&limit=100${
          isTestnet ? '&testnet=true' : ''
        }`
      );

      if (!candlesResponse.ok) {
        throw new Error(`Failed to fetch candles: ${candlesResponse.statusText}`);
      }

      const candlesData = await candlesResponse.json();
      if (candlesData.success && Array.isArray(candlesData.data)) {
        setCandles(candlesData.data);
      }

      // Fetch order book
      const orderBookResponse = await fetch(
        `/api/hyperliquid/orderbook?coin=${selectedCoin}${
          isTestnet ? '&testnet=true' : ''
        }`
      );

      if (!orderBookResponse.ok) {
        throw new Error(`Failed to fetch order book: ${orderBookResponse.statusText}`);
      }

      const orderBookData = await orderBookResponse.json();
      if (orderBookData.success && orderBookData.data) {
        setOrderBook(orderBookData.data);
      }

      // Fetch all mid prices
      const midsResponse = await fetch(
        `/api/hyperliquid/mids${isTestnet ? '?testnet=true' : ''}`
      );

      if (!midsResponse.ok) {
        throw new Error(`Failed to fetch mid prices: ${midsResponse.statusText}`);
      }

      const midsData = await midsResponse.json();
      if (midsData.success && midsData.data) {
        // If we have all mids, replace entirely; otherwise update
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

  /**
   * Manual refresh function that fetches data immediately
   */
  const refresh = async () => {
    await fetchMarketData();
  };

  // Set up polling interval
  useEffect(() => {
    // Initial fetch
    fetchMarketData();

    // Set up interval for subsequent fetches
    pollIntervalRef.current = setInterval(() => {
      fetchMarketData();
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount or when dependencies change
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
