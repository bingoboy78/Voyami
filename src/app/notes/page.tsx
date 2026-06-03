export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { NotesClient } from './NotesClient';

export default async function NotesPage() {
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

  const notes = await prisma.note.findMany({
    where: { tripId: trip.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true
    }
  });

  const messages = await prisma.chatMessage.findMany({
    where: { tripId: trip.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          initials: true,
          avatarColor: true
        }
      }
    }
  });

  return (
    <NotesClient
      tripId={trip.id}
      initialNotes={notes}
      initialMessages={messages}
    />
  );
}
