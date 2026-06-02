"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Wallet, Plus, Trash2, X, CircleDollarSign, Loader2, User } from 'lucide-react';
import { useIdentity } from '@/components/layout/IdentityContext';

interface UserDetail {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
}

interface ExpenseParticipant {
  id: string;
  userId: string;
  user: UserDetail;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  paidBy: UserDetail;
  participants: ExpenseParticipant[];
}

interface Participant {
  id: string;
  user: UserDetail;
}

interface ExpensesClientProps {
  tripId: string;
  initialExpenses: Expense[];
  participants: Participant[];
  totalBudget: number;
}

export function ExpensesClient({ tripId, initialExpenses, participants, totalBudget }: ExpensesClientProps) {
  const router = useRouter();
  const { currentUser } = useIdentity();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [paidById, setPaidById] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    participants.map(p => p.user.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync paidById with current logged in user
  useEffect(() => {
    if (currentUser) {
      setPaidById(currentUser.id);
    } else if (participants.length > 0) {
      setPaidById(participants[0].user.id);
    }
  }, [currentUser, participants, isAddModalOpen]);

  // Recalculate Stats
  const totalSpent = initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const targetPerPerson = totalBudget / (participants.length || 1);

  // Category Totals
  const categoryTotals: Record<string, number> = {
    HOTEL: 0,
    RESTAURANT: 0,
    TRANSPORT: 0,
    ENTRANCE: 0,
    OTHER: 0
  };

  initialExpenses.forEach(exp => {
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += exp.amount;
    } else {
      categoryTotals.OTHER += exp.amount;
    }
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'HOTEL': return 'Отель';
      case 'RESTAURANT': return 'Ресторан';
      case 'TRANSPORT': return 'Транспорт';
      case 'ENTRANCE': return 'Входные';
      case 'OTHER': return 'Прочее';
      default: return 'Расход';
    }
  };

  const totalCalculated = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0) || 1;
  const percentages = {
    HOTEL: (categoryTotals.HOTEL / totalCalculated) * 100,
    RESTAURANT: (categoryTotals.RESTAURANT / totalCalculated) * 100,
    TRANSPORT: (categoryTotals.TRANSPORT / totalCalculated) * 100,
    ENTRANCE: (categoryTotals.ENTRANCE / totalCalculated) * 100,
    OTHER: (categoryTotals.OTHER / totalCalculated) * 100,
  };

  // Submit Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description.trim() || !selectedParticipants.length || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          category,
          description,
          paidById,
          participantIds: selectedParticipants,
          tripId,
        }),
      });

      const data = await res.json();

      if (data.expense) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: 'Расход успешно сохранён' 
        }));
        setIsAddModalOpen(false);
        // Reset form
        setAmount('');
        setDescription('');
        setCategory('OTHER');
        setSelectedParticipants(participants.map(p => p.user.id));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ошибка при сохранении расхода' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Вы действительно хотите удалить расход "${desc}"?`)) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Расход удалён' }));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Не удалось удалить расход' }));
    }
  };

  // Checkbox toggle handler
  const handleToggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="font-display font-[780] text-2xl tracking-[-0.02em] m-0">
            Совместный бюджет и расходы
          </h2>
          <p className="text-text-secondary text-sm m-0 mt-1">
            Разделение затрат между всеми участниками поездки
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[15px] bg-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Добавить расход
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
          <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Общий бюджет</div>
          <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px]">
            €{totalBudget.toLocaleString('ru')}
          </div>
          <div className="mt-[9px] text-text-secondary text-[13px]">На {participants.length} человек</div>
        </div>
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
          <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Потрачено</div>
          <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px] text-status-error">
            €{totalSpent.toLocaleString('ru')}
          </div>
          <div className="mt-[9px] text-text-secondary text-[13px]">
            {Math.round((totalSpent / totalBudget) * 100)}% от бюджета
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
          <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Остаток</div>
          <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px] text-ok">
            €{remainingBudget.toLocaleString('ru')}
          </div>
          <div className="mt-[9px] text-text-secondary text-[13px]">
            ~€{Math.round(remainingBudget / (participants.length || 1))} / чел.
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
          <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">На человека</div>
          <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px] text-primary">
            €{Math.round(targetPerPerson)}
          </div>
          <div className="mt-[9px] text-text-secondary text-[13px]">Целевой бюджет</div>
        </div>
      </div>

      {/* Expense Distribution Progress Bar */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5">
        <h3 className="m-0 font-display font-[760] text-lg text-text-primary">Распределение расходов</h3>
        <div className="h-4 bg-surface-elevated border border-border rounded-full flex overflow-hidden my-4">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percentages.HOTEL}%` }}></div>
          <div className="h-full bg-warn transition-all duration-300" style={{ width: `${percentages.RESTAURANT}%` }}></div>
          <div className="h-full bg-ok transition-all duration-300" style={{ width: `${percentages.TRANSPORT}%` }}></div>
          <div className="h-full bg-[#d946ef] transition-all duration-300" style={{ width: `${percentages.ENTRANCE}%` }}></div>
          <div className="h-full bg-border transition-all duration-300" style={{ width: `${percentages.OTHER}%` }}></div>
        </div>
        <div className="flex flex-wrap gap-4 text-text-secondary text-[13px]">
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-primary block"></i>Отели €{categoryTotals.HOTEL}</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-warn block"></i>Рестораны €{categoryTotals.RESTAURANT}</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-ok block"></i>Транспорт €{categoryTotals.TRANSPORT}</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-[#d946ef] block"></i>Входные €{categoryTotals.ENTRANCE}</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-border block"></i>Прочее €{categoryTotals.OTHER}</span>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft overflow-hidden">
        {/* Table Header (Desktop only) */}
        <div className="hidden md:grid grid-cols-[2.2fr_1.4fr_1fr_0.8fr_0.9fr_0.4fr] gap-3.5 items-center p-4 bg-surface-elevated border-b border-border text-[11px] font-mono font-extrabold tracking-wider uppercase text-text-secondary">
          <div>Расход</div>
          <div>Участники</div>
          <div>Категория</div>
          <div>Сумма</div>
          <div>Кто платил</div>
          <div className="text-right"></div>
        </div>

        {/* Table / Card Rows */}
        <div className="divide-y divide-border">
          {initialExpenses.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              Список расходов пуст.
            </div>
          ) : (
            initialExpenses.map((item) => (
              <div key={item.id}>
                {/* Desktop Layout Row */}
                <div className="hidden md:grid grid-cols-[2.2fr_1.4fr_1fr_0.8fr_0.9fr_0.4fr] gap-3.5 items-center p-4 text-sm hover:bg-surface-elevated/40 transition-colors">
                  <div className="font-medium text-text-primary">{item.description}</div>
                  <div className="flex -space-x-1.5">
                    {item.participants.map((ep) => (
                      <div
                        key={ep.id}
                        className="w-7 h-7 rounded-[10px] border border-surface text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: ep.user.avatarColor }}
                        title={ep.user.name}
                      >
                        {ep.user.initials}
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="px-2.5 py-1 rounded-full border border-border bg-surface text-text-secondary text-xs">
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <div className="font-bold text-text-primary">€{item.amount}</div>
                  <div className="text-text-secondary">{item.paidBy.name}</div>
                  <div className="text-right">
                    <button
                      onClick={() => handleDeleteExpense(item.id, item.description)}
                      className="p-1.5 rounded-lg text-text-tertiary hover:text-status-error hover:bg-surface-elevated transition-colors"
                      title="Удалить расход"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Layout Card */}
                <div className="md:hidden flex flex-col p-4 text-sm hover:bg-surface-elevated/40 transition-colors relative pr-12">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full border border-border bg-surface text-text-secondary text-[11px] font-medium">
                      {getCategoryLabel(item.category)}
                    </span>
                    <span className="font-bold text-base text-text-primary">
                      €{item.amount}
                    </span>
                  </div>

                  <div className="font-medium text-text-primary text-[15px] mb-3">
                    {item.description}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-2.5 mt-1">
                    <div className="text-xs text-text-secondary">
                      Платил: <span className="font-semibold text-text-primary">{item.paidBy.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-text-tertiary font-mono">ДЛЯ:</span>
                      <div className="flex -space-x-1">
                        {item.participants.map((ep) => (
                          <div
                            key={ep.id}
                            className="w-6 h-6 rounded-[8px] border border-surface text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm"
                            style={{ backgroundColor: ep.user.avatarColor }}
                            title={ep.user.name}
                          >
                            {ep.user.initials}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button mobile absolute */}
                  <div className="absolute top-4 right-3">
                    <button
                      onClick={() => handleDeleteExpense(item.id, item.description)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-status-error hover:bg-surface-elevated transition-colors"
                      title="Удалить расход"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden relative">
            
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-display font-[780] text-lg text-text-primary m-0">Добавить расход</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Сумма (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Например: 120"
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors cursor-pointer"
                  >
                    <option value="HOTEL">Отель</option>
                    <option value="RESTAURANT">Ресторан</option>
                    <option value="TRANSPORT">Транспорт</option>
                    <option value="ENTRANCE">Входные билеты</option>
                    <option value="OTHER">Прочее</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Описание расхода</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Например: Ужин в ресторане Mullixhiu"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Paid By */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Кто платил</label>
                <select
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors cursor-pointer"
                >
                  {participants.map((p) => (
                    <option key={p.user.id} value={p.user.id}>
                      {p.user.name} ({p.user.initials})
                    </option>
                  ))}
                </select>
              </div>

              {/* Participants selection (splits) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">За кого платили (делят расход)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedParticipants.length === participants.length) {
                        setSelectedParticipants([]);
                      } else {
                        setSelectedParticipants(participants.map(p => p.user.id));
                      }
                    }}
                    className="text-[11px] text-primary font-bold hover:underline"
                  >
                    {selectedParticipants.length === participants.length ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-surface-elevated border border-border rounded-[15px] p-3 max-h-[140px] overflow-y-auto">
                  {participants.map((p) => {
                    const isChecked = selectedParticipants.includes(p.user.id);
                    return (
                      <label
                        key={p.user.id}
                        onClick={() => handleToggleParticipant(p.user.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border select-none",
                          isChecked
                            ? "bg-primary/5 border-primary/20 text-text-primary font-semibold"
                            : "bg-surface border-transparent hover:bg-surface-elevated text-text-secondary"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 accent-primary"
                        />
                        <span
                          className="w-5 h-5 rounded-md text-white flex items-center justify-center text-[9px] font-bold"
                          style={{ backgroundColor: p.user.avatarColor }}
                        >
                          {p.user.initials}
                        </span>
                        <span className="text-xs truncate">{p.user.name}</span>
                      </label>
                    );
                  })}
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
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить'
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
