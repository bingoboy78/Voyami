import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Add new place
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, description, tags, price, tripId } = body;

    if (!name || !category || !tripId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const place = await prisma.place.create({
      data: {
        tripId,
        name,
        category,
        description: description || null,
        tags: tags || '',
        price: price || null,
      },
    });

    return NextResponse.json({ place });
  } catch (error: any) {
    console.error('Failed to add place:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove place
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing place ID' }, { status: 400 });
    }

    await prisma.place.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete place:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
