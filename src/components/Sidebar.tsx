'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Analysis', href: '/analysis', icon: <TrendingUp size={20} /> },
  { name: 'Strategies', href: '/strategies', icon: <Brain size={20} /> },
  { name: 'Trades', href: '/trades', icon: <ArrowLeftRight size={20} /> },
  { name: 'Intelligence', href: '/intelligence', icon: <Sparkles size={20} /> },
  { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

interface SidebarProps {
  isConnected?: boolean;
}

export default function Sidebar({ isConnected = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#12121a] border border-gray-800 p-2 rounded-lg hover:border-gray-700 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 h-screen bg-[#12121a] border-r border-gray-800 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-16' : 'w-60'
        } ${isMobileOpen ? 'left-0' : '-left-60 md:left-0'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Zap size={20} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg">HyperAgent</span>
            </div>
          )}
          {isCollapsed && <Zap size={20} className="text-blue-500 mx-auto" />}
          <button
            className="hidden md:block p-1 hover:bg-gray-800 rounded transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <Menu size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
              onClick={() => setIsMobileOpen(false)}
            >
              {item.icon}
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'
              }`}
            />
            {!isCollapsed && (
              <span className="text-xs font-medium text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
