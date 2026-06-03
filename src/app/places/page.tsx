export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { PlacesClient } from './PlacesClient';

export default async function PlacesPage() {
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

  const places = await prisma.place.findMany({
    where: { tripId: trip.id },
    orderBy: { name: 'asc' }
  });

  return <PlacesClient tripId={trip.id} initialPlaces={places} />;
}
