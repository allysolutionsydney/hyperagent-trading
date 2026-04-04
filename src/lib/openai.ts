import OpenAI from 'openai';
import {
  AnalysisResult,
  TradeIdea,
  SentimentResult,
  Candle,
  TechnicalIndicators,
  Trade,
  TradeOutcome,
  Message,
} from '../types/index';

export class AIAnalyzer {
  private client: OpenAI;
  private tokenUsage: number = 0;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  private systemPrompt = `You are an expert cryptocurrency derivatives trader with deep knowledge of:
- Technical analysis and price action
- Trading psychology and risk management
- Perpetual futures trading on platforms like Hyperliquid
- Volatility analysis and options pricing concepts
- Market microstructure and order flow
- Multiple timeframe analysis

You provide:
1. Data-driven analysis backed by specific levels and patterns
2. Risk management guidance (position sizing, stop loss placement)
3. Contextual market interpretation
4. Honest assessment of uncertainty and alternatives
5. Clear reasoning for your recommendations

Never provide financial advice, but rather educational analysis to inform trading decisions.
Focus on probability and risk/reward ratios rather than certainty.`;

  private async createJsonCompletion(userMessage: string, maxTokens: number): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    return {
      content,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    };
  }

  async analyzeMarket(
    candles: Candle[],
    coin: string,
    indicators: TechnicalIndicators
  ): Promise<AnalysisResult> {
    try {
      const formattedData = this.formatPriceData(candles);
      const indicatorSummary = this.formatIndicators(indicators);

      const userMessage = `Analyze ${coin} with the following data:

PRICE DATA (Most recent candle first):
${formattedData}

TECHNICAL INDICATORS:
${indicatorSummary}

Please provide:
1. Current trend direction and strength
2. Key support and resistance levels
3. Notable price patterns or formations
4. Volume profile interpretation
5. Trade recommendation (LONG, SHORT, or NEUTRAL) with reasoning
6. Risk/reward considerations

Format your response as JSON with these fields:
{
  "trend": "BULLISH|BEARISH|NEUTRAL",
  "trendStrength": "STRONG|MODERATE|WEAK",
  "keyLevels": { "resistance": number[], "support": number[] },
  "patterns": string[],
  "volumeProfile": string,
  "recommendation": "LONG|SHORT|NEUTRAL",
  "recommendationReason": string,
  "riskRewardRatio": number,
  "confidence": number,
  "technicalSummary": string
}`;

      const response = await this.createJsonCompletion(userMessage, 1500);
      this.tokenUsage += response.promptTokens + response.completionTokens;

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getFallbackAnalysis();
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return {
        timestamp: Date.now(),
        coin,
        trend: analysis.trend,
        trendStrength: analysis.trendStrength,
        keyLevels: analysis.keyLevels,
        patterns: analysis.patterns,
        volumeProfile: analysis.volumeProfile,
        recommendation: analysis.recommendation,
        recommendationReason: analysis.recommendationReason,
        riskRewardRatio: analysis.riskRewardRatio,
        confidence: analysis.confidence,
        technicalSummary: analysis.technicalSummary,
        rawResponse: response.content,
      };
    } catch (error) {
      console.error('Market analysis error:', error);
      return this.getFallbackAnalysis();
    }
  }

  async analyzeSentiment(marketContext: {
    btcPrice: number;
    marketCap: number;
    dominance: number;
    fearGreedIndex?: number;
    newsHeadlines?: string[];
  }): Promise<SentimentResult> {
    try {
      const userMessage = `Analyze current market sentiment based on:
- BTC Price: $${marketContext.btcPrice}
- Market Cap: $${(marketContext.marketCap / 1e9).toFixed(2)}B
- BTC Dominance: ${marketContext.dominance.toFixed(2)}%
${marketContext.fearGreedIndex ? `- Fear & Greed Index: ${marketContext.fearGreedIndex}/100` : ''}
${marketContext.newsHeadlines ? `- Recent Headlines: ${marketContext.newsHeadlines.join('; ')}` : ''}

Provide a sentiment analysis covering:
1. Overall market sentiment (BULLISH, BEARISH, NEUTRAL)
2. Key drivers of current sentiment
3. Potential catalysts ahead
4. Risk factors to watch
5. Positioning recommendations

Format as JSON:
{
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "sentimentScore": number,
  "keyDrivers": string[],
  "catalysts": string[],
  "riskFactors": string[],
  "positioning": string,
  "summary": string
}`;

      const response = await this.createJsonCompletion(userMessage, 1000);
      this.tokenUsage += response.promptTokens + response.completionTokens;

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getFallbackSentiment();
      }

      const sentiment = JSON.parse(jsonMatch[0]);
      return {
        timestamp: Date.now(),
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.sentimentScore,
        keyDrivers: sentiment.keyDrivers,
        catalysts: sentiment.catalysts,
        riskFactors: sentiment.riskFactors,
        positioning: sentiment.positioning,
        summary: sentiment.summary,
        rawResponse: response.content,
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return this.getFallbackSentiment();
    }
  }

  async generateTradeIdea(
    analysis: AnalysisResult,
    riskParams: {
      accountSize: number;
      maxRiskPerTrade: number;
      leverage: number;
      coin: string;
      currentPrice: number;
    }
  ): Promise<TradeIdea> {
    try {
      const userMessage = `Based on this market analysis, generate a specific trade setup:

ANALYSIS:
Trend: ${analysis.trend} (${analysis.trendStrength})
Recommendation: ${analysis.recommendation}
Key Support: $${analysis.keyLevels.support[0]}
Key Resistance: $${analysis.keyLevels.resistance[0]}
Risk/Reward Ratio: ${analysis.riskRewardRatio}:1

RISK PARAMETERS:
Account Size: $${riskParams.accountSize}
Max Risk Per Trade: ${riskParams.maxRiskPerTrade}%
Available Leverage: ${riskParams.leverage}x
Current ${riskParams.coin} Price: $${riskParams.currentPrice}

Provide a complete trade setup with:
1. Direction (LONG or SHORT)
2. Entry price or range
3. Stop loss placement with reasoning
4. Take profit targets (primary and secondary)
5. Position sizing calculation
6. Risk/reward for this specific setup
7. Trade thesis
8. Exit conditions
9. Time horizon

Format as JSON:
{
  "direction": "LONG|SHORT",
  "entryPrice": number,
  "entryRange": [number, number],
  "stopLoss": number,
  "takeProfits": [number, number],
  "positionSize": number,
  "riskAmount": number,
  "rewardAmount": number,
  "riskRewardRatio": number,
  "leverage": number,
  "thesis": string,
  "exitConditions": string[],
  "timeHorizon": string,
  "confidence": number
}`;

      const response = await this.createJsonCompletion(userMessage, 1500);
      this.tokenUsage += response.promptTokens + response.completionTokens;

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse trade idea');
      }

      const idea = JSON.parse(jsonMatch[0]);
      return {
        timestamp: Date.now(),
        direction: idea.direction,
        entryPrice: idea.entryPrice,
        entryRange: idea.entryRange,
        stopLoss: idea.stopLoss,
        takeProfits: idea.takeProfits,
        positionSize: idea.positionSize,
        riskAmount: idea.riskAmount,
        rewardAmount: idea.rewardAmount,
        riskRewardRatio: idea.riskRewardRatio,
        leverage: idea.leverage,
        thesis: idea.thesis,
        exitConditions: idea.exitConditions,
        timeHorizon: idea.timeHorizon,
        confidence: idea.confidence,
        rawResponse: response.content,
      };
    } catch (error) {
      console.error('Trade idea generation error:', error);
      throw error;
    }
  }

  async evaluateTradeOutcome(
    trade: Trade,
    outcome: TradeOutcome
  ): Promise<{
    analysis: string;
    learnings: string[];
    suggestions: string[];
  }> {
    try {
      const userMessage = `Evaluate this completed trade for learning:

TRADE SETUP:
Direction: ${trade.direction}
Entry: $${trade.entryPrice}
Stop Loss: $${trade.stopLoss}
Take Profit: $${trade.takeProfits[0]}
Position Size: ${trade.size}
Leverage: ${trade.leverage}x
Thesis: ${trade.thesis}

OUTCOME:
Exit Price: $${outcome.exitPrice}
Exit Reason: ${outcome.exitReason}
PnL: $${outcome.pnl} (${outcome.pnlPercent}%)
Duration: ${outcome.durationMinutes} minutes
Win: ${outcome.win ? 'YES' : 'NO'}

Provide:
1. What worked in this trade
2. What didn't work
3. Key learnings
4. Suggestions for future similar setups
5. Risk management observations

Format as JSON:
{
  "summary": string,
  "whatWorked": string[],
  "whatDidntWork": string[],
  "keyLearnings": string[],
  "suggestions": string[],
  "riskManagementNotes": string
}`;

      const response = await this.createJsonCompletion(userMessage, 1200);
      this.tokenUsage += response.promptTokens + response.completionTokens;

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          analysis: 'Could not evaluate trade',
          learnings: [],
          suggestions: [],
        };
      }

      const evaluation = JSON.parse(jsonMatch[0]);
      return {
        analysis: evaluation.summary,
        learnings: [
          ...evaluation.whatWorked.map((w: string) => `Worked: ${w}`),
          ...evaluation.whatDidntWork.map((w: string) => `Issue: ${w}`),
          ...evaluation.keyLearnings,
        ],
        suggestions: evaluation.suggestions,
      };
    } catch (error) {
      console.error('Trade evaluation error:', error);
      return {
        analysis: 'Error evaluating trade',
        learnings: [],
        suggestions: [],
      };
    }
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...formattedMessages,
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Unexpected response type');
      }

      this.tokenUsage += response.usage?.prompt_tokens ?? 0;
      this.tokenUsage += response.usage?.completion_tokens ?? 0;

      return content;
    } catch (error) {
      console.error('Chat error:', error);
      return 'I encountered an error processing your question. Please try again.';
    }
  }

  private formatPriceData(candles: Candle[]): string {
    return candles
      .slice(0, 20)
      .map(
        (c, i) =>
          `[${i}] ${new Date(c.timestamp).toISOString()}: O $${c.open.toFixed(2)}, ` +
          `H $${c.high.toFixed(2)}, L $${c.low.toFixed(2)}, C $${c.close.toFixed(2)}, ` +
          `Vol ${c.volume.toFixed(0)}`
      )
      .join('\n');
  }

  private formatIndicators(indicators: TechnicalIndicators): string {
    return `
RSI(14): ${indicators.rsi?.toFixed(2) || 'N/A'}
MACD: Signal ${indicators.macd?.signal.toFixed(4) || 'N/A'}, Histogram ${indicators.macd?.histogram.toFixed(4) || 'N/A'}
Bollinger Bands: Upper $${indicators.bb?.upper.toFixed(2) || 'N/A'}, Mid $${indicators.bb?.middle.toFixed(2) || 'N/A'}, Lower $${indicators.bb?.lower.toFixed(2) || 'N/A'}
Moving Averages: SMA20 $${indicators.sma20?.toFixed(2) || 'N/A'}, SMA50 $${indicators.sma50?.toFixed(2) || 'N/A'}, SMA200 $${indicators.sma200?.toFixed(2) || 'N/A'}
ATR(14): ${indicators.atr?.toFixed(2) || 'N/A'}
Volume Profile: ${indicators.volumeProfile?.interpretation || 'N/A'}
    `.trim();
  }

  private getFallbackAnalysis(): AnalysisResult {
    return {
      timestamp: Date.now(),
      coin: 'UNKNOWN',
      trend: 'NEUTRAL',
      trendStrength: 'WEAK',
      keyLevels: { support: [], resistance: [] },
      patterns: [],
      volumeProfile: 'Unable to analyze',
      recommendation: 'NEUTRAL',
      recommendationReason: 'Analysis unavailable',
      riskRewardRatio: 0,
      confidence: 0,
      technicalSummary: 'Please try again',
      rawResponse: '',
    };
  }

  private getFallbackSentiment(): SentimentResult {
    return {
      timestamp: Date.now(),
      sentiment: 'NEUTRAL',
      sentimentScore: 50,
      keyDrivers: [],
      catalysts: [],
      riskFactors: [],
      positioning: 'Unable to determine',
      summary: 'Sentiment analysis unavailable',
      rawResponse: '',
    };
  }

  getTokenUsage(): number {
    return this.tokenUsage;
  }

  resetTokenUsage(): void {
    this.tokenUsage = 0;
  }
}
