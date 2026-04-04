import { NextRequest, NextResponse } from 'next/server';
import { createDefaultStrategyManager } from '@/lib/strategies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, candles, aiResponse } = body;

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

        const manager = createDefaultStrategyManager();
        const result = manager.analyze(candles, aiResponse);

        return NextResponse.json({
          data: {
            signals: result.signals,
            compositeSignal: result.compositeSignal,
            compositeStrength: result.compositeStrength,
            compositeConfidence: result.compositeConfidence,
            reasoning: result.reasoning,
            timestamp: result.timestamp,
          },
        });
      }

      case 'performance': {
        const manager = createDefaultStrategyManager();
        return NextResponse.json({
          data: {
            performance: manager.getPerformance(),
            timestamp: Date.now(),
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
