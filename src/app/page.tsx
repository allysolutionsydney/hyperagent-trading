"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = 50;
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid background
      ctx.strokeStyle = "rgba(45, 45, 68, 0.3)";
      ctx.lineWidth = 1;

      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.fillStyle = `rgba(14, 165, 233, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx =
            particlesRef.current[i].x - particlesRef.current[j].x;
          const dy =
            particlesRef.current[i].y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(14, 165, 233, ${(1 - distance / 150) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const features = [
    {
      title: "Real-time Analysis",
      description: "Monitor market conditions and execute trades instantly",
      icon: "📊",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "AI Brain (GPT-4o)",
      description: "Powered by advanced AI for intelligent decision making",
      icon: "🧠",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Smart Strategies",
      description: "Customizable trading strategies for maximum flexibility",
      icon: "⚡",
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Self-Learning",
      description: "Continuous improvement through market data analysis",
      icon: "🤖",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="relative w-full overflow-hidden bg-[#0a0a0f]">
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ display: "block" }}
      />

      {/* Gradient Overlay */}
      <div className="fixed inset-0 z-1 bg-gradient-to-b from-transparent via-[#0a0a0f] to-[#0a0a0f]" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-[#2d2d44] bg-[#0a0a0f] bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                H
              </div>
              <span className="text-xl font-bold gradient-text">HyperAgent</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#stats"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Capabilities
              </a>
              <Link
                href="/dashboard"
                className="btn-primary"
              >
                Launch Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-4xl text-center space-y-8 animate-fade-in">
            {/* Animated Badge */}
            <div className="inline-block">
              <div className="stats-badge animate-slide-down">
                <span className="animate-pulse-green">●</span>
                <span>AI-Powered Trading Platform</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="gradient-text block mb-2">HyperAgent</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                The Future of Trading
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Intelligent, autonomous trading agent powered by GPT-4o. Execute
              strategies on Hyperliquid with real-time analysis and adaptive
              learning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/dashboard"
                className="btn-primary text-lg px-8 py-4 hover:shadow-2xl"
              >
                Launch Dashboard
                <span className="ml-2">→</span>
              </Link>
              <button className="btn-secondary text-lg px-8 py-4">
                Learn More
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-12 flex flex-col sm:flex-row gap-8 justify-center items-center text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Secure & Non-Custodial
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                24/7 Monitoring
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Real-time Execution
              </div>
            </div>
          </div>

          {/* Floating Cards Preview */}
          <div className="mt-20 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
            <div className="trading-card">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold text-white mb-2">Live Prices</h3>
              <p className="text-sm text-gray-400">Real-time market data</p>
            </div>
            <div className="trading-card">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-white mb-2">Quick Execution</h3>
              <p className="text-sm text-gray-400">Sub-second order placement</p>
            </div>
            <div className="trading-card">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-white mb-2">Smart Orders</h3>
              <p className="text-sm text-gray-400">AI-optimized strategies</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="gradient-text">Powerful Features</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Everything you need for successful algorithmic trading
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="trading-card group h-full hover:scale-105"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                  <div
                    className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 bg-gradient-to-br ${feature.gradient} transition-opacity duration-300 pointer-events-none`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { stat: "50+", label: "Trading Strategies" },
                { stat: "24/7", label: "AI Monitoring" },
                { stat: "99.9%", label: "Uptime" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="trading-card text-center"
                >
                  <div className="text-5xl font-bold gradient-text mb-2">
                    {item.stat}
                  </div>
                  <p className="text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto">
            <div className="trading-card text-center py-16 border-2 border-blue-500 border-opacity-50 bg-gradient-to-br from-blue-950 to-purple-950 bg-opacity-20">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Transform Your Trading?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Launch your AI trading agent now and start executing intelligent
                strategies on Hyperliquid.
              </p>
              <Link
                href="/dashboard"
                className="inline-block btn-primary text-lg px-10 py-4"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#2d2d44] py-12 px-4 sm:px-6 lg:px-8 mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Disclaimer
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Connect</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-[#2d2d44] pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
              <p>&copy; 2024 HyperAgent. All rights reserved.</p>
              <p>Powered by Hyperliquid & GPT-4o</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
