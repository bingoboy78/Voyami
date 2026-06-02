"use client";

import { Bell, Search, Info } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { IdentitySelector } from './IdentitySelector';

export function Topbar() {
  const pathname = usePathname();
  const [tripName, setTripName] = useState<string>('');
  
  const fetchTripName = async () => {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      if (data.trip?.name) {
        setTripName(data.trip.name);
      }
    } catch (err) {
      console.error('Failed to fetch trip name in Topbar:', err);
    }
  };

  useEffect(() => {
    fetchTripName();

    const handleUpdate = () => {
      fetchTripName();
    };

    window.addEventListener('trip-updated', handleUpdate);
    return () => window.removeEventListener('trip-updated', handleUpdate);
  }, []);
  
  const getTitle = () => {
    switch(pathname) {
      case '/': return 'Дашборд';
      case '/itinerary': return 'Маршрут';
      case '/map': return 'Карта';
      case '/places': return 'Места';
      case '/expenses': return 'Бюджет';
      case '/documents': return 'Документы';
      case '/notes': return 'Чат и заметки';
      case '/people': return 'Участники и AI';
      case '/settings': return 'Настройки';
      default: return tripName || 'Поездка';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-soft select-none">
          {tripName ? tripName.charAt(0).toUpperCase() : 'A'}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{getTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-3">
        <IdentitySelector className="lg:hidden w-28 text-xs shrink-0" />
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors text-text-secondary">
          <Search className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors text-text-secondary relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-status-error border-2 border-surface"></span>
        </button>
        <button className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors text-text-secondary">
          <Info className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
