"use client";

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, FileText, X, Loader2, Check, AlertCircle, Sparkles, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ParsedActivity {
  time: string;
  title: string;
  category: string;
  description: string;
}

interface ParsedDay {
  dayNumber: number;
  date: string;
  title: string;
  activities: ParsedActivity[];
}

type ImportStep = 'upload' | 'processing' | 'preview' | 'saving' | 'done' | 'error';

const categoryLabels: Record<string, string> = {
  transport: '🚗 Транспорт',
  food: '🍽 Еда',
  sightseeing: '🏛 Осмотр',
  hotel: '🏨 Отель',
  activity: '🎯 Активность',
  shopping: '🛍 Шоппинг',
  other: '📌 Другое',
};

export function ImportModal({
  tripId,
  isOpen,
  onClose,
}: {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [days, setDays] = useState<ParsedDay[]>([]);
  const [savedStats, setSavedStats] = useState({ daysCreated: 0, activitiesCreated: 0 });

  const reset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setErrorMessage('');
    setRawText('');
    setShowRawText(false);
    setDays([]);
    setSavedStats({ daysCreated: 0, activitiesCreated: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = () => {
    if (step === 'done') {
      window.dispatchEvent(new CustomEvent('trip-updated'));
      router.refresh();
    }
    reset();
    onClose();
  };

  // ── Step 1: Upload & Parse ──────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStep('processing');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при загрузке файла');
      }

      if (!data.days?.length) {
        throw new Error('AI не нашёл данных маршрута в файле. Проверьте, что файл содержит план поездки.');
      }

      setDays(data.days);
      setRawText(data.rawText || '');
      setStep('preview');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setStep('error');
    }
  };

  // ── Step 2: Remove items from preview ───────────────────────────────
  const removeDay = (dayIndex: number) => {
    setDays(prev => prev.filter((_, i) => i !== dayIndex));
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    setDays(prev =>
      prev.map((day, di) =>
        di === dayIndex
          ? { ...day, activities: day.activities.filter((_, ai) => ai !== actIndex) }
          : day
      )
    );
  };

  // ── Step 3: Confirm Import ──────────────────────────────────────────
  const handleConfirm = async () => {
    const filteredDays = days.filter(d => d.activities.length > 0);
    if (!filteredDays.length) {
      setErrorMessage('Нет дней с активностями для импорта');
      return;
    }

    setStep('saving');

    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, days: filteredDays }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при сохранении');
      }

      setSavedStats({
        daysCreated: data.daysCreated,
        activitiesCreated: data.activitiesCreated,
      });
      setStep('done');
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: `Импорт завершён: ${data.daysCreated} дней, ${data.activitiesCreated} событий`,
      }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка сохранения');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  // ── Total stats for preview ─────────────────────────────────────────
  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-[780] text-lg text-text-primary m-0 leading-tight">
                Умный импорт
              </h3>
              <p className="text-text-tertiary text-[11px] m-0">
                Excel (.xlsx) или Word (.docx)
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Upload Step ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-[20px] p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-elevated flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Upload className="w-6 h-6 text-text-tertiary group-hover:text-primary transition-colors" />
                </div>
                <p className="font-semibold text-text-primary text-sm m-0">
                  Нажмите для выбора файла
                </p>
                <p className="text-text-tertiary text-xs m-0 mt-1">
                  или перетащите файл сюда
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-[14px] bg-surface-elevated border border-border">
                  <FileSpreadsheet className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-xs text-text-secondary">.xlsx, .xls</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-[14px] bg-surface-elevated border border-border">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs text-text-secondary">.docx</span>
                </div>
              </div>

              <p className="text-text-tertiary text-[11px] text-center m-0">
                AI автоматически разберёт даты, время и активности
              </p>
            </div>
          )}

          {/* ── Processing Step ── */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm m-0">
                  AI анализирует файл...
                </p>
                <p className="text-text-tertiary text-xs m-0 mt-1">
                  {fileName}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 items-center text-text-tertiary text-[11px]">
                <span>📄 Извлечение текста</span>
                <span>🤖 Маппинг в маршрут</span>
                <span>✅ Формирование превью</span>
              </div>
            </div>
          )}

          {/* ── Preview Step ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-primary/5 border border-primary/10">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-text-primary font-medium">
                  Найдено <strong>{days.length}</strong> дней и <strong>{totalActivities}</strong> событий
                </span>
              </div>

              {/* Days & Activities */}
              <div className="space-y-3">
                {days.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border border-border rounded-[17px] overflow-hidden"
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between p-3 bg-surface-elevated border-b border-border">
                      <div>
                        <span className="font-mono font-extrabold text-[10px] tracking-wider text-text-tertiary">
                          ДЕНЬ {dayIdx + 1}
                          {day.date && <span className="ml-2 text-text-secondary">{day.date}</span>}
                        </span>
                        <h4 className="text-sm font-semibold text-text-primary m-0 mt-0.5">
                          {day.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeDay(dayIdx)}
                        className="p-1 rounded-lg text-text-tertiary hover:bg-surface hover:text-status-error transition-colors"
                        title="Убрать день"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Activities */}
                    <div className="divide-y divide-border">
                      {day.activities.map((act, actIdx) => (
                        <div
                          key={actIdx}
                          className="flex items-start justify-between p-3 hover:bg-surface-elevated/50 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-mono text-[11px] text-text-tertiary w-10 shrink-0 pt-0.5">
                              {act.time}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-text-tertiary">
                                  {categoryLabels[act.category] || act.category}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-text-primary m-0 mt-0.5 truncate">
                                {act.title}
                              </p>
                              {act.description && (
                                <p className="text-xs text-text-tertiary m-0 mt-0.5 line-clamp-2">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeActivity(dayIdx, actIdx)}
                            className="p-1 rounded-lg text-text-tertiary hover:text-status-error transition-colors shrink-0 ml-2"
                            title="Убрать"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw Text Toggle */}
              {rawText && (
                <div>
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showRawText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Показать извлечённый текст
                  </button>
                  {showRawText && (
                    <pre className="mt-2 p-3 bg-surface-elevated border border-border rounded-[12px] text-[11px] text-text-tertiary overflow-x-auto max-h-32 whitespace-pre-wrap">
                      {rawText}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Saving Step ── */}
          {step === 'saving' && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
              <p className="font-semibold text-text-primary text-sm m-0">Сохранение в маршрут...</p>
            </div>
          )}

          {/* ── Done Step ── */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-base m-0">Маршрут импортирован!</p>
                <p className="text-text-secondary text-sm m-0 mt-1.5">
                  Добавлено <strong>{savedStats.daysCreated}</strong> дней и{' '}
                  <strong>{savedStats.activitiesCreated}</strong> событий
                </p>
              </div>
            </div>
          )}

          {/* ── Error Step ── */}
          {step === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-status-error/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-status-error" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm m-0">Ошибка</p>
                <p className="text-text-secondary text-xs m-0 mt-1 max-w-xs mx-auto">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border shrink-0">
          {step === 'upload' && (
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm transition-colors"
            >
              Отмена
            </button>
          )}

          {step === 'preview' && (
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm transition-colors"
              >
                Другой файл
              </button>
              <button
                onClick={handleConfirm}
                disabled={days.length === 0}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                Импортировать
              </button>
            </div>
          )}

          {step === 'done' && (
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              Готово
            </button>
          )}

          {step === 'error' && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm transition-colors"
              >
                Закрыть
              </button>
              <button
                onClick={reset}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm shadow-md hover:opacity-90 transition-opacity"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
