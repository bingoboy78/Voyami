"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MapPin, Check, Compass, Coffee, Utensils, ShieldAlert, Plus, Trash2, X, Tag, Loader2, Calendar } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  category: string; // "RESTAURANT", "COFFEE", "SPOT", "PRACTICAL"
  description: string | null;
  tags: string; // comma-separated
  price: string | null;
}

interface Day {
  id: string;
  dayNumber: number;
  title: string;
}

const categories = [
  { id: 'all', name: 'Все', icon: Compass },
  { id: 'RESTAURANT', name: 'Рестораны', icon: Utensils },
  { id: 'COFFEE', name: 'Кофе', icon: Coffee },
  { id: 'SPOT', name: 'Места', icon: MapPin },
  { id: 'PRACTICAL', name: 'Практическое', icon: ShieldAlert }
];

export function PlacesClient({ tripId, initialPlaces }: { tripId: string; initialPlaces: Place[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Trip Days (for "Add to Itinerary" popup)
  const [days, setDays] = useState<Day[]>([]);
  const [activeAddToDayPlaceId, setActiveAddToDayPlaceId] = useState<string | null>(null);

  // Add Place Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('RESTAURANT');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load days list (fallback: we query it directly by fetching '/api/trips' which we'll update to return days)
  useEffect(() => {
    const fetchTripWithDays = async () => {
      try {
        const res = await fetch('/api/trips-with-days');
        const data = await res.json();
        if (data.days) {
          setDays(data.days);
        }
      } catch (err) {
        console.error('Failed to load days:', err);
      }
    };
    fetchTripWithDays();
  }, []);

  const filteredPlaces = activeFilter === 'all'
    ? initialPlaces
    : initialPlaces.filter(p => p.category === activeFilter);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'RESTAURANT': return 'Ресторан';
      case 'COFFEE': return 'Кофе / бар';
      case 'SPOT': return 'Место';
      case 'PRACTICAL': return 'Практическое';
      default: return 'Инфо';
    }
  };

  // Add Place Form Submit
  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          name: newName,
          category: newCategory,
          description: newDescription,
          tags: newTags,
          price: newPrice,
        }),
      });
      const data = await res.json();

      if (data.place) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Место "${newName}" успешно добавлено` 
        }));
        setIsAddModalOpen(false);
        // Reset form
        setNewName('');
        setNewCategory('RESTAURANT');
        setNewDescription('');
        setNewTags('');
        setNewPrice('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ошибка при добавлении места' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Place
  const handleDeletePlace = async (id: string, name: string) => {
    if (!confirm(`Вы действительно хотите удалить место "${name}"?`)) return;

    try {
      const res = await fetch(`/api/places?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: `Место "${name}" удалено` }));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Не удалось удалить место' }));
    }
  };

  // Save place to Itinerary Day
  const handleAddToItinerary = async (dayId: string, place: Place) => {
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          time: "12:00", // default placeholder
          category: place.category === 'RESTAURANT' || place.category === 'COFFEE' ? 'Обед' : 'Активность',
          title: place.name,
          description: place.description || '',
          tags: place.tags || '',
        }),
      });
      const data = await res.json();

      if (data.activity) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `"${place.name}" добавлено в маршрут!` 
        }));
        setActiveAddToDayPlaceId(null);
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Не удалось добавить в маршрут' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="font-display font-[780] text-2xl tracking-[-0.02em] m-0">
            Места, рестораны и practical info
          </h2>
          <p className="text-text-secondary text-sm m-0 mt-1">
            Подборка мест для реального использования в поездке
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[15px] bg-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Добавить место
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/5 border-primary/30 text-primary"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Places Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="p-8 text-center bg-surface border border-border rounded-[20px] text-text-secondary text-sm">
          Нет сохранённых мест в этой категории.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px] flex flex-col justify-between min-h-[220px] relative group">
              
              {/* Delete Button */}
              <button
                onClick={() => handleDeletePlace(place.id, place.name)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-text-tertiary hover:text-status-error hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Удалить место"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div>
                <div className="flex justify-between items-start gap-3 mb-2 pr-6">
                  <h4 className="font-display font-[760] text-lg tracking-[-0.010em] text-text-primary m-0">
                    {place.name}
                  </h4>
                  <div className="flex items-center gap-1 shrink-0">
                    {place.price && (
                      <span className="text-[11px] font-mono text-text-secondary border border-border rounded-[6px] px-1 bg-surface-elevated">
                        {place.price}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full border border-border bg-surface-elevated text-text-secondary text-[11px] font-medium whitespace-nowrap">
                      {getCategoryLabel(place.category)}
                    </span>
                  </div>
                </div>
                {place.description && (
                  <p className="text-text-secondary text-sm leading-relaxed m-0 mb-4">
                    {place.description}
                  </p>
                )}
              </div>
              <div>
                {place.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {place.tags.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full border border-border bg-surface text-text-secondary text-[11.5px]"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 relative">
                  <button 
                    onClick={() => router.push('/map')}
                    className="flex-1 px-3 py-2 rounded-[13px] bg-primary/10 text-primary font-semibold border border-transparent hover:bg-primary/20 transition-all text-sm flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-4 h-4" />
                    Карта
                  </button>
                  <div className="flex-1 relative">
                    <button
                      onClick={() => setActiveAddToDayPlaceId(activeAddToDayPlaceId === place.id ? null : place.id)}
                      className="w-full px-3 py-2 rounded-[13px] bg-surface text-text-primary border border-border hover:bg-surface-elevated transition-colors text-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      В маршрут
                    </button>

                    {/* Day Selection Popover */}
                    {activeAddToDayPlaceId === place.id && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 z-20 bg-surface border border-border rounded-xl shadow-xl p-2 space-y-1">
                        <div className="text-[10px] font-mono font-bold text-text-secondary uppercase px-2 pb-1 border-b border-border">Выберите день:</div>
                        {days.length === 0 ? (
                          <div className="text-[11px] text-text-secondary p-2 text-center">Нет дней</div>
                        ) : (
                          days.map((day) => (
                            <button
                              key={day.id}
                              onClick={() => handleAddToItinerary(day.id, place)}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              День {day.dayNumber}: {day.title}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Place Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden relative">
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <h3 className="font-display font-[780] text-lg text-text-primary m-0">Добавить новое место</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPlace} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Название места</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Например: Mullixhiu"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Категория</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors cursor-pointer"
                  >
                    <option value="RESTAURANT">Ресторан</option>
                    <option value="COFFEE">Кофе / бар</option>
                    <option value="SPOT">Интересное место</option>
                    <option value="PRACTICAL">Практическое</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Бюджет / Цена</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Например: €€ или Бесплатно"
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Описание</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Почему стоит посетить, рекомендации блюд, особенности..."
                  rows={3}
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Теги (через запятую)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                    <Tag className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Например: Местная кухня, Рыба, Вид"
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] pl-10 pr-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Добавить'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
