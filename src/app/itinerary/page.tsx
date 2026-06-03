export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { ItineraryClient } from './ItineraryClient';

export default async function ItineraryPage() {
  // Fetch active trip's days and activities
  const trip = await prisma.trip.findFirst();
  
  if (!trip) {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-[20px]">
        <h2 className="text-xl font-bold">Поездка не найдена</h2>
        <p className="text-text-secondary mt-2">Пожалуйста, запустите сид базы данных: npx prisma db seed</p>
      </div>
    );
  }

  const days = await prisma.day.findMany({
    where: { tripId: trip.id },
    orderBy: { dayNumber: 'asc' },
    include: {
      activities: {
        orderBy: { order: 'asc' }
      }
    }
  });

  return <ItineraryClient tripId={trip.id} days={days} />;
}
