export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { PeopleClient } from './PeopleClient';

export default async function PeoplePage() {
  // Fetch active trip
  const trip = await prisma.trip.findFirst();

  if (!trip) {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-[20px]">
        <h2 className="text-xl font-bold">Поездка не найдена</h2>
        <p className="text-text-secondary mt-2">Пожалуйста, запустите сид базы данных: npx prisma db seed</p>
      </div>
    );
  }

  const dbParticipants = await prisma.tripParticipant.findMany({
    where: { tripId: trip.id },
    include: {
      user: {
        include: {
          _count: {
            select: {
              notes: { where: { tripId: trip.id } },
              documentsUploaded: { where: { tripId: trip.id } }
            }
          },
          expensesPaid: {
            where: { tripId: trip.id }
          }
        }
      }
    }
  });

  const participants = dbParticipants.map(p => {
    const totalSpent = p.user.expensesPaid.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      id: p.id,
      name: p.user.name,
      initials: p.user.initials,
      role: p.role,
      avatarColor: p.user.avatarColor,
      spent: totalSpent,
      notesCount: p.user._count.notes,
      filesCount: p.user._count.documentsUploaded
    };
  });

  return <PeopleClient tripId={trip.id} participants={participants} />;
}
