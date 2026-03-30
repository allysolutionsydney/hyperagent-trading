import { NextRequest, NextResponse } from 'next/server';
import { StrategyManager } from '@/lib/strategies';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyConfig {
  name: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, candles, config, startTime, endTime } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'run': {
        if (!candles || !Array.isArray(candles)) {
          return NextResponse.json(
            { error: 'Missing or invalid required parameter: candles' },
            { status: 400 }
          );
        }

        if (!config || !Array.isArray(config)) {
          return NextResponse.json(
            { error: 'Missing or invalid required parameter: config' },
            { status: 400 }
          );
        }

        const manager = new StrategyManager(config);
        const results = manager.runStrategies(candles);

        return NextResponse.json({
          data: {
            individualSignals: results.individualSignals,
            compositeSignal: results.compositeSignal,
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'backtest': {
        if (!candles || !Array.isArray(candles)) {
          return NextResponse.json(
            { error: 'Missing or invalid required parameter: candles' },
            { status: 400 }
          );
        }

        if (!config || !Array.isArray(config)) {
          return NextResponse.json(
            { error: 'Missing or invalid required parameter: config' },
            { status: 400 }
          );
        }

        const manager = new StrategyManager(config);
        const backtest = await manager.backtestStrategies(candles);

        return NextResponse.json({
          data: {
            results: backtest.results,
            performance: backtest.performance,
            stats: backtest.stats,
            timestamp: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Strategies API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
