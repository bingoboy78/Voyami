export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const trip = await prisma.trip.findFirst();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const days = await prisma.day.findMany({
      where: { tripId: trip.id },
      orderBy: { dayNumber: 'asc' },
      select: {
        id: true,
        dayNumber: true,
        title: true
      }
    });

    return NextResponse.json({ days });
  } catch (error: any) {
    console.error('Failed to fetch trip with days:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
