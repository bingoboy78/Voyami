import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Add new day
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, title, subtitle, tip } = body;

    if (!tripId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine the next dayNumber
    const lastDay = await prisma.day.findFirst({
      where: { tripId },
      orderBy: { dayNumber: 'desc' },
    });

    const dayNumber = lastDay ? lastDay.dayNumber + 1 : 1;

    const day = await prisma.day.create({
      data: {
        tripId,
        dayNumber,
        title,
        subtitle: subtitle || null,
        tip: tip || null,
      },
    });

    // Also update duration in Trip details if trip exists
    await prisma.trip.update({
      where: { id: tripId },
      data: { duration: dayNumber }
    });

    // Dispatch custom event from client (needs refresh)
    return NextResponse.json({ day });
  } catch (error: any) {
    console.error('Failed to create day:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
