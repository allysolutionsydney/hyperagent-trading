'use client';

import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isConnected?: boolean;
}

export default function DashboardLayout({ children, isConnected = false }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0a0a12] text-white overflow-hidden">
      <Sidebar isConnected={isConnected} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
