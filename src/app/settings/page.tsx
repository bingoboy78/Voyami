export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const trip = await prisma.trip.findFirst();

  if (!trip) {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-[20px]">
        <h2 className="text-xl font-bold">Поездка не найдена</h2>
        <p className="text-text-secondary mt-2">Пожалуйста, запустите сид базы данных: npx prisma db seed</p>
      </div>
    );
  }

  return <SettingsClient trip={trip} />;
}
