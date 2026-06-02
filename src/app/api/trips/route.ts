import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const trip = await prisma.trip.findFirst();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error: any) {
    console.error('Failed to get active trip:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, country, route, duration, totalBudget, currency } = body;

    // Find the first trip (since we are prototype/single-trip oriented for now)
    const trip = await prisma.trip.findFirst();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        name,
        country,
        route,
        duration: parseInt(duration) || 1,
        totalBudget: totalBudget ? parseFloat(totalBudget) : null,
        currency: currency || 'EUR',
      },
    });

    return NextResponse.json({ trip: updatedTrip });
  } catch (error: any) {
    console.error('Failed to update trip:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
