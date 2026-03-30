import { NextRequest, NextResponse } from 'next/server';
import { HyperliquidClient } from '@/lib/hyperliquid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    const client = new HyperliquidClient();

    switch (action) {
      case 'candles': {
        const coin = searchParams.get('coin');
        const interval = searchParams.get('interval');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');

        if (!coin || !interval) {
          return NextResponse.json(
            { error: 'Missing required parameters: coin, interval' },
            { status: 400 }
          );
        }

        const candles = await client.getCandles(
          coin,
          interval,
          startTime ? parseInt(startTime) : undefined,
          endTime ? parseInt(endTime) : undefined
        );
        return NextResponse.json({ data: candles });
      }

      case 'orderbook': {
        const coin = searchParams.get('coin');
        if (!coin) {
          return NextResponse.json(
            { error: 'Missing required parameter: coin' },
            { status: 400 }
          );
        }
        const orderbook = await client.getOrderbook(coin);
        return NextResponse.json({ data: orderbook });
      }

      case 'allmids': {
        const mids = await client.getAllMids();
        return NextResponse.json({ data: mids });
      }

      case 'trades': {
        const coin = searchParams.get('coin');
        if (!coin) {
          return NextResponse.json(
            { error: 'Missing required parameter: coin' },
            { status: 400 }
          );
        }
        const trades = await client.getRecentTrades(coin);
        return NextResponse.json({ data: trades });
      }

      case 'markets': {
        const markets = await client.getMarkets();
        return NextResponse.json({ data: markets });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Hyperliquid API error:', error);
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
    const { action, wallet, privateKey, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    if (!wallet || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: wallet, privateKey' },
        { status: 400 }
      );
    }

    const client = new HyperliquidClient({
      wallet,
      privateKey,
      testnet: params.testnet || false,
    });

    switch (action) {
      case 'placeOrder': {
        const result = await client.placeOrder(params);
        return NextResponse.json({ data: result });
      }

      case 'cancelOrder': {
        const result = await client.cancelOrder(params);
        return NextResponse.json({ data: result });
      }

      case 'cancelAllOrders': {
        const result = await client.cancelAllOrders(params.coin);
        return NextResponse.json({ data: result });
      }

      case 'modifyOrder': {
        const result = await client.modifyOrder(params);
        return NextResponse.json({ data: result });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Hyperliquid API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
