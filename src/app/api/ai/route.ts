import { NextRequest, NextResponse } from 'next/server';
import { AIAnalyzer } from '@/lib/openai';
import { Candle, TechnicalIndicators, Message, Trade, TradeOutcome } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, apiKey } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: apiKey' },
        { status: 400 }
      );
    }

    const analyzer = new AIAnalyzer(apiKey);

    switch (action) {
      case 'analyze': {
        if (!data?.candles || !Array.isArray(data.candles) || !data.coin || !data.indicators) {
          return NextResponse.json(
            { error: 'Missing required parameters: data.candles, data.coin, data.indicators' },
            { status: 400 }
          );
        }
        const result = await analyzer.analyzeMarket(
          data.candles as Candle[],
          data.coin,
          data.indicators as TechnicalIndicators
        );
        return NextResponse.json({ data: result });
      }

      case 'sentiment': {
        if (!data || typeof data !== 'object') {
          return NextResponse.json(
            { error: 'Missing required parameter: data' },
            { status: 400 }
          );
        }
        const result = await analyzer.analyzeSentiment(data);
        return NextResponse.json({ data: result });
      }

      case 'trade-idea': {
        if (!data?.analysis || !data?.riskParams) {
          return NextResponse.json(
            { error: 'Missing required parameters: data.analysis, data.riskParams' },
            { status: 400 }
          );
        }
        const result = await analyzer.generateTradeIdea(data.analysis, data.riskParams);
        return NextResponse.json({ data: result });
      }

      case 'evaluate': {
        if (!data?.trade || !data?.outcome) {
          return NextResponse.json(
            { error: 'Missing required parameters: data.trade, data.outcome' },
            { status: 400 }
          );
        }
        const result = await analyzer.evaluateTradeOutcome(
          data.trade as Trade,
          data.outcome as TradeOutcome
        );
        return NextResponse.json({ data: result });
      }

      case 'chat': {
        if (!data?.messages || !Array.isArray(data.messages)) {
          return NextResponse.json(
            { error: 'Missing required parameter: data.messages' },
            { status: 400 }
          );
        }
        const result = await analyzer.chat(data.messages as Message[]);
        return NextResponse.json({ data: result });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
