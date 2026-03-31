'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  ArrowLeftRight,
  Sparkles,
  Settings,
  Zap,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard',    href: '/dashboard',    icon: <LayoutDashboard size={18} /> },
  { name: 'Analysis',     href: '/analysis',     icon: <TrendingUp size={18} /> },
  { name: 'Strategies',   href: '/strategies',   icon: <Brain size={18} /> },
  { name: 'Trades',       href: '/trades',       icon: <ArrowLeftRight size={18} /> },
  { name: 'Intelligence', href: '/intelligence', icon: <Sparkles size={18} />, badge: 'AI' },
  { name: 'Settings',     href: '/settings',     icon: <Settings size={18} /> },
];

interface SidebarProps {
  isConnected?: boolean;
}

function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <p className="text-sm font-mono font-semibold text-gray-200 tabular-nums">{time}</p>
      <p className="text-xs text-gray-500 mt-0.5">{date}</p>
    </div>
  );
}

export default function Sidebar({ isConnected = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#12121a] border border-gray-800 p-2 rounded-lg hover:border-blue-500/40 hover:shadow-[0_0_12px_rgba(14,165,233,0.2)] transition-all duration-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} className="text-gray-300" /> : <Menu size={20} className="text-gray-300" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-40 h-screen
          bg-[#0d0d15] border-r border-[#1a1a2a]
          transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? 'w-[68px]' : 'w-[220px]'}
          ${isMobileOpen ? 'left-0' : '-left-[220px] md:left-0'}
        `}
      >
        {/* Inner glow strip on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent pointer-events-none" />

        {/* ── Logo Header ── */}
        <div className="relative p-4 border-b border-[#1a1a2a] flex items-center justify-between min-h-[64px]">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative flex-shrink-0">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-[0_0_12px_rgba(37,99,235,0.5)]">
                  <Zap size={18} className="text-white" />
                </div>
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-white text-base tracking-tight whitespace-nowrap">HyperAgent</span>
                <p className="text-[10px] text-blue-400/70 whitespace-nowrap">AI Trading Platform</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-[0_0_12px_rgba(37,99,235,0.5)]">
              <Zap size={18} className="text-white" />
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-all duration-200 flex-shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed
              ? <ChevronRight size={14} />
              : <ChevronLeft size={14} />
            }
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto panel-scroll">
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-3">Navigation</p>
          )}

          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group overflow-hidden
                  ${active
                    ? 'text-white nav-active'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                onClick={() => setIsMobileOpen(false)}
              >
                {/* Icon */}
                <span
                  className={`flex-shrink-0 transition-all duration-200 ${
                    active
                      ? 'text-blue-400'
                      : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  {item.icon}
                </span>

                {/* Label */}
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}

                {/* Badge */}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/25">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed badge dot */}
                {isCollapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Clock (only when expanded) ── */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-[#1a1a2a]">
            <LiveClock />
          </div>
        )}

        {/* ── Connection Status ── */}
        <div className={`px-4 py-3 border-t border-[#1a1a2a] ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            <div
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              style={isConnected ? { boxShadow: '0 0 8px rgba(16,185,129,0.7)' } : { boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    style={isConnected ? { boxShadow: '0 0 6px rgba(16,185,129,0.8)' } : {}}
                  />
                  {isConnected && (
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-[10px] text-gray-600">Hyperliquid</p>
                </div>
              </div>
              {isConnected
                ? <Wifi size={14} className="text-green-500/60" />
                : <WifiOff size={14} className="text-red-500/60" />
              }
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
