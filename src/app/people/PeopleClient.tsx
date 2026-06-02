"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sparkles, Send, Shield, Loader2, Plus, Trash2, X, Users } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor: string;
  spent: number;
  notesCount: number;
  filesCount: number;
}

const AVATAR_COLORS = [
  'oklch(56% .14 192)', // Tealish (seed Alina)
  'oklch(62% .16 28)',  // Coral/orange (seed Maxim)
  'oklch(60% .15 300)', // Purple (seed Sveta)
  'oklch(55% .13 70)',  // Gold/yellow (seed Ivan)
  'oklch(58% .14 152)', // Emerald (seed Nadya)
  'oklch(52% .12 220)', // Blue (seed Roman)
  'oklch(65% 0.17 350)', // Rose pink
  'oklch(50% 0.15 15)'   // Dark Red
];

export function PeopleClient({ tripId, participants }: { tripId: string; participants: Participant[] }) {
  const router = useRouter();
  const [aiTitle, setAiTitle] = useState('Готов к работе');
  const [aiContent, setAiContent] = useState('Все данные поездки уже собраны. Можно получить маршрут, рекомендации ресторанов или практический ответ с учётом контекста.');
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Participant Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [newRole, setNewRole] = useState('MEMBER');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmittingParticipant, setIsSubmittingParticipant] = useState(false);

  const fetchAiResponse = async (body: { action?: string; prompt?: string; tripId: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.result) {
        setAiContent(data.result);
      } else if (data.error) {
        setAiContent(`Ошибка: ${data.error}`);
      } else {
        setAiContent('Не удалось получить ответ от ассистента.');
      }
    } catch (err) {
      console.error(err);
      setAiContent('Ошибка подключения к серверу AI-ассистента.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiChipClick = (key: string) => {
    let title = 'Сводка';
    if (key === 'route') title = 'Предлагаемый маршрут';
    if (key === 'food') title = 'Рестораны в Берате';
    if (key === 'tips') title = 'Советы по Албании';
    if (key === 'chat') title = 'Сводка чата';
    
    setAiTitle(title);
    fetchAiResponse({ action: key, tripId });
  };

  const handleAskAi = () => {
    if (!customQuestion.trim() || isLoading) return;

    setAiTitle('AI ответ');
    fetchAiResponse({ prompt: customQuestion, tripId });
    setCustomQuestion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAskAi();
    }
  };

  // Participant Form Submit
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newInitials.trim() || isSubmittingParticipant) return;

    setIsSubmittingParticipant(true);
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          initials: newInitials.toUpperCase().slice(0, 2),
          role: newRole,
          avatarColor: newColor,
          email: newEmail,
          tripId,
        }),
      });

      const data = await res.json();

      if (data.participant) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Участник ${newName} добавлен` 
        }));
        setIsAddModalOpen(false);
        // Reset form
        setNewName('');
        setNewInitials('');
        setNewEmail('');
        setNewRole('MEMBER');
        setNewColor(AVATAR_COLORS[0]);
        router.refresh();
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Ошибка: ${data.error || 'Не удалось добавить'}` 
        }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: 'Ошибка подключения к серверу' 
      }));
    } finally {
      setIsSubmittingParticipant(false);
    }
  };

  // Participant Role Change
  const handleChangeRole = async (participantId: string, role: string) => {
    try {
      const res = await fetch('/api/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: participantId, role }),
      });
      const data = await res.json();

      if (data.participant) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: 'Роль участника обновлена' 
        }));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: 'Не удалось обновить роль' 
      }));
    }
  };

  // Participant Delete
  const handleDeleteParticipant = async (participantId: string, name: string) => {
    if (!confirm(`Вы действительно хотите удалить участника ${name} из поездки?`)) return;

    try {
      const res = await fetch(`/api/participants?id=${participantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Участник ${name} удалён` 
        }));
        router.refresh();
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Ошибка: ${data.error || 'Не удалось удалить'}` 
        }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: 'Ошибка при удалении участника' 
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-5 items-start">
      {/* Left Column: Participants */}
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="font-display font-[780] text-2xl tracking-[-0.02em] m-0">Участники поездки</h2>
            <p className="text-text-secondary text-sm m-0 mt-1">
              Владелец редактирует маршрут, остальные комментируют и предлагают идеи
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[15px] bg-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 transition-all text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {participants.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px] flex flex-col gap-3 group relative">
              
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteParticipant(p.id, p.name)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-text-tertiary hover:text-status-error hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Удалить участника"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex gap-3 items-center">
                <div 
                  className="w-[46px] h-[46px] rounded-[16px] flex items-center justify-center font-display font-[800] text-[13px] text-white shadow-sm shrink-0"
                  style={{ backgroundColor: p.avatarColor }}
                >
                  {p.initials}
                </div>
                <div>
                  <div className="font-display font-[760] text-[16px] text-text-primary leading-tight">{p.name}</div>
                  
                  {/* Dynamic Role Switcher */}
                  <div className="mt-1 flex items-center gap-1.5">
                    {p.role === 'OWNER' && <Shield className="w-3 h-3 text-primary" />}
                    <select
                      value={p.role}
                      onChange={(e) => handleChangeRole(p.id, e.target.value)}
                      className="text-[11px] font-semibold text-text-secondary bg-transparent border-none outline-none focus:text-text-primary cursor-pointer p-0"
                    >
                      <option value="MEMBER">Участник</option>
                      <option value="OWNER">Владелец</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-2.5 mt-2">
                <div className="p-2.5 rounded-[14px] bg-surface-elevated border border-border text-center">
                  <strong className="block font-display font-[760] text-sm text-text-primary leading-none">
                    €{p.spent}
                  </strong>
                  <span className="block mt-1 text-[10px] text-text-secondary uppercase tracking-wider">Потратил</span>
                </div>
                <div className="p-2.5 rounded-[14px] bg-surface-elevated border border-border text-center">
                  <strong className="block font-display font-[760] text-sm text-text-primary leading-none">
                    {p.notesCount}
                  </strong>
                  <span className="block mt-1 text-[10px] text-text-secondary uppercase tracking-wider">Заметки</span>
                </div>
                <div className="p-2.5 rounded-[14px] bg-surface-elevated border border-border text-center">
                  <strong className="block font-display font-[760] text-sm text-text-primary leading-none">
                    {p.filesCount}
                  </strong>
                  <span className="block mt-1 text-[10px] text-text-secondary uppercase tracking-wider">Файлы</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: AI Assistant Panel */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5 sticky top-5 grid gap-4">
        <div className="flex gap-3 items-start border-b border-border pb-4 mb-2">
          <div className="w-[46px] h-[46px] rounded-[16px] bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="m-0 font-display font-[760] text-lg leading-none text-text-primary">AI-ассистент</h3>
            <p className="m-0 mt-1.5 text-text-secondary text-xs">
              Генерация маршрутов, рекомендации мест и ответы по поездке
            </p>
          </div>
        </div>

        {/* Action Chips */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleAiChipClick('route')} 
            disabled={isLoading}
            className="px-3 py-2 rounded-[13px] border border-border bg-surface-elevated text-xs font-semibold hover:bg-border transition-colors text-text-primary text-left disabled:opacity-50"
          >
            Сгенерировать маршрут
          </button>
          <button 
            onClick={() => handleAiChipClick('food')} 
            disabled={isLoading}
            className="px-3 py-2 rounded-[13px] border border-border bg-surface-elevated text-xs font-semibold hover:bg-border transition-colors text-text-primary text-left disabled:opacity-50"
          >
            Рестораны в Берате
          </button>
          <button 
            onClick={() => handleAiChipClick('tips')} 
            disabled={isLoading}
            className="px-3 py-2 rounded-[13px] border border-border bg-surface-elevated text-xs font-semibold hover:bg-border transition-colors text-text-primary text-left disabled:opacity-50"
          >
            Советы по Албании
          </button>
          <button 
            onClick={() => handleAiChipClick('chat')} 
            disabled={isLoading}
            className="px-3 py-2 rounded-[13px] border border-border bg-surface-elevated text-xs font-semibold hover:bg-border transition-colors text-text-primary text-left disabled:opacity-50"
          >
            Сводка чата
          </button>
        </div>

        {/* AI Output Window */}
        <div className="bg-surface-elevated border border-border rounded-[17px] p-4 min-h-[180px] text-sm leading-relaxed relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="font-mono font-extrabold text-[10px] tracking-widest uppercase text-text-secondary border-b border-border pb-1.5 mb-2.5">
              {aiTitle}
            </div>
            <div className="text-text-primary whitespace-pre-line">
              {isLoading ? (
                <span className="text-text-secondary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Думаю над вашим запросом...
                </span>
              ) : (
                aiContent
              )}
            </div>
          </div>
        </div>

        {/* AI Prompt Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: что лучше оставить на день 3?"
            disabled={isLoading}
            className="flex-1 border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-3 outline-none text-sm focus:border-primary/40 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleAskAi}
            disabled={isLoading}
            className="p-3 rounded-[15px] bg-primary text-primary-foreground font-semibold flex items-center justify-center shadow-md hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden relative">
            
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-display font-[780] text-lg text-text-primary m-0">Добавить участника</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddParticipant} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Имя</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    // Propose initials if empty or matches old name initials
                    if (e.target.value.trim()) {
                      const words = e.target.value.trim().split(' ');
                      const initials = words.length > 1
                        ? words[0][0] + words[1][0]
                        : words[0].slice(0, 2);
                      setNewInitials(initials.toUpperCase());
                    } else {
                      setNewInitials('');
                    }
                  }}
                  placeholder="Например: Света"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Initials & Role Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Initials */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Инициалы</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newInitials}
                    onChange={(e) => setNewInitials(e.target.value)}
                    placeholder="Например: СВ"
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors text-center font-bold"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Роль</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors cursor-pointer"
                  >
                    <option value="MEMBER">Участник</option>
                    <option value="OWNER">Владелец</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Email (необязательно)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sveta@example.com"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Avatar Color Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Цвет аватара</label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewColor(col)}
                      className={cn(
                        "w-8 h-8 rounded-xl transition-all relative border border-transparent shadow-sm shrink-0",
                        newColor === col ? "scale-110 ring-2 ring-primary/40 border-surface" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: col }}
                    >
                      {newColor === col && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm text-center transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingParticipant}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmittingParticipant ? (
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
