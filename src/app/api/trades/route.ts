import { NextRequest, NextResponse } from 'next/server';
import { HyperliquidClient } from '@/lib/hyperliquid';

interface RiskConfig {
  maxPositionSize?: number;
  dailyLossLimit?: number;
  stopLossRequired?: boolean;
  maxLeverage?: number;
}

async function validateRiskManagement(
  params: any,
  riskConfig: RiskConfig
): Promise<{ valid: boolean; reason?: string }> {
  if (riskConfig.maxPositionSize && params.size) {
    if (params.size > riskConfig.maxPositionSize) {
      return {
        valid: false,
        reason: `Position size ${params.size} exceeds maximum allowed ${riskConfig.maxPositionSize}`,
      };
    }
  }

  if (riskConfig.maxLeverage && params.leverage) {
    if (params.leverage > riskConfig.maxLeverage) {
      return {
        valid: false,
        reason: `Leverage ${params.leverage}x exceeds maximum allowed ${riskConfig.maxLeverage}x`,
      };
    }
  }

  if (riskConfig.stopLossRequired && !params.stopLoss) {
    return {
      valid: false,
      reason: 'Stop loss is required for this trade',
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      wallet,
      privateKey,
      isTestnet = false,
      riskConfig,
      ...params
    } = body;

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

    if (['place', 'modify'].includes(action) && riskConfig) {
      const riskValidation = await validateRiskManagement(params, riskConfig);
      if (!riskValidation.valid) {
        return NextResponse.json(
          { error: riskValidation.reason },
          { status: 400 }
        );
      }
    }

    const client = new HyperliquidClient({
      walletAddress: wallet,
      privateKey,
      isTestnet,
    });

    switch (action) {
      case 'place': {
        const { coin, isBuy, size, price, orderType = 'Limit', reduceOnly = false, clOrdId } = params;
        if (!coin || size === undefined || price === undefined || typeof isBuy !== 'boolean') {
          return NextResponse.json(
            { error: 'Missing required parameters: coin, isBuy, size, price' },
            { status: 400 }
          );
        }

        const result = await client.placeOrder(
          coin,
          isBuy,
          Number(size),
          Number(price),
          orderType,
          reduceOnly,
          clOrdId
        );
        return NextResponse.json({ data: result });
      }

      case 'cancel': {
        if (!params.coin || params.orderId === undefined) {
          return NextResponse.json(
            { error: 'Missing required parameters: coin, orderId' },
            { status: 400 }
          );
        }
        const result = await client.cancelOrder(params.coin, Number(params.orderId));
        return NextResponse.json({ data: result });
      }

      case 'cancelAll': {
        const result = await client.cancelAllOrders();
        return NextResponse.json({ data: result });
      }

      case 'modify': {
        const { orderId, coin, isBuy, size, price } = params;
        if (!coin || orderId === undefined || size === undefined || price === undefined || typeof isBuy !== 'boolean') {
          return NextResponse.json(
            { error: 'Missing required parameters: orderId, coin, isBuy, size, price' },
            { status: 400 }
          );
        }
        const result = await client.modifyOrder(
          Number(orderId),
          coin,
          isBuy,
          Number(size),
          Number(price)
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
    console.error('Trades API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
