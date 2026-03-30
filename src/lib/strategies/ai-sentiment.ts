/**
 * AI Sentiment Analysis Strategy
 * Uses OpenAI to analyze market patterns and generate trading signals
 */

import { CandleData, StrategySignal } from './types';

export interface AISentimentConfig {
  apiKey?: string;
  model: string; // Default 'gpt-4' or 'gpt-3.5-turbo'
  temperature: number; // 0-2, default 0.5 for balanced analysis
  maxTokens: number; // Max tokens for response
}

export interface AIAnalysisContext {
  candles: CandleData[];
  currentPrice: number;
  priceChangePercent: number;
  recentHighs: number[];
  recentLows: number[];
  volatility: number;
  volume: number[];
  additionalContext?: string;
}

/**
 * Generate a prompt for AI market analysis
 * @param context Market context including candles and technical data
 * @returns Prompt string for OpenAI
 */
export function generateAIPrompt(context: AIAnalysisContext): string {
  const { candles, currentPrice, priceChangePercent, recentHighs, recentLows, volatility, additionalContext } = context;

  const timeWindow = candles.length > 0 ? ((candles[candles.length - 1].timestamp - candles[0].timestamp) / 1000 / 60).toFixed(0) : '?';

  const prompt = `You are an expert technical analysis trader. Analyze the following market data and provide a concise trading signal.

Market Data:
- Current Price: ${currentPrice.toFixed(6)}
- Price Change (recent): ${priceChangePercent.toFixed(2)}%
- Candles Analyzed: ${candles.length}
- Time Window: ${timeWindow} minutes
- Volatility (std dev): ${volatility.toFixed(6)}
- Recent Highs (last 5): ${recentHighs.map((h) => h.toFixed(6)).join(', ')}
- Recent Lows (last 5): ${recentLows.map((l) => l.toFixed(6)).join(', ')}
- Current Volume: ${context.volume[context.volume.length - 1]}

Candle Data (last 10):
${candles.slice(-10).map((c, i) => `${i}: O:${c.open.toFixed(6)} H:${c.high.toFixed(6)} L:${c.low.toFixed(6)} C:${c.close.toFixed(6)} V:${c.volume}`).join('\n')}

${additionalContext ? `Additional Context: ${additionalContext}\n` : ''}

Please analyze this data and identify:
1. Trend Direction: Is the market in an uptrend, downtrend, or consolidating?
2. Support/Resistance: Identify key support and resistance levels
3. Chart Patterns: Look for head & shoulders, double tops/bottoms, triangles, flags, or other patterns
4. Market Regime: Is this trending, ranging, or volatile?
5. Entry/Exit Signals: Identify potential BUY, SELL, or HOLD signals

Respond in this exact JSON format:
{
  "signal": "BUY" or "SELL" or "HOLD",
  "strength": <0-100>,
  "confidence": <0-100>,
  "trend": "uptrend" or "downtrend" or "ranging",
  "supportLevel": <number or null>,
  "resistanceLevel": <number or null>,
  "patterns": ["pattern1", "pattern2"],
  "reasoning": "Brief explanation of the analysis",
  "riskAssessment": "high", "medium", or "low"
}

Important: Only respond with valid JSON, no other text.`;

  return prompt;
}

/**
 * Parse AI response into a StrategySignal
 * @param aiResponse Response from OpenAI (should be JSON)
 * @param timestamp Signal timestamp
 * @param rawAnalysis Include raw analysis in indicators
 * @returns StrategySignal
 */
export function parseAIResponse(aiResponse: string, timestamp: number, rawAnalysis?: unknown): StrategySignal {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      strategy: 'AISentiment',
      signal: parsed.signal || 'HOLD',
      strength: Math.min(100, Math.max(0, parsed.strength || 0)),
      confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
      reason: parsed.reasoning || 'AI analysis completed',
      timestamp,
      indicators: {
        trend: parsed.trend ? (parsed.trend === 'uptrend' ? 1 : parsed.trend === 'downtrend' ? -1 : 0) : 0,
        supportLevel: parsed.supportLevel ? Number(parsed.supportLevel) : 0,
        resistanceLevel: parsed.resistanceLevel ? Number(parsed.resistanceLevel) : 0,
        riskLevel: parsed.riskAssessment === 'high' ? 3 : parsed.riskAssessment === 'medium' ? 2 : 1,
      },
    };
  } catch (error) {
    return {
      strategy: 'AISentiment',
      signal: 'HOLD',
      strength: 0,
      confidence: 0,
      reason: `AI response parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp,
      indicators: {},
    };
  }
}

/**
 * Prepare market context for AI analysis
 * @param candles Array of candle data
 * @returns Formatted analysis context
 */
export function prepareAnalysisContext(candles: CandleData[], additionalContext?: string): AIAnalysisContext {
  if (candles.length === 0) {
    return {
      candles: [],
      currentPrice: 0,
      priceChangePercent: 0,
      recentHighs: [],
      recentLows: [],
      volatility: 0,
      volume: [],
      additionalContext,
    };
  }

  const currentPrice = candles[candles.length - 1].close;
  const openPrice = candles[0].close;
  const priceChangePercent = ((currentPrice - openPrice) / openPrice) * 100;

  // Get recent highs and lows
  const recentHighs = candles.slice(-5).map((c) => c.high);
  const recentLows = candles.slice(-5).map((c) => c.low);

  // Calculate volatility (standard deviation of returns)
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const returnVal = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    returns.push(returnVal);
  }

  let volatility = 0;
  if (returns.length > 0) {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
    volatility = Math.sqrt(variance);
  }

  const volumes = candles.map((c) => c.volume);

  return {
    candles,
    currentPrice,
    priceChangePercent,
    recentHighs,
    recentLows,
    volatility,
    volume: volumes,
    additionalContext,
  };
}

/**
 * Fallback AI sentiment when API is unavailable
 * Performs basic heuristic analysis
 * @param context Analysis context
 * @returns Fallback signal
 */
export function getFallbackSignal(context: AIAnalysisContext): StrategySignal {
  const timestamp = context.candles[context.candles.length - 1]?.timestamp || Date.now();

  if (context.candles.length === 0) {
    return {
      strategy: 'AISentiment',
      signal: 'HOLD',
      strength: 0,
      confidence: 0,
      reason: 'Insufficient data for analysis',
      timestamp,
      indicators: {},
    };
  }

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;
  let confidence = 0;
  let reason = '';

  // Simple heuristics when API is unavailable
  const upCandles = context.candles.filter((c, i) => i === 0 || c.close > context.candles[i - 1].close).length;
  const upPercent = (upCandles / context.candles.length) * 100;

  if (upPercent > 65) {
    signal = 'BUY';
    strength = Math.min(100, (upPercent - 50) * 2);
    confidence = 60;
    reason = `${upPercent.toFixed(0)}% of candles closing higher. Slight upside bias (AI unavailable - fallback heuristic).`;
  } else if (upPercent < 35) {
    signal = 'SELL';
    strength = Math.min(100, (50 - upPercent) * 2);
    confidence = 60;
    reason = `${(100 - upPercent).toFixed(0)}% of candles closing lower. Slight downside bias (AI unavailable - fallback heuristic).`;
  } else {
    reason = `Mixed candle pattern. Market indecision (AI unavailable - fallback heuristic).`;
  }

  return {
    strategy: 'AISentiment',
    signal,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    reason,
    timestamp,
    indicators: {},
  };
}

/**
 * Main AI sentiment analysis function
 * Generates prompt and prepares context for OpenAI integration
 * Note: Actual API call should be made by the calling code
 * @param candles Array of candle data
 * @param additionalContext Optional additional market context
 * @param config Optional configuration
 * @returns Object with prompt and context ready for API call
 */
export function generateAISentimentAnalysis(
  candles: CandleData[],
  additionalContext?: string,
  config?: Partial<AISentimentConfig>
): {
  prompt: string;
  context: AIAnalysisContext;
  config: AISentimentConfig;
} {
  const context = prepareAnalysisContext(candles, additionalContext);

  const fullConfig: AISentimentConfig = {
    model: config?.model ?? 'gpt-4',
    temperature: config?.temperature ?? 0.5,
    maxTokens: config?.maxTokens ?? 500,
  };

  const prompt = generateAIPrompt(context);

  return {
    prompt,
    context,
    config: fullConfig,
  };
}
