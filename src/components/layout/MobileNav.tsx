"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Route,
  MapPin,
  Wallet,
  FileText,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const mainNavItems = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Маршрут', href: '/itinerary', icon: Route },
  { name: 'Места', href: '/places', icon: MapPin },
  { name: 'Бюджет', href: '/expenses', icon: Wallet },
  { name: 'Доки', href: '/documents', icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface/80 backdrop-blur-xl z-50 pb-safe">
        <nav className="flex items-center justify-around px-2 py-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[60px] py-1 transition-colors',
                  isActive ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-1 min-w-[60px] py-1 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
            <span className="text-[10px] font-medium">Ещё</span>
          </button>
        </nav>
      </div>

      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-[env(safe-area-inset-bottom,20px)+80px] right-4 w-48 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col">
              <Link href="/map" className="px-4 py-3 text-sm font-medium border-b border-border hover:bg-surface-elevated" onClick={() => setShowMore(false)}>Карта</Link>
              <Link href="/notes" className="px-4 py-3 text-sm font-medium border-b border-border hover:bg-surface-elevated" onClick={() => setShowMore(false)}>Чат и заметки</Link>
              <Link href="/people" className="px-4 py-3 text-sm font-medium border-b border-border hover:bg-surface-elevated" onClick={() => setShowMore(false)}>Участники и AI</Link>
              <Link href="/settings" className="px-4 py-3 text-sm font-medium hover:bg-surface-elevated" onClick={() => setShowMore(false)}>Настройки</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
