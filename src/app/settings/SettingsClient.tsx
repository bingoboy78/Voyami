"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Plane, MapPin, Wallet, Calendar } from 'lucide-react';
import { ShareButton } from '@/components/layout/ShareButton';

interface Trip {
  id: string;
  name: string;
  country: string;
  route: string;
  duration: number;
  totalBudget: number | null;
  currency: string;
}

export function SettingsClient({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [name, setName] = useState(trip.name);
  const [country, setCountry] = useState(trip.country);
  const [route, setRoute] = useState(trip.route);
  const [duration, setDuration] = useState(trip.duration.toString());
  const [totalBudget, setTotalBudget] = useState(trip.totalBudget?.toString() || '');
  const [currency, setCurrency] = useState(trip.currency);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          country,
          route,
          duration: parseInt(duration) || 1,
          totalBudget: totalBudget ? parseFloat(totalBudget) : null,
          currency,
        }),
      });

      const data = await res.json();

      if (data.trip) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: 'Настройки поездки успешно сохранены' 
        }));
        window.dispatchEvent(new CustomEvent('trip-updated'));
        router.refresh();
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Ошибка: ${data.error || 'Не удалось сохранить'}` 
        }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: 'Ошибка подключения к серверу' 
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-[780] text-2xl tracking-[-0.02em] m-0">Настройки поездки</h2>
        <p className="text-text-secondary text-sm m-0 mt-1">
          Измените основные параметры вашего путешествия. Обновления применятся ко всем экранам.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-[20px] shadow-soft p-6 max-w-2xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Название поездки */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Название поездки
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <Plane className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Албания 2024"
                className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] pl-10 pr-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Страна */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Страна назначения
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Например: Албания"
                className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] pl-10 pr-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Маршрут */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Маршрут
            </label>
            <input
              type="text"
              required
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Например: Тирана → Берат"
              className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Длительность */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Длительность (дней)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="number"
                required
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] pl-10 pr-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Бюджет */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Общий бюджет
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <Wallet className="w-4 h-4" />
              </span>
              <input
                type="number"
                min="0"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="Например: 1800"
                className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] pl-10 pr-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Валюта */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Валюта
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors appearance-none"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="RUB">RUB (₽)</option>
              <option value="ALL">ALL (Lek)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-3 rounded-[15px] bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить изменения
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-6 max-w-2xl space-y-4">
        <h3 className="m-0 font-display font-[760] text-lg text-text-primary">Доступ для друзей</h3>
        <p className="m-0 text-text-secondary text-sm">
          Скопируйте ссылку или покажите QR-код, чтобы друзья могли присоединиться к планированию поездки.
        </p>
        <div className="max-w-xs">
          <ShareButton />
        </div>
      </div>
    </div>
  );
}
