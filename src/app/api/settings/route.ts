import { NextRequest, NextResponse } from 'next/server';

interface Settings {
  apiKeys?: {
    hyperliquid?: string;
    openai?: string;
  };
  riskParams?: {
    maxPositionSize?: number;
    dailyLossLimit?: number;
    maxLeverage?: number;
    stopLossRequired?: boolean;
  };
  strategyConfigs?: Array<{
    name: string;
    enabled: boolean;
    parameters?: Record<string, any>;
  }>;
  uiPreferences?: {
    theme?: 'light' | 'dark';
    refreshInterval?: number;
    chartTimeframe?: string;
  };
}

const DEFAULT_SETTINGS: Settings = {
  apiKeys: {
    hyperliquid: '[ENCRYPTED]',
    openai: '[ENCRYPTED]',
  },
  riskParams: {
    maxPositionSize: 10,
    dailyLossLimit: 1000,
    maxLeverage: 20,
    stopLossRequired: true,
  },
  strategyConfigs: [
    {
      name: 'moving-average',
      enabled: true,
      parameters: { fastPeriod: 12, slowPeriod: 26 },
    },
    {
      name: 'rsi-divergence',
      enabled: true,
      parameters: { period: 14, overbought: 70, oversold: 30 },
    },
    {
      name: 'momentum',
      enabled: false,
      parameters: { period: 10 },
    },
  ],
  uiPreferences: {
    theme: 'dark',
    refreshInterval: 5000,
    chartTimeframe: '1h',
  },
};

export async function GET(request: NextRequest) {
  try {
    // Return default settings - client manages actual settings in localStorage
    return NextResponse.json({
      data: DEFAULT_SETTINGS,
      message: 'Settings retrieved from defaults',
    });
  } catch (error) {
    console.error('Settings API error:', error);
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
    const { riskParams, strategyConfigs, uiPreferences } = body;

    // Build settings response - client is responsible for saving to localStorage
    const settings: Settings = { ...DEFAULT_SETTINGS };

    if (riskParams) {
      settings.riskParams = {
        ...settings.riskParams,
        ...riskParams,
      };
    }

    if (strategyConfigs && Array.isArray(strategyConfigs)) {
      settings.strategyConfigs = strategyConfigs;
    }

    if (uiPreferences) {
      settings.uiPreferences = {
        ...settings.uiPreferences,
        ...uiPreferences,
      };
    }

    // Always return API keys as [ENCRYPTED] for security
    if (settings.apiKeys) {
      settings.apiKeys.hyperliquid = '[ENCRYPTED]';
      settings.apiKeys.openai = '[ENCRYPTED]';
    }

    return NextResponse.json({
      data: settings,
      message: 'Settings validated and echoed back. Client should save to localStorage.',
    });
  } catch (error) {
    console.error('Settings API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
