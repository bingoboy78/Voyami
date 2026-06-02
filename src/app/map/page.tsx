import { prisma } from '@/lib/prisma';
import { MapClient } from './MapClient';

export default async function MapPage() {
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

  // Fetch days
  const daysRaw = await prisma.day.findMany({
    where: { tripId: trip.id },
    orderBy: { dayNumber: 'asc' },
  });

  // Fetch activities using raw query to bypass schema caching issues
  const days = await Promise.all(
    daysRaw.map(async (day) => {
      const activities = await prisma.$queryRaw<any[]>`
        SELECT id, time, category, title, description, tags, "order", latitude, longitude, locationQuery, dayId
        FROM Activity
        WHERE dayId = ${day.id}
        ORDER BY time ASC, "order" ASC
      `;
      return {
        ...day,
        activities,
      };
    })
  );

  return (
    <MapClient 
      days={days} 
      tripCountry={trip.country || 'Albania'} 
    />
  );
}
