export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ShareButton } from '@/components/layout/ShareButton';

export default async function DashboardPage() {
  // Fetch active trip
  const trip = await prisma.trip.findFirst({
    include: {
      participants: {
        include: { user: true }
      },
      documents: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { sender: true }
      },
      expenses: {
        include: { paidBy: true }
      }
    }
  });

  if (!trip) {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-[20px]">
        <h2 className="text-xl font-bold">Поездка не найдена</h2>
        <p className="text-text-secondary mt-2">Пожалуйста, запустите сид базы данных: npx prisma db seed</p>
      </div>
    );
  }

  // Calculate stats
  // Get all activities count for active day (let's assume Day 2 is "today" for mock purposes)
  const todayDay = await prisma.day.findFirst({
    where: { tripId: trip.id, dayNumber: 2 },
    include: { _count: { select: { activities: true } } }
  });
  const todayActivitiesCount = todayDay?._count.activities || 0;

  const totalDocsCount = trip.documents.length;
  const offlineDocsCount = trip.documents.filter(d => d.isOfflineAvailable).length;

  const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalBudget = trip.totalBudget || 1800;

  const totalMessagesCount = await prisma.chatMessage.count({
    where: { tripId: trip.id }
  });

  // Find next event (e.g. lunch in Mullixhiu)
  const nextEvent = await prisma.activity.findFirst({
    where: {
      title: { contains: 'Mullixhiu' }
    }
  });

  // Get important documents
  const importantDocs = trip.documents.slice(0, 3);

  // Get latest chat updates (reverse the fetched order so they read chronological or keep latest desc)
  const recentUpdates = [...trip.messages].reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.85fr] gap-5">
      {/* Left Column */}
      <div className="grid gap-5">
        {/* Hero Card */}
        <div className="relative overflow-hidden min-h-[300px] p-6 rounded-[20px] bg-surface border border-border shadow-soft"
             style={{ backgroundImage: 'linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 10%, var(--color-surface)), transparent 58%), var(--color-surface)' }}>
          <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Source of truth</div>
          <h1 className="mt-[14px] mb-[12px] font-display font-[780] text-[clamp(38px,5vw,64px)] leading-[0.92] tracking-[-0.06em] max-w-[11ch]">
            {trip.name}: один гид для всех
          </h1>
          <p className="m-0 text-text-secondary text-[15px] max-w-[62ch] leading-[1.55]">
            Общий центр поездки для {trip.participants.length} человек: маршрут по дням, карта, рестораны, документы, бюджет, заметки и быстрые апдейты во время поездки.
          </p>
          <div className="flex gap-2 flex-wrap mt-[18px]">
            <span className="px-[10px] py-2 rounded-full bg-surface border border-border text-[12px]">{trip.route}</span>
            <span className="px-[10px] py-2 rounded-full bg-surface border border-border text-[12px]">{trip.duration} дня</span>
            <span className="px-[10px] py-2 rounded-full bg-surface border border-border text-[12px]">3 пары</span>
            <span className="px-[10px] py-2 rounded-full bg-surface border border-border text-[12px]">Offline ready</span>
          </div>
          <div className="flex gap-[10px] flex-wrap mt-5">
            <Link href="/itinerary" className="px-4 py-2 rounded-[13px] bg-primary text-primary-foreground font-[800] border border-transparent hover:opacity-90 transition-opacity">
              Открыть маршрут
            </Link>
            <Link href="/documents" className="px-4 py-2 rounded-[13px] bg-surface text-text-primary border border-border hover:bg-surface-elevated transition-colors">
              Документы
            </Link>
            <Link href="/map" className="px-4 py-2 rounded-[13px] bg-surface text-text-primary border border-border hover:bg-surface-elevated transition-colors">
              Карта
            </Link>
          </div>
          {nextEvent && (
            <div className="lg:absolute lg:right-[22px] lg:top-[22px] mt-6 lg:mt-0 w-full lg:w-[250px] p-[14px] border border-border rounded-[18px] shadow-soft"
                 style={{ backgroundColor: 'color-mix(in oklab, var(--color-surface) 92%, transparent)' }}>
              <strong className="block text-[14px]">Ближайшее событие</strong>
              <span className="block text-text-secondary text-[12px] mt-[6px] leading-[1.4]">
                Сегодня, {nextEvent.time} · {nextEvent.title} · бронь подтверждена
              </span>
              <div className="flex items-center gap-2 mt-3 text-text-secondary text-[12px]">
                <div className="w-[8px] h-[8px] rounded-full bg-[var(--ok)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--ok)_16%,transparent)] relative z-10"></div>
                Тирана
                <i className="h-[2px] bg-border flex-1 mx-1"></i>
                Берат
                <div className="w-[8px] h-[8px] rounded-full bg-primary relative z-10"></div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
            <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Сегодня</div>
            <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px]">{todayActivitiesCount}</div>
            <div className="mt-[9px] text-text-secondary text-[13px]">точек в плане</div>
          </div>
          <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
            <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Документы</div>
            <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px]">{totalDocsCount}</div>
            <div className="mt-[9px] text-text-secondary text-[13px]">{offlineDocsCount} доступны офлайн</div>
          </div>
          <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
            <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Бюджет</div>
            <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px]">€{totalSpent}</div>
            <div className="mt-[9px] text-text-secondary text-[13px]">из €{totalBudget}</div>
          </div>
          <div className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px]">
            <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-text-secondary">Updates</div>
            <div className="font-display font-[780] text-[34px] leading-[0.9] tracking-[-0.05em] mt-[10px]">{totalMessagesCount}</div>
            <div className="mt-[9px] text-text-secondary text-[13px]">комментариев в чате</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5">
          <div className="flex justify-between items-center gap-[14px] mb-[14px]">
            <div>
              <h3 className="m-0 font-display font-[760] text-[19px] leading-[1.05] tracking-[-0.025em]">Быстрые действия</h3>
              <p className="m-0 mt-[6px] text-text-secondary text-[13px]">Самые частые сценарии во время поездки</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              { href: "/itinerary", title: "Открыть маршрут", desc: "Таймлайн по дням" },
              { href: "/documents", title: "Показать ваучеры", desc: "Билеты, отели, транспорт" },
              { href: "/expenses", title: "Разделить расходы", desc: "Кто платил и кто должен" },
              { href: "/notes", title: "Открыть чат", desc: "Заметки и предложения" },
            ].map((action, i) => (
              <Link key={i} href={action.href} className="text-left border border-border bg-surface-elevated rounded-[16px] p-4 transition duration-150 hover:-translate-y-[1px] hover:border-primary/30 group">
                <strong className="block font-semibold group-hover:text-primary transition-colors">{action.title}</strong>
                <span className="block mt-[6px] text-text-secondary text-[12px]">{action.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="grid gap-5">
        {/* Share Trip Card */}
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5 h-fit">
          <h3 className="m-0 font-display font-[760] text-[19px] leading-[1.05] tracking-[-0.025em]">Совместный доступ</h3>
          <p className="m-0 mt-1 mb-4 text-text-secondary text-[13px]">
            Поделитесь ссылкой с друзьями, чтобы планировать поездку вместе
          </p>
          <ShareButton />
        </div>

        {/* Trip Status */}
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5 h-fit">
          <div className="flex justify-between items-center gap-[14px] mb-[14px]">
            <div>
              <h3 className="m-0 font-display font-[760] text-[19px] leading-[1.05] tracking-[-0.025em]">Статус поездки</h3>
              <p className="m-0 mt-[6px] text-text-secondary text-[13px]">Что важно прямо сейчас</p>
            </div>
          </div>
          <div className="grid gap-[11px]">
            <div className="flex gap-3 items-start p-[14px] rounded-[16px] bg-surface-elevated border border-border">
              <span className="w-[10px] h-[10px] rounded-full bg-primary mt-[5px] flex-shrink-0"></span>
              <div>
                <strong className="block text-[14px]">Следующий шаг</strong>
                <div className="text-text-secondary text-[13px] mt-1">Обед в Mullixhiu через 2 часа. Бронь подтверждена.</div>
              </div>
            </div>
            <div className="flex gap-3 items-start p-[14px] rounded-[16px] bg-surface-elevated border border-border">
              <span className="w-[10px] h-[10px] rounded-full bg-[var(--ok)] mt-[5px] flex-shrink-0"></span>
              <div>
                <strong className="block text-[14px]">Офлайн доступ</strong>
                <div className="text-text-secondary text-[13px] mt-1">Маршрут, документы и заметки сохранены локально.</div>
              </div>
            </div>
            <div className="flex gap-3 items-start p-[14px] rounded-[16px] bg-surface-elevated border border-border">
              <span className="w-[10px] h-[10px] rounded-full bg-status-error mt-[5px] flex-shrink-0"></span>
              <div>
                <strong className="block text-[14px]">Нужно проверить</strong>
                <div className="text-text-secondary text-[13px] mt-1">Аренда авто на день 4 ещё не отмечена как оплаченная всеми.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Documents */}
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5 h-fit">
          <div className="flex justify-between items-center gap-[14px] mb-[14px]">
            <div>
              <h3 className="m-0 font-display font-[760] text-[19px] leading-[1.05] tracking-[-0.025em]">Важные документы</h3>
              <p className="m-0 mt-[6px] text-text-secondary text-[13px]">Быстрый доступ с телефона</p>
            </div>
            <Link href="/documents" className="px-3 py-[6px] rounded-[13px] border border-border bg-surface text-text-primary text-[13px] hover:bg-surface-elevated transition-colors">Все</Link>
          </div>
          <div className="grid gap-[11px]">
            {importantDocs.map((doc) => (
              <div key={doc.id} className="flex gap-3 p-[14px] rounded-[16px] bg-surface-elevated border border-border">
                <div className="w-[30px] h-[30px] rounded-[11px] bg-primary/10 flex items-center justify-center font-mono font-[800] text-[12px] flex-shrink-0 text-primary">
                  {doc.fileType}
                </div>
                <div>
                  <strong className="block text-[14px]">{doc.title}</strong>
                  <span className="block mt-[5px] text-text-secondary text-[12px] leading-[1.35]">{doc.fileName} · {doc.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5 h-fit">
          <div className="flex justify-between items-center gap-[14px] mb-[14px]">
            <div>
              <h3 className="m-0 font-display font-[760] text-[19px] leading-[1.05] tracking-[-0.025em]">Свежие апдейты</h3>
              <p className="m-0 mt-[6px] text-text-secondary text-[13px]">От участников поездки</p>
            </div>
          </div>
          <div className="grid gap-[11px]">
            {recentUpdates.map((update) => (
              <div key={update.id} className="flex gap-3 p-[14px] rounded-[16px] bg-surface-elevated border border-border">
                <div className="w-[30px] h-[30px] rounded-[11px] flex items-center justify-center font-display font-[800] text-[11px] flex-shrink-0 text-white" 
                     style={{ backgroundColor: update.sender.avatarColor }}>
                  {update.sender.initials}
                </div>
                <div>
                  <strong className="block text-[14px]">{update.sender.name}</strong>
                  <span className="block mt-[5px] text-text-secondary text-[12px] leading-[1.35]">{update.content}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
