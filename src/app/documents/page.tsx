import { prisma } from '@/lib/prisma';
import { DocumentsClient } from './DocumentsClient';

export default async function DocumentsPage() {
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

  const documents = await prisma.document.findMany({
    where: { tripId: trip.id },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: {
          name: true
        }
      }
    }
  });

  return <DocumentsClient initialDocs={documents} />;
}
