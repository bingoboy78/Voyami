import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all participants of the active trip
export async function GET() {
  try {
    const trip = await prisma.trip.findFirst();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    const participants = await prisma.tripParticipant.findMany({
      where: { tripId: trip.id },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ participants });
  } catch (error: any) {
    console.error('Failed to get participants:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


// POST: Add new participant
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, initials, role, avatarColor, email, tripId } = body;

    if (!name || !initials || !role || !avatarColor || !tripId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create a User first
    const user = await prisma.user.create({
      data: {
        name,
        initials,
        avatarColor,
        email: email || null,
      },
    });

    // 2. Create the TripParticipant association
    const participant = await prisma.tripParticipant.create({
      data: {
        tripId,
        userId: user.id,
        role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ participant });
  } catch (error: any) {
    console.error('Failed to add participant:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove participant
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing participant ID' }, { status: 400 });
    }

    // Check if participant exists
    const participant = await prisma.tripParticipant.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Delete the participant association
    await prisma.tripParticipant.delete({
      where: { id },
    });

    // Optionally delete the user as well if they don't have other associations
    // For safety in this single-trip prototype, we delete the user too.
    await prisma.user.delete({
      where: { id: participant.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete participant:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Change participant role
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'Missing id or role' }, { status: 400 });
    }

    const updatedParticipant = await prisma.tripParticipant.update({
      where: { id },
      data: { role },
      include: { user: true },
    });

    return NextResponse.json({ participant: updatedParticipant });
  } catch (error: any) {
    console.error('Failed to update participant role:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
