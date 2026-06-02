"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Tag, Info, AlertCircle, Plus, Trash2, Edit3, X, Check, CalendarDays, Loader2, FileUp } from 'lucide-react';
import { ImportModal } from './ImportModal';

interface Activity {
  id: string;
  time: string;
  category: string;
  title: string;
  description: string | null;
  tags: string;
  order: number;
  locationQuery: string | null;
}

interface Day {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string | null;
  tip: string | null;
  activities: Activity[];
}

export function ItineraryClient({ tripId, days }: { tripId: string; days: Day[] }) {
  const router = useRouter();
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Day Creator States
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [newDaySubtitle, setNewDaySubtitle] = useState('');
  const [isSubmittingDay, setIsSubmittingDay] = useState(false);

  // Activity Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null); // null means adding
  const [actTime, setActTime] = useState('');
  const [actCategory, setActCategory] = useState('Активность');
  const [actTitle, setActTitle] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [actTags, setActTags] = useState('');
  const [actLocationQuery, setActLocationQuery] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const activeDay = days[activeDayIndex] || days[0];

  // Add Day Submit
  const handleAddDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayTitle.trim() || isSubmittingDay) return;

    setIsSubmittingDay(true);
    try {
      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          title: newDayTitle,
          subtitle: newDaySubtitle,
        }),
      });
      const data = await res.json();

      if (data.day) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `День ${data.day.dayNumber} создан` 
        }));
        setIsAddingDay(false);
        setNewDayTitle('');
        setNewDaySubtitle('');
        // Make the new day active
        setActiveDayIndex(days.length);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ошибка при добавлении дня' }));
    } finally {
      setIsSubmittingDay(false);
    }
  };

  // Open Activity Modal (Add mode)
  const openAddActivity = () => {
    setEditingActivity(null);
    setActTime('');
    setActCategory('Активность');
    setActTitle('');
    setActDescription('');
    setActTags('');
    setActLocationQuery('');
    setIsActivityModalOpen(true);
  };

  // Open Activity Modal (Edit mode)
  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActTime(activity.time);
    setActCategory(activity.category);
    setActTitle(activity.title);
    setActDescription(activity.description || '');
    setActTags(activity.tags);
    setActLocationQuery(activity.locationQuery || '');
    setIsActivityModalOpen(true);
  };

  // Submit Activity (Add or Edit)
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTime.trim() || !actTitle.trim() || isSubmittingActivity) return;

    setIsSubmittingActivity(true);
    try {
      const isEdit = !!editingActivity;
      const url = '/api/activities';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        id: isEdit ? editingActivity.id : undefined,
        dayId: activeDay.id,
        time: actTime,
        category: actCategory,
        title: actTitle,
        description: actDescription,
        tags: actTags,
        locationQuery: actLocationQuery || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.activity) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: isEdit ? 'Событие обновлено' : 'Событие добавлено' 
        }));
        setIsActivityModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ошибка сохранения активности' }));
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (id: string, title: string) => {
    if (!confirm(`Удалить событие "${title}"?`)) return;

    try {
      const res = await fetch(`/api/activities?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Событие удалено' }));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Не удалось удалить событие' }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[310px_1fr] gap-5 items-start">
      {/* Left Column: Days List */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[14px] flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2.5 w-full shrink-0 scrollbar-none snap-x snap-mandatory">
        {days.map((day, idx) => (
          <button
            key={day.id}
            onClick={() => setActiveDayIndex(idx)}
            className={cn(
              "min-w-[170px] lg:w-full text-left p-3.5 rounded-[17px] border transition-all duration-200 shrink-0 snap-align-start",
              idx === activeDayIndex
                ? "bg-primary/5 border-primary/30"
                : "bg-surface border-border hover:bg-surface-elevated"
            )}
          >
            <div className="font-mono font-extrabold text-[10px] tracking-[0.13em] text-text-secondary">
              DAY 0{day.dayNumber}
            </div>
            <h4 className={cn(
              "font-display font-[760] text-[15px] leading-tight mt-1.5 mb-1 truncate",
              idx === activeDayIndex ? "text-primary" : "text-text-primary"
            )}>
              {day.title}
            </h4>
            <p className="text-text-secondary text-[11px] m-0 truncate">{day.subtitle || 'Без описания'}</p>
          </button>
        ))}

        {/* Add Day Button or Form Inline */}
        {isAddingDay ? (
          <form onSubmit={handleAddDaySubmit} className="border border-primary/20 bg-primary/5 rounded-[17px] p-3.5 space-y-2.5 shrink-0 min-w-[200px] lg:w-full">
            <input
              type="text"
              required
              value={newDayTitle}
              onChange={(e) => setNewDayTitle(e.target.value)}
              placeholder="Название (напр: Тирана)"
              className="w-full border border-border bg-surface text-text-primary rounded-[10px] px-2.5 py-1.5 outline-none text-xs focus:border-primary/40 transition-colors"
            />
            <input
              type="text"
              value={newDaySubtitle}
              onChange={(e) => setNewDaySubtitle(e.target.value)}
              placeholder="Подзаголовок (напр: Прибытие)"
              className="w-full border border-border bg-surface text-text-primary rounded-[10px] px-2.5 py-1.5 outline-none text-xs focus:border-primary/40 transition-colors"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingDay(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={isSubmittingDay}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center disabled:opacity-50"
              >
                {isSubmittingDay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingDay(true)}
            className="py-3 rounded-[17px] border border-dashed border-border hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 min-w-[120px] lg:w-full lg:mt-1 px-4"
          >
            <Plus className="w-4 h-4" />
            Добавить день
          </button>
        )}
      </div>

      {/* Right Column: Timeline Detail */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[22px]">
        {days.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-warn" />
            <h3 className="text-lg font-bold">Маршрут пуст</h3>
            <p className="text-text-secondary text-sm">Добавьте свой первый день слева или импортируйте маршрут из файла.</p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="mt-2 px-4 py-2.5 rounded-[15px] bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
            >
              <FileUp className="w-4 h-4" />
              Импорт из Excel / Word
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-5">
              <div>
                <h2 className="font-display font-[780] text-2xl tracking-[-0.02em] m-0">
                  {activeDay.title}
                </h2>
                <p className="text-text-secondary text-sm m-0 mt-1">
                  {activeDay.subtitle} · {activeDay.activities.length} остановок
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="px-3 py-1.5 rounded-[12px] border border-border bg-surface-elevated text-text-primary font-semibold flex items-center gap-1 text-xs hover:bg-primary/5 hover:border-primary/20 transition-all"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Импорт
                </button>
                <button
                  onClick={openAddActivity}
                  className="px-3 py-1.5 rounded-[12px] bg-primary text-primary-foreground font-semibold flex items-center gap-1 text-xs shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Событие
                </button>
                <span className="px-3 py-1.5 rounded-full border border-border bg-surface-elevated text-text-secondary text-xs font-semibold w-fit select-none">
                  День {activeDay.dayNumber} из {days.length}
                </span>
              </div>
            </div>

            {/* Timeline Items */}
            {activeDay.activities.length === 0 ? (
              <div className="py-12 text-center text-text-secondary">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-text-tertiary" />
                <p className="text-sm m-0">Нет запланированных событий на этот день.</p>
                <button
                  onClick={openAddActivity}
                  className="mt-3 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  Запланировать первое событие
                </button>
              </div>
            ) : (
              <div className="relative border-l border-border ml-5 lg:ml-[95px] pl-5 lg:pl-6 py-2 grid gap-6">
                {[...activeDay.activities]
                  .sort((a, b) => a.time.localeCompare(b.time) || a.order - b.order)
                  .map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline Indicator Dot */}
                      <div className="absolute -left-[27px] lg:-left-[31px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-surface z-10"></div>
                      
                      {/* Time Badge (Desktop only) */}
                      <div className="hidden lg:block absolute -left-[95px] top-1 text-right font-mono font-extrabold text-[12px] tracking-wider text-text-secondary w-14">
                        {item.time}
                      </div>

                      {/* Detail Card */}
                      <div className="bg-surface-elevated border border-border rounded-[17px] p-4 shadow-sm hover:border-primary/20 transition-all duration-200 relative pr-12 lg:pr-16">
                        {/* Hover Actions */}
                        <div className="absolute top-3.5 right-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditActivity(item)}
                            className="p-1 rounded-lg text-text-secondary hover:bg-surface hover:text-primary transition-colors"
                            title="Редактировать"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(item.id, item.title)}
                            className="p-1 rounded-lg text-text-secondary hover:bg-surface hover:text-status-error transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono font-extrabold text-[10px] tracking-wider uppercase text-text-tertiary">
                            {item.category}
                          </span>
                          {/* Mobile-only Time Indicator */}
                          <span className="lg:hidden font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {item.time}
                          </span>
                        </div>
                        
                        <h4 className="font-display font-[760] text-base lg:text-lg tracking-[-0.010em] mt-1.5 mb-1 text-text-primary">
                          {item.title}
                        </h4>
                        
                        {item.description && (
                          <p className="text-text-secondary text-sm leading-relaxed m-0 mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {item.tags.split(',').map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="px-2.5 py-1 rounded-full border border-border bg-surface text-text-secondary text-[11px] font-medium"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Practical Tip */}
            {activeDay.tip && (
              <div className="mt-8 p-4 rounded-[17px] bg-primary/5 border border-primary/10 flex gap-3 items-start">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm font-semibold text-text-primary block">Практический совет</strong>
                  <p className="text-text-secondary text-sm m-0 mt-1">{activeDay.tip}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden relative">
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-display font-[780] text-lg text-text-primary m-0">
                  {editingActivity ? 'Редактировать событие' : 'Запланировать событие'}
                </h3>
              </div>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleActivitySubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Время</label>
                  <input
                    type="text"
                    required
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    placeholder="Например: 09:30"
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Категория</label>
                  <select
                    value={actCategory}
                    onChange={(e) => setActCategory(e.target.value)}
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors cursor-pointer"
                  >
                    <option value="Активность">Активность</option>
                    <option value="Транспорт">Транспорт</option>
                    <option value="Обед">Обед / Ресторан</option>
                    <option value="Отель">Отель / Ночлег</option>
                    <option value="Достопримечательность">Место</option>
                    <option value="Практическое">Инфо</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Событие</label>
                <input
                  type="text"
                  required
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="Например: Выезд в Берат или Mullixhiu"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Описание</label>
                <textarea
                  value={actDescription}
                  onChange={(e) => setActDescription(e.target.value)}
                  placeholder="Детали бронирования, контакты, адрес..."
                  rows={3}
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors resize-none"
                />
              </div>

              {/* Geolocation Query */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Геолокация (на английском)
                </label>
                <input
                  type="text"
                  value={actLocationQuery}
                  onChange={(e) => setActLocationQuery(e.target.value)}
                  placeholder="Например: Skanderbeg Square, Tirana"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
                <span className="text-[10px] text-text-secondary block leading-normal">
                  Оставьте пустым, чтобы искать по названию события, или заполните для точного отображения.
                </span>
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
                    value={actTags}
                    onChange={(e) => setActTags(e.target.value)}
                    placeholder="Например: Бронь, Важно, Отель"
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] pl-10 pr-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingActivity}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmittingActivity ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    editingActivity ? 'Сохранить' : 'Добавить'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Import Modal */}
      <ImportModal
        tripId={tripId}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
