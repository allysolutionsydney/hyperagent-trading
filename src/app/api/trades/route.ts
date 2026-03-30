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
  // Check position size limit
  if (riskConfig.maxPositionSize && params.size) {
    if (params.size > riskConfig.maxPositionSize) {
      return {
        valid: false,
        reason: `Position size ${params.size} exceeds maximum allowed ${riskConfig.maxPositionSize}`,
      };
    }
  }

  // Check leverage limit
  if (riskConfig.maxLeverage && params.leverage) {
    if (params.leverage > riskConfig.maxLeverage) {
      return {
        valid: false,
        reason: `Leverage ${params.leverage}x exceeds maximum allowed ${riskConfig.maxLeverage}x`,
      };
    }
  }

  // Check stop loss requirement
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

    // Validate risk management for trade execution actions
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
      wallet,
      privateKey,
      testnet: isTestnet,
    });

    switch (action) {
      case 'place': {
        if (!params.coin || !params.size) {
          return NextResponse.json(
            { error: 'Missing required parameters: coin, size' },
            { status: 400 }
          );
        }
        const result = await client.placeOrder(params);
        return NextResponse.json({ data: result });
      }

      case 'cancel': {
        if (!params.coin || params.orderId === undefined) {
          return NextResponse.json(
            { error: 'Missing required parameters: coin, orderId' },
            { status: 400 }
          );
        }
        const result = await client.cancelOrder({
          coin: params.coin,
          orderId: params.orderId,
        });
        return NextResponse.json({ data: result });
      }

      case 'cancelAll': {
        if (!params.coin) {
          return NextResponse.json(
            { error: 'Missing required parameter: coin' },
            { status: 400 }
          );
        }
        const result = await client.cancelAllOrders(params.coin);
        return NextResponse.json({ data: result });
      }

      case 'modify': {
        if (!params.coin || params.orderId === undefined) {
          return NextResponse.json(
            { error: 'Missing required parameters: coin, orderId' },
            { status: 400 }
          );
        }
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
    console.error('Trades API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
