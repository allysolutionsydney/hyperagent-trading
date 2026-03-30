import { NextRequest, NextResponse } from 'next/server';
import { HyperliquidClient } from '@/lib/hyperliquid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const wallet = searchParams.get('wallet');
    const privateKey = searchParams.get('privateKey');

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing required parameter: wallet' },
        { status: 400 }
      );
    }

    const client = new HyperliquidClient({
      wallet,
      privateKey: privateKey || undefined,
      testnet: searchParams.get('testnet') === 'true',
    });

    switch (action) {
      case 'state': {
        const state = await client.getAccountState(wallet);
        return NextResponse.json({ data: state });
      }

      case 'orders': {
        if (!privateKey) {
          return NextResponse.json(
            { error: 'Missing required parameter: privateKey for orders action' },
            { status: 400 }
          );
        }
        const orders = await client.getOpenOrders(wallet);
        return NextResponse.json({ data: orders });
      }

      case 'fills': {
        if (!privateKey) {
          return NextResponse.json(
            { error: 'Missing required parameter: privateKey for fills action' },
            { status: 400 }
          );
        }
        const fills = await client.getUserFills(wallet);
        return NextResponse.json({ data: fills });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Account API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
