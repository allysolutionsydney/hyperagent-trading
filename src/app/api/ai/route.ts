import { NextRequest, NextResponse } from 'next/server';
import { AIAnalyzer } from '@/lib/openai';

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
        if (!data) {
          return NextResponse.json(
            { error: 'Missing required parameter: data' },
            { status: 400 }
          );
        }
        const result = await analyzer.analyzeMarketData(data);
        return NextResponse.json({ data: result });
      }

      case 'sentiment': {
        if (!data || !data.text) {
          return NextResponse.json(
            { error: 'Missing required parameter: data.text' },
            { status: 400 }
          );
        }
        const result = await analyzer.analyzeSentiment(data.text);
        return NextResponse.json({ data: result });
      }

      case 'trade-idea': {
        if (!data) {
          return NextResponse.json(
            { error: 'Missing required parameter: data' },
            { status: 400 }
          );
        }
        const result = await analyzer.generateTradeIdea(data);
        return NextResponse.json({ data: result });
      }

      case 'evaluate': {
        if (!data) {
          return NextResponse.json(
            { error: 'Missing required parameter: data' },
            { status: 400 }
          );
        }
        const result = await analyzer.evaluateStrategy(data);
        return NextResponse.json({ data: result });
      }

      case 'chat': {
        if (!data || !data.message) {
          return NextResponse.json(
            { error: 'Missing required parameter: data.message' },
            { status: 400 }
          );
        }
        const result = await analyzer.chat(
          data.message,
          data.context || undefined
        );
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
