# HyperAgent — Project Handoff Document
> **For:** OpenClaw AI Agent (OpenAI-powered)
> **Date:** 2026-04-04
> **Owner:** Ravian (allysolutionsydney@gmail.com)
> **Status:** In active development — ~60% complete

---

## 1. What This Project Is

**HyperAgent** is a full-stack AI-powered trading agent web application connected to [Hyperliquid](https://hyperliquid.xyz), a high-performance decentralised perpetuals DEX. The application allows the owner to:

- Pull live market data from Hyperliquid (candles, order book, positions, account state)
- Analyse that data using a combination of classical technical strategies (RSI, MACD, Bollinger Bands, MA Crossover, Volume) and an AI "brain" (GPT-4o or OpenRouter models)
- View a composite BUY/SELL/HOLD signal with per-strategy breakdowns
- Execute trades directly on Hyperliquid (place, cancel, modify orders) with risk management guardrails
- Run an autonomous auto-trading loop that fetches data, analyses it, and executes trades without human input
- Build self-learning intelligence over time: the engine tracks win rate, profit factor, pattern recognition, and auto-adjusts strategy weights

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| State Management | Zustand |
| Charts | Recharts + Lightweight Charts |
| Icons | Lucide React |
| Hyperliquid SDK | Custom implementation in `src/lib/hyperliquid.ts` using `ethers.js` v6 + `axios` |
| AI Brain | OpenAI SDK v4 (`openai` npm package) — GPT-4o by default; OpenRouter support is stubbed |
| Technical Indicators | `technicalindicators` npm package |
| Wallet / Signing | `ethers` v6 (EIP-712 typed data signing) |
| Date Utilities | `date-fns` |
| Unique IDs | `uuid` |
| Build / Deploy | Vercel-ready (`vercel.json` present) |
| Runtime | Node.js (Next.js API routes = serverless functions on Vercel) |

---

## 3. Repository Structure

```
/
├── HANDOFF.md                  ← THIS FILE
├── .env.example                ← Template for all required env vars
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── data/                       ← Local JSON persistence directory (intelligence state, trade logs)
├── public/                     ← Static assets
└── src/
    ├── app/
    │   ├── layout.tsx           ← Root layout (dark theme, global CSS)
    │   ├── globals.css          ← Global Tailwind + custom CSS (animations, gradients)
    │   ├── page.tsx             ← Landing page (animated particle canvas, feature cards, ticker strip)
    │   ├── dashboard/
    │   │   └── page.tsx         ← Main trading dashboard (charts, signals, positions, order book)
    │   ├── analysis/
    │   │   └── page.tsx         ← Deep market analysis page
    │   ├── strategies/
    │   │   └── page.tsx         ← Strategy manager (enable/disable, adjust weights)
    │   ├── trades/
    │   │   └── page.tsx         ← Trade history and open orders
    │   ├── intelligence/
    │   │   └── page.tsx         ← Self-learning AI intelligence dashboard
    │   ├── settings/
    │   │   └── page.tsx         ← API key setup, risk parameters, trading preferences
    │   └── api/
    │       ├── ai/route.ts          ← AI analysis API (analyze, sentiment, trade-idea, evaluate, chat)
    │       ├── hyperliquid/
    │       │   ├── route.ts         ← Market data API (candles, orderbook, mids, etc.)
    │       │   └── account/route.ts ← Account state API (positions, balances, open orders)
    │       ├── trades/route.ts      ← Trade execution API (place, cancel, cancelAll, modify)
    │       ├── strategies/route.ts  ← Strategy run + backtest API
    │       ├── intelligence/route.ts← Intelligence engine API (record, report, regime, export)
    │       └── settings/route.ts    ← Settings validation API
    ├── components/
    │   ├── DashboardLayout.tsx  ← Sidebar + main content wrapper
    │   ├── Sidebar.tsx          ← Navigation sidebar (links to all pages)
    │   ├── Card.tsx             ← Reusable card container
    │   ├── StatCard.tsx         ← Metric stat card (value + label + trend)
    │   ├── SignalBadge.tsx      ← BUY/SELL/HOLD coloured badge
    │   └── StatusBadge.tsx      ← Generic status badge
    ├── hooks/
    │   ├── index.ts             ← Re-exports all hooks
    │   ├── useStore.ts          ← Zustand global store (ALL application state lives here)
    │   ├── useMarketData.ts     ← Hook for fetching + refreshing market data from API
    │   └── useAutoTrader.ts     ← Hook for autonomous trading loop (30-second interval)
    ├── lib/
    │   ├── hyperliquid.ts       ← HyperliquidClient class (full REST + EIP-712 signing)
    │   ├── openai.ts            ← AIAnalyzer class (market analysis, sentiment, trade ideas, chat)
    │   ├── intelligence.ts      ← IntelligenceEngine class (self-learning, pattern tracking)
    │   └── strategies/
    │       ├── index.ts         ← StrategyManager class + factory functions
    │       ├── types.ts         ← Strategy-specific TypeScript types
    │       ├── rsi.ts           ← RSI strategy
    │       ├── macd.ts          ← MACD strategy
    │       ├── bollinger.ts     ← Bollinger Bands strategy
    │       ├── ma-crossover.ts  ← Moving Average Crossover strategy
    │       ├── volume.ts        ← Volume analysis strategy
    │       ├── ai-sentiment.ts  ← AI Sentiment strategy (prompt builder + response parser)
    │       └── math-helpers.ts  ← Shared maths utilities (EMA, SMA, ATR, etc.)
    ├── types/
    │   └── index.ts             ← All shared TypeScript interfaces and types
    └── utils/
        └── format.ts            ← Formatting helpers (price, USD, percent, PnL, timestamp)
```

---

## 4. Environment Variables (Required)

Copy `.env.example` to `.env.local` and fill in:

```env
# OpenAI — required for AI analysis and signals
OPENAI_API_KEY=sk-...

# Hyperliquid — required for live trading (leave blank for read-only/demo mode)
HYPERLIQUID_PRIVATE_KEY=0x...          # EVM private key for signing orders
HYPERLIQUID_WALLET_ADDRESS=0x...       # Corresponding wallet address
HYPERLIQUID_TESTNET=false              # Set to true to use testnet

# OpenRouter — optional alternative AI provider
OPENROUTER_API_KEY=sk-or-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important security note:** API keys for OpenAI and Hyperliquid can also be entered at runtime via the Settings page (`/settings`). The settings page stores them in `localStorage` on the client. The API routes accept keys passed in the request body so no server-side persistence is needed.

---

## 5. How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

App will be available at `http://localhost:3000`.

---

## 6. Core Library Details

### 6.1 HyperliquidClient (`src/lib/hyperliquid.ts`)

Full-featured client for the Hyperliquid REST API.

**Read-only methods (no auth needed):**
- `getMarketData()` — all asset metadata + contexts
- `getCandles(coin, interval, startTime?, endTime?)` — OHLCV candles
- `getOrderBook(coin)` — live order book
- `getAllMids()` — all mid prices across all coins
- `getL2Snapshot(coin)` — Level 2 order book snapshot
- `getRecentTrades(coin)` — recent public trades
- `getFundingHistory(coin)` — funding rate history

**Account methods (wallet address required):**
- `getAccountState()` — positions, margin summary, account value
- `getOpenOrders()` — all open orders
- `getUserFills(coin?)` — fill/trade history

**Trading methods (private key required, uses EIP-712 signing):**
- `placeOrder(coin, isBuy, size, price, orderType, reduceOnly, clOrdId?)`
- `cancelOrder(coin, orderId)`
- `cancelAllOrders()`
- `modifyOrder(orderId, coin, isBuy, size, price)` — cancels + replaces

**API endpoints:**
- Mainnet: `https://api.hyperliquid.xyz`
- Testnet: `https://api.hyperliquid-testnet.xyz`
- Info endpoint: POST `/info` (read-only)
- Exchange endpoint: POST `/exchange` (trading, requires signature)

**Retry logic:** Exponential backoff on 5xx errors and timeouts, up to 3 retries.

### 6.2 AIAnalyzer (`src/lib/openai.ts`)

Wraps the OpenAI SDK. Uses GPT-4o by default.

- `analyzeMarket(candles, coin, indicators)` → structured `AnalysisResult` with trend, key levels, patterns, recommendation, confidence
- `analyzeMarketData(data)` — simplified wrapper
- `analyzeSentiment(text)` → `SentimentResult`
- `generateTradeIdea(data)` → `TradeIdea` with entry, stop, targets, sizing
- `evaluateStrategy(data)` → strategy evaluation JSON
- `chat(message, context?)` → free-form conversation with trading context

System prompt is pre-configured as an expert crypto derivatives trader. Always returns JSON-parseable responses.

### 6.3 IntelligenceEngine (`src/lib/intelligence.ts`)

Self-learning engine that persists intelligence across trades.

- `recordTrade(trade, outcome)` — logs a completed trade with P&L
- `updateStrategyPerformance(strategyName, trade)` — updates per-strategy stats
- `autoAdjustStrategy()` — automatically bumps/reduces strategy weights based on recent win rate
- `detectMarketRegime(data)` → one of: `trending_up | trending_down | ranging | high_volatility | low_volatility`
- `getOptimalStrategies(regime)` — returns strategies sorted by weight for current regime
- `generateReport()` — full intelligence report with stats, top patterns, rankings, recommendations
- `getLearningProgress()` — confidence level, data quality score, trades analysed
- `getOptimalSettings()` — auto-derived risk per trade, max leverage, best trading hours
- `toJSON()` / `fromJSON()` — full serialisation for persistence
- `exportIntelligence()` / `importIntelligence()` — data portability

Intelligence state is passed as JSON in API request/response bodies. The client stores it in `localStorage` (via Zustand store) and sends it with each intelligence API call so the server remains stateless.

### 6.4 StrategyManager (`src/lib/strategies/index.ts`)

Orchestrates all technical strategies.

**Strategies available:**
| Strategy | File | Signal type |
|---|---|---|
| RSI | `rsi.ts` | Overbought/oversold momentum |
| MACD | `macd.ts` | Trend + momentum crossover |
| Bollinger Bands | `bollinger.ts` | Mean reversion / volatility |
| MA Crossover | `ma-crossover.ts` | Trend following |
| Volume | `volume.ts` | Volume spike detection |
| AI Sentiment | `ai-sentiment.ts` | GPT-4o market read |

**Default weights:** RSI=1, MACD=1.2, Bollinger=1, MA Crossover=1.3, Volume=0.8, AI Sentiment=1.5

Each strategy returns a `StrategySignal`: `{ strategy, signal: 'BUY'|'SELL'|'HOLD', strength: 0-100, confidence: 0-100, reason: string }`.

`StrategyManager.analyze(candles, aiResponse?)` runs all enabled strategies, weights their signals, and returns an `AggregatedSignal` with `compositeSignal`, `compositeStrength`, `compositeConfidence`, and full `reasoning`.

**Factory presets:**
- `createDefaultStrategyManager()` — balanced all-strategies
- `createMomentumStrategyManager()` — MACD + MA Crossover + Volume
- `createMeanReversionStrategyManager()` — RSI + Bollinger only

---

## 7. API Routes Reference

### `POST /api/ai`
Actions: `analyze`, `sentiment`, `trade-idea`, `evaluate`, `chat`
Body: `{ action, data, apiKey }`
The `apiKey` (OpenAI key) is passed in every request from the client.

### `POST /api/hyperliquid`
Actions: `candles`, `orderbook`, `mids`, `l2`, `trades`, `funding`
Body: `{ action, coin?, interval?, startTime?, endTime?, isTestnet? }`

### `GET /api/hyperliquid/account`
Query params: `action=state|orders|fills`, `wallet`, `isTestnet`

### `POST /api/trades`
Actions: `place`, `cancel`, `cancelAll`, `modify`
Body: `{ action, wallet, privateKey, isTestnet, riskConfig?, ...params }`
Risk validation is run server-side before any order is placed.

### `POST /api/strategies`
Actions: `run`, `backtest`
Body: `{ action, candles, config, startTime?, endTime? }`

### `GET /api/intelligence`
Query params: `action=report|rankings|progress|settings`, `state` (JSON-encoded engine state)

### `POST /api/intelligence`
Actions: `record-trade`, `detect-regime`, `reset`, `export`, `import`
Body: `{ action, data?, intelligenceState? }`

### `GET /api/settings` — Returns default settings
### `POST /api/settings` — Validates and echoes back settings (client saves to localStorage)

---

## 8. Application Pages

| Route | Purpose | Status |
|---|---|---|
| `/` | Landing page — animated hero, feature cards, live ticker strip | ✅ Done |
| `/dashboard` | Main trading view: candlestick chart, order book, composite signal, open positions, recent trades, AI chat panel | ✅ Built, needs real data wiring |
| `/analysis` | Deep analysis view with per-strategy breakdowns | ⚠️ Scaffolded |
| `/strategies` | Enable/disable strategies, adjust weights, view per-strategy performance | ⚠️ Scaffolded |
| `/trades` | Trade history, open orders, P&L tracking | ⚠️ Scaffolded |
| `/intelligence` | Self-learning dashboard: learning progress, top patterns, strategy rankings, recommendations | ⚠️ Scaffolded |
| `/settings` | API key entry (OpenAI, Hyperliquid, OpenRouter), network toggle (testnet/mainnet), risk limits, strategy parameter tuning | ✅ Built |

---

## 9. Global State (Zustand Store — `src/hooks/useStore.ts`)

All application state is managed in a single Zustand store. Key state slices:

- `selectedCoin` — currently selected trading pair (e.g. `"BTC"`)
- `candles` — array of `Candle` objects
- `orderBook` — live order book
- `ticker` — current ticker data
- `positions` — open positions array
- `orders` — open orders array
- `trades` — trade history array
- `signals` — array of strategy signals
- `compositeSignal` — the aggregated signal from all strategies
- `analysis` — latest AI analysis result
- `isAnalyzing` — loading flag for AI calls
- `isAutoTrading` — whether the auto trader loop is active
- `riskSettings` — max position size, leverage, stop loss defaults etc.
- `accountBalance` — current account balance
- `isTestnet` — mainnet vs testnet toggle
- `intelligenceState` — serialised `StoredIntelligence` JSON (persisted to localStorage)
- `apiKeys` — `{ openai, hyperliquid, openrouter, walletAddress }` (persisted to localStorage)

---

## 10. Auto-Trading Loop (`src/hooks/useAutoTrader.ts`)

When `isAutoTrading = true`, this hook runs every 30 seconds:

1. Checks that candle data exists
2. POSTs to `/api/strategies` to run all enabled strategies on current candles
3. Updates `signals` in the store
4. POSTs to `/api/ai` for a GPT-4o analysis
5. Combines both into a composite signal
6. If composite signal is BUY/SELL with strength > threshold AND risk parameters allow, POSTs to `/api/trades` to place an order
7. Logs all decisions (to console + optionally to `/api/trading/log` — **this endpoint is NOT yet built**)
8. Updates the intelligence engine with trade outcomes

---

## 11. What Is Complete ✅

- Full project scaffold (Next.js 14, TypeScript, Tailwind, Zustand)
- Landing page with animations and live price ticker (static data)
- Dashboard page with candlestick chart, order book visualisation, signal display, positions table, recent trades, AI chat panel
- Settings page with full API key management, risk parameters, strategy tuning
- `HyperliquidClient` — complete REST client covering all market data + account + trading endpoints with EIP-712 signing and retry logic
- `AIAnalyzer` — complete OpenAI wrapper with market analysis, sentiment, trade ideas, strategy evaluation, chat
- `IntelligenceEngine` — complete self-learning engine with pattern memory, strategy auto-adjustment, market regime detection, reporting
- `StrategyManager` + all 5 technical strategies + AI sentiment strategy
- All 7 Next.js API routes
- `useAutoTrader` hook (loop logic)
- `useMarketData` hook
- Full TypeScript type system (`src/types/index.ts`)
- Formatting utilities
- Git history (10 commits from initial build through UI overhaul)

---

## 12. What Still Needs to Be Done ⚠️

### High Priority (core functionality gaps)

1. **Real data wiring on Dashboard** — The dashboard currently renders with hardcoded demo data (`DEMO_CANDLES`, `DEMO_POSITIONS`, `DEMO_RECENT_TRADES`). These need to be replaced with actual calls through `useMarketData` hook pulling from `/api/hyperliquid`.

2. **`/api/trading/log` endpoint** — The auto trader tries to POST decision logs to this route, which does not exist yet. Create it (can be a simple append-to-file or no-op for now).

3. **Settings persistence** — API keys are entered in the Settings page but there is no confirmed save-to-Zustand + persist-to-localStorage flow implemented. Verify `useStore` is properly persisting API keys so they survive page reload.

4. **Auto-trader trade execution** — The `useAutoTrader` hook has the analysis loop but the actual trade-placement logic (calling `/api/trades`) needs to be fully wired with the live risk settings from the store.

5. **Intelligence state persistence** — `intelligenceState` should persist in localStorage across sessions. Confirm Zustand `persist` middleware is applied to this field.

### Medium Priority (polish + features)

6. **Analysis page** (`/analysis`) — Needs real content: per-strategy signal panels, indicator charts (RSI chart, MACD histogram), market regime display.

7. **Strategies page** (`/strategies`) — Needs real strategy management UI: enable/disable toggles wired to `StrategyManager`, weight sliders, live performance stats from intelligence engine, backtest runner.

8. **Trades page** (`/trades`) — Needs real trade history from `getUserFills()`, P&L breakdown charts, open order management (cancel buttons).

9. **Intelligence page** (`/intelligence`) — Needs to call `/api/intelligence?action=report` and render learning progress bar, top patterns table, strategy rankings, recommendations.

10. **OpenRouter support** — `openrouter.ts` is not yet created. Build it mirroring `openai.ts` but targeting `https://openrouter.ai/api/v1` with the `OPENROUTER_API_KEY`. The Settings page already has an OpenRouter key field.

11. **WebSocket / real-time price feed** — Currently market data is polled via HTTP. Hyperliquid supports a WebSocket API (`wss://api.hyperliquid.xyz/ws`). Add a WebSocket connection for live price updates.

12. **Ticker strip on landing page** — Currently static prices. Wire to `getAllMids()` and refresh every 5 seconds.

### Low Priority (nice to have)

13. **Backtest runner** — `/api/strategies` has a `backtest` action but `StrategyManager.runStrategies()` needs to be completed to support it.

14. **Trade notifications** — Notify the user (toast, browser notification) when the auto-trader executes a trade or hits a stop loss.

15. **Multiple AI providers** — Add a provider selector in settings (OpenAI / OpenRouter / local OpenWebUI). Route AI calls accordingly.

16. **Position size calculator** — Helper in the trade execution UI to calculate position size based on account balance, risk per trade percentage, and stop distance.

---

## 13. Known Issues / Bugs

- The `HyperliquidClient.placeOrder()` method uses `BigInt` conversions that may need adjustment for the actual Hyperliquid wire format. **Test on testnet before using mainnet.**
- `AIAnalyzer.analyzeMarket()` calls `this.client.messages.create()` — this is Anthropic Claude SDK syntax. The OpenAI SDK uses `this.client.chat.completions.create()`. **This needs to be fixed before the AI analysis will work.**
- `StrategyManager` in `src/lib/strategies/index.ts` has a `runStrategies()` method called in the strategies API route, but only `analyze()` is defined in the class. The route expects `runStrategies()` — align these.
- The settings API route (`/api/settings`) currently stores nothing server-side — it echoes back defaults. Client-side localStorage is the only persistence. This is fine but should be documented to the user.
- `src/app/api/hyperliquid/route.ts` and `src/app/api/hyperliquid/account/route.ts` — confirm the `HyperliquidClient` constructor parameter is `config: { wallet, privateKey, testnet }` or `{ walletAddress, privateKey, isTestnet }` — there is a parameter name inconsistency between the class definition and how it is called in the routes.

---

## 14. Design Decisions Made

- **Dark theme only** — The entire UI is built for dark mode (`bg-[#0a0a0f]` deep dark navy background). Do not introduce light mode.
- **App Router** — Using Next.js 14 App Router (not Pages Router). All pages are in `src/app/`.
- **No server-side persistence** — By design, there is no database. Intelligence state, API keys, and settings all live in `localStorage` via Zustand persist. This keeps the app zero-infrastructure / deploy-anywhere.
- **Stateless API routes** — All API routes are stateless. The client passes all necessary state (intelligence JSON, API keys) in request bodies.
- **Risk validation server-side** — Before any trade is placed via `/api/trades`, the server validates position size, leverage, and stop loss requirements against the `riskConfig` passed in the body.
- **Strategy weights normalised to 100** — The `StrategyManager` normalises all weights so they sum to 100 before computing composite signals.
- **Composite signal threshold** — A composite signal is only acted upon if `compositeStrength > 15` (currently hardcoded in `numericToSignal()`). This can be made configurable.

---

## 15. Deployment

The project is Vercel-ready:
- `vercel.json` is present
- No special build configuration needed beyond setting environment variables in the Vercel dashboard
- The `data/` directory (for local JSON persistence) will not work on Vercel's serverless environment — if server-side persistence is needed in future, replace with a database (e.g. Upstash Redis, PlanetScale, Supabase)

To deploy:
```bash
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys.

---

## 16. Immediate First Steps for OpenClaw Agent

When you pick this up, do these in order:

1. **Fix the OpenAI SDK call** in `src/lib/openai.ts` — change `this.client.messages.create()` to `this.client.chat.completions.create()` with correct message format.

2. **Fix the HyperliquidClient constructor mismatch** — compare how the client is instantiated in `src/app/api/trades/route.ts` vs the constructor signature in `src/lib/hyperliquid.ts` and align them.

3. **Add the missing `/api/trading/log` route** — just a stub that returns 200 OK so the auto-trader doesn't error.

4. **Wire real data into the Dashboard** — remove `DEMO_CANDLES` / `DEMO_POSITIONS` / `DEMO_RECENT_TRADES` and replace with `useMarketData` hook calls.

5. **Confirm Zustand persist** is set up in `useStore.ts` for `apiKeys` and `intelligenceState` fields.

Once those 5 things are done, the core trading loop (data → analysis → signal → trade) will be functional end-to-end on testnet.

---

## 17. Contact / Context

- **Project owner:** Ravian (`allysolutionsydney@gmail.com`)
- **Original AI that built this:** Claude (Anthropic) via Cowork mode
- **Intended purpose:** Personal automated trading agent for Ravian's Hyperliquid account
- **Scale:** Single-user, self-hosted or Vercel-deployed
- **Risk tolerance:** Configurable via Settings page; testnet should be used for all initial testing
