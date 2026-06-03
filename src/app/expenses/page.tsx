export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { ExpensesClient } from './ExpensesClient';

export default async function ExpensesPage() {
  // Fetch active trip with participants and expenses
  const trip = await prisma.trip.findFirst({
    include: {
      participants: {
        include: { user: true }
      },
      expenses: {
        orderBy: { date: 'desc' },
        include: {
          paidBy: true,
          participants: {
            include: { user: true }
          }
        }
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

  return (
    <ExpensesClient
      tripId={trip.id}
      initialExpenses={trip.expenses}
      participants={trip.participants}
      totalBudget={trip.totalBudget || 1800}
    />
  );
}
