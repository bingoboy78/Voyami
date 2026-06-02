"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Route,
  Map,
  MapPin,
  Wallet,
  FileText,
  MessageSquare,
  Users,
  Settings,
} from 'lucide-react';
import { IdentitySelector } from './IdentitySelector';
import { cn } from '@/lib/utils';
// ... (the rest of existing imports)

const navItems = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Маршрут', href: '/itinerary', icon: Route },
  { name: 'Карта', href: '/map', icon: Map },
  { name: 'Места', href: '/places', icon: MapPin },
  { name: 'Бюджет', href: '/expenses', icon: Wallet },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'Чат и заметки', href: '/notes', icon: MessageSquare },
  { name: 'Участники и AI', href: '/people', icon: Users },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [trip, setTrip] = useState<{ name: string; route: string; country: string } | null>(null);

  const fetchTrip = async () => {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      if (data.trip) {
        setTrip(data.trip);
      }
    } catch (err) {
      console.error('Failed to fetch trip in Sidebar:', err);
    }
  };

  useEffect(() => {
    fetchTrip();

    const handleUpdate = () => {
      fetchTrip();
    };

    window.addEventListener('trip-updated', handleUpdate);
    return () => window.removeEventListener('trip-updated', handleUpdate);
  }, []);

  return (
    <aside className="hidden lg:flex w-[280px] flex-col border-r border-border bg-surface px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-soft select-none">
          {trip?.name ? trip.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight tracking-tight">{trip?.name || 'Поездка'}</h1>
          <p className="text-sm text-text-tertiary">{trip?.route || 'Маршрут...'}</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-border/60">
        <IdentitySelector className="mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Офлайн-режим включён · маршрут и документы сохранены' }))}
            className="px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-text-primary transition-colors text-center"
          >
            Офлайн
          </button>
          <button 
            onClick={() => {
              const isDark = document.documentElement.classList.toggle('dark');
              window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: isDark ? 'Тёмная тема включена' : 'Светлая тема включена' 
              }));
            }}
            className="px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-text-primary transition-colors text-center"
          >
            Тема
          </button>
        </div>
      </div>
    </aside>
  );
}
