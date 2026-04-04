"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Zap, Brain, BarChart2, ShieldCheck, ArrowRight, Activity } from "lucide-react";

/* ── Particle types ── */
interface Particle {
  x: number; y: number;
  size: number;
  speedX: number; speedY: number;
  opacity: number;
}

/* ── Live price ticker data ── */
const TICKER = [
  { symbol: "BTC",  price: 64320,  change: +2.14 },
  { symbol: "ETH",  price: 3458,   change: +1.87 },
  { symbol: "SOL",  price: 151.4,  change: -0.72 },
  { symbol: "ARB",  price: 1.24,   change: +3.55 },
  { symbol: "OP",   price: 2.89,   change: +1.12 },
  { symbol: "DOGE", price: 0.1274, change: -1.34 },
  { symbol: "AVAX", price: 35.6,   change: +0.88 },
  { symbol: "LINK", price: 14.22,  change: +2.01 },
];

/* ── Feature cards ── */
const FEATURES = [
  {
    icon: BarChart2,
    title: "Real-time Analysis",
    description: "Live candlesticks, order book depth, and multi-timeframe data pulled straight from Hyperliquid.",
    gradient: "from-blue-500 to-cyan-500",
    glow: "group-hover:shadow-[0_0_30px_rgba(14,165,233,0.25)]",
  },
  {
    icon: Brain,
    title: "AI Brain (GPT-4o)",
    description: "Powered by GPT-4o to read market structure, detect patterns, and generate high-conviction signals.",
    gradient: "from-purple-500 to-pink-500",
    glow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]",
  },
  {
    icon: Zap,
    title: "Smart Strategies",
    description: "RSI divergence, MACD crossover, Bollinger Bands, and more — tunable weights, live composite signal.",
    gradient: "from-orange-500 to-red-500",
    glow: "group-hover:shadow-[0_0_30px_rgba(251,146,60,0.25)]",
  },
  {
    icon: Activity,
    title: "Self-Learning",
    description: "Tracks win-rate and profit factor after every trade. Adjusts strategy weights automatically over time.",
    gradient: "from-green-500 to-emerald-500",
    glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]",
  },
];

/* ── Stats ── */
const STATS = [
  { value: "50+",   label: "Trading Strategies" },
  { value: "24/7",  label: "AI Monitoring" },
  { value: "< 1s",  label: "Order Execution" },
  { value: "99.9%", label: "Uptime" },
];

/* ─────────────────────────────────────────────── */
/*  Particle Canvas                                 */
/* ─────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.5 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "rgba(30, 30, 50, 0.35)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Particles + connections
      particlesRef.current.forEach((p) => {
        p.x = (p.x + p.speedX + canvas.width) % canvas.width;
        p.y = (p.y + p.speedY + canvas.height) % canvas.height;
        ctx.fillStyle = `rgba(14,165,233,${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(14,165,233,${(1 - d / 130) * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

/* ─────────────────────────────────────────────── */
/*  Live Ticker strip                              */
/* ─────────────────────────────────────────────── */
function TickerStrip() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const items = [...TICKER, ...TICKER]; // duplicate for seamless loop

  return (
    <div className="border-b border-[#1e1e2e] bg-[#0d0d15]/70 backdrop-blur-md overflow-hidden">
      <div
        className="flex gap-8 py-2 px-4 whitespace-nowrap"
        style={{ animation: "tickerScroll 28s linear infinite" }}
      >
        {items.map((item, i) => {
          const jitter = Math.sin(tick * 0.4 + i) * item.price * 0.0003;
          const displayPrice = (item.price + jitter);
          const up = item.change > 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 text-sm flex-shrink-0">
              <span className="font-semibold text-gray-300">{item.symbol}</span>
              <span className="font-mono text-gray-400 tabular-nums">
                {displayPrice < 1
                  ? displayPrice.toFixed(4)
                  : displayPrice < 100
                  ? displayPrice.toFixed(2)
                  : Math.round(displayPrice).toLocaleString()}
              </span>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${up ? "text-green-400" : "text-red-400"}`}>
                {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {up ? "+" : ""}{item.change}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Main Page                                      */
/* ─────────────────────────────────────────────── */
export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="relative w-full overflow-hidden bg-[#0a0a0f] min-h-screen">
      {/* Background */}
      <ParticleCanvas />
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-[#0a0a0f]/40 to-[#0a0a0f]" />

      {/* Content */}
      <div className="relative z-10">

        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-[#1e1e2e] bg-[#0a0a0f]/85">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-[0_0_12px_rgba(37,99,235,0.5)]">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">HyperAgent</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm">
              {["Features", "Capabilities"].map((label, i) => (
                <a
                  key={label}
                  href={i === 0 ? "#features" : "#stats"}
                  className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="btn-primary text-sm px-5 py-2"
            >
              Launch Dashboard
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </nav>

        {/* ── Ticker Strip ── */}
        <TickerStrip />

        {/* ── Hero ── */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="max-w-4xl text-center space-y-8">

            {/* Badge */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
              <div className="stats-badge">
                <span className="animate-pulse-green">●</span>
                AI-Powered Trading Platform · Hyperliquid
              </div>
            </div>

            {/* Headline */}
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
                <span className="gradient-text block mb-2">HyperAgent</span>
                <span className="text-white">The Future of</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  Autonomous Trading
                </span>
              </h1>
            </div>

            {/* Subtext */}
            <p
              className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              Intelligent, self-learning trading agent powered by GPT-4o. Executes
              strategies on Hyperliquid with real-time analysis and adaptive intelligence.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/dashboard"
                className="btn-primary text-base px-8 py-3.5 group"
              >
                Launch Dashboard
                <ArrowRight size={16} className="ml-1.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="btn-secondary text-base px-8 py-3.5"
              >
                Explore Features
              </a>
            </div>

            {/* Trust strip */}
            <div
              className="pt-6 flex flex-wrap gap-x-8 gap-y-3 justify-center text-gray-500 text-sm animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              {[
                { icon: ShieldCheck, text: "Non-Custodial & Secure" },
                { icon: Activity,    text: "24/7 Monitoring" },
                { icon: Zap,         text: "Sub-second Execution" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 group">
                  <Icon size={14} className="text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-gray-300 transition-colors">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini preview cards */}
          <div
            className="mt-20 w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            {[
              { emoji: "📈", title: "Live Prices",     sub: "Real-time market data" },
              { emoji: "⚡", title: "Fast Execution",  sub: "Sub-second order placement" },
              { emoji: "🎯", title: "Smart Signals",   sub: "AI-optimised composite signal" },
            ].map(({ emoji, title, sub }) => (
              <div key={title} className="trading-card text-center cursor-default">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-white mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">What's Inside</p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="gradient-text">Powerful Features</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                Everything you need for serious algorithmic trading — packed in one interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                const isHovered = hoveredFeature === idx;
                return (
                  <div
                    key={idx}
                    className={`
                      relative overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#12121a]/90
                      p-6 cursor-default transition-all duration-300 group
                      ${isHovered
                        ? "border-blue-500/30 -translate-y-1 " + feature.glow
                        : "hover:border-[#2e2e44]"}
                    `}
                    style={{ animationDelay: `${idx * 80}ms` }}
                    onMouseEnter={() => setHoveredFeature(idx)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    {/* Gradient overlay on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none rounded-2xl`}
                    />

                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={22} className="text-white" />
                    </div>

                    <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {STATS.map((item, i) => (
                <div
                  key={i}
                  className="trading-card text-center group cursor-default"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="text-4xl font-extrabold gradient-text mb-2 group-hover:scale-105 transition-transform duration-300 inline-block">
                    {item.value}
                  </div>
                  <p className="text-gray-500 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-950/40 via-[#12121a] to-purple-950/40 p-12 text-center">
              {/* Glowing orbs */}
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="stats-badge mb-6 justify-center">
                  <span className="animate-pulse-green">●</span>
                  Ready to Deploy
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to Transform Your Trading?
                </h2>
                <p className="text-gray-400 text-base mb-8 max-w-lg mx-auto">
                  Launch your AI trading agent now and start executing intelligent
                  strategies on Hyperliquid.
                </p>
                <Link
                  href="/dashboard"
                  className="btn-primary text-base px-10 py-3.5 group"
                >
                  Get Started Free
                  <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[#1e1e2e] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {[
                { heading: "Product",  links: ["Features", "Pricing", "Security"] },
                { heading: "Company",  links: ["About", "Blog", "Contact"] },
                { heading: "Legal",    links: ["Privacy", "Terms", "Disclaimer"] },
                { heading: "Connect",  links: ["Twitter", "Discord", "GitHub"] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <h4 className="font-semibold text-white text-sm mb-4">{heading}</h4>
                  <ul className="space-y-2.5">
                    {links.map((l) => (
                      <li key={l}>
                        <a href="#" className="text-gray-500 hover:text-gray-200 text-sm transition-colors duration-200">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1e1e2e] pt-8 flex flex-col md:flex-row justify-between items-center text-gray-600 text-xs gap-3">
              <p>© 2025 HyperAgent. All rights reserved.</p>
              <p>Powered by Hyperliquid & GPT-4o · Not financial advice.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
