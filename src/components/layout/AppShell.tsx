"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Topbar } from './Topbar';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IdentityContextProvider } from './IdentityContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('SW registered successfully:', reg.scope),
          (err) => console.error('SW registration failed:', err)
        );
      });
    }
  }, []);

  // Listen to custom toast events
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setToastMessage(customEvent.detail);
    };
    
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  // Auto-hide toast after 2.6s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <IdentityContextProvider>
      <div className="flex h-screen bg-background text-text-primary overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
            <div className="container mx-auto px-4 lg:px-8 py-6 max-w-5xl">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />

        {/* Floating Toast Notification */}
        <div 
          className={cn(
            "fixed left-1/2 bottom-24 lg:bottom-8 -translate-x-1/2 z-[100] bg-slate-900/90 text-white rounded-full px-5 py-3 flex items-center gap-2.5 shadow-2xl backdrop-blur-md text-sm border border-slate-800 transition-all duration-300 transform",
            toastMessage ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      </div>
    </IdentityContextProvider>
  );
}
