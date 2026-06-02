import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ImportActivity {
  time: string;
  title: string;
  category: string;
  description: string;
}

interface ImportDay {
  dayNumber: number;
  date: string;
  title: string;
  activities: ImportActivity[];
}

// Map friendly categories to DB values
function mapCategory(cat: string): string {
  const mapping: Record<string, string> = {
    transport: 'Транспорт',
    food: 'Еда',
    sightseeing: 'Осмотр',
    hotel: 'Отель',
    activity: 'Активность',
    shopping: 'Шоппинг',
    other: 'Другое',
  };
  return mapping[cat.toLowerCase()] || cat;
}

export async function POST(request: Request) {
  try {
    const { tripId, days } = (await request.json()) as {
      tripId: string;
      days: ImportDay[];
    };

    if (!tripId || !days?.length) {
      return NextResponse.json(
        { error: 'Не указан tripId или пустой список дней' },
        { status: 400 }
      );
    }

    // Verify trip exists
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: 'Поездка не найдена' }, { status: 404 });
    }

    // Create days and activities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Completely remove old itinerary days (activities cascade delete)
      await tx.day.deleteMany({
        where: { tripId }
      });

      const createdDays = [];
      const startDayNumber = 1;

      for (let i = 0; i < days.length; i++) {
        const dayData = days[i];
        const dayNumber = startDayNumber + i;

        const day = await tx.day.create({
          data: {
            tripId,
            dayNumber,
            title: dayData.title || `День ${dayNumber}`,
            date: dayData.date ? new Date(dayData.date) : null,
            activities: {
              create: (dayData.activities || []).map((act, idx) => ({
                time: act.time || '09:00',
                title: act.title,
                category: mapCategory(act.category),
                description: act.description || '',
                tags: act.category || '',
                order: idx,
              })),
            },
          },
          include: { activities: true },
        });

        createdDays.push(day);
      }

      // Update trip duration
      await tx.trip.update({
        where: { id: tripId },
        data: { duration: startDayNumber + days.length - 1 },
      });

      return createdDays;
    });

    return NextResponse.json({
      success: true,
      daysCreated: result.length,
      activitiesCreated: result.reduce((sum, d) => sum + d.activities.length, 0),
    });
  } catch (err) {
    console.error('Import confirm error:', err);
    return NextResponse.json(
      { error: 'Ошибка при сохранении импортированного маршрута' },
      { status: 500 }
    );
  }
}
