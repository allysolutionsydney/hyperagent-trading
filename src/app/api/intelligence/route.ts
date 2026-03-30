import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceEngine, StoredIntelligence } from '@/lib/intelligence';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const intelligenceStateStr = searchParams.get('state');

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    let engine: IntelligenceEngine;
    if (intelligenceStateStr) {
      try {
        const state = JSON.parse(intelligenceStateStr) as StoredIntelligence;
        engine = IntelligenceEngine.fromJSON(state);
      } catch {
        engine = new IntelligenceEngine();
      }
    } else {
      engine = new IntelligenceEngine();
    }

    let data: any;

    switch (action) {
      case 'report': {
        data = engine.generateReport();
        break;
      }

      case 'rankings': {
        data = engine.getStrategyRankings();
        break;
      }

      case 'progress': {
        data = engine.getLearningProgress();
        break;
      }

      case 'settings': {
        data = engine.getOptimalSettings();
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      data,
      intelligenceState: engine.toJSON(),
    });
  } catch (error) {
    console.error('Intelligence API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, intelligenceState } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    let engine: IntelligenceEngine;
    if (intelligenceState) {
      engine = IntelligenceEngine.fromJSON(intelligenceState);
    } else {
      engine = new IntelligenceEngine();
    }

    let result: any;

    switch (action) {
      case 'record-trade': {
        if (!data || !data.trade || !data.outcome) {
          return NextResponse.json(
            { error: 'Missing required parameters: data.trade and data.outcome' },
            { status: 400 }
          );
        }
        engine.recordTrade(data.trade, data.outcome);
        result = { success: true, message: 'Trade recorded' };
        break;
      }

      case 'detect-regime': {
        if (!data) {
          return NextResponse.json(
            { error: 'Missing required parameter: data' },
            { status: 400 }
          );
        }
        result = engine.detectMarketRegime(data);
        break;
      }

      case 'reset': {
        engine.resetLearning();
        result = { success: true, message: 'Learning data reset' };
        break;
      }

      case 'export': {
        result = engine.exportIntelligence();
        break;
      }

      case 'import': {
        if (!data) {
          return NextResponse.json(
            { error: 'Missing required parameter: data' },
            { status: 400 }
          );
        }
        engine.importIntelligence(data);
        result = { success: true, message: 'Intelligence data imported' };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      data: result,
      intelligenceState: engine.toJSON(),
    });
  } catch (error) {
    console.error('Intelligence API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
