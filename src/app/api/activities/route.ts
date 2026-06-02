import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST: Create activity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dayId, time, category, title, description, tags, latitude, longitude, locationQuery } = body;

    if (!dayId || !time || !category || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max order in day to place at bottom
    const maxOrderAct = await prisma.activity.findFirst({
      where: { dayId },
      orderBy: { order: 'desc' },
    });
    const order = maxOrderAct ? maxOrderAct.order + 1 : 0;

    const id = crypto.randomUUID();
    const latVal = latitude !== undefined && latitude !== null ? parseFloat(latitude) : null;
    const lngVal = longitude !== undefined && longitude !== null ? parseFloat(longitude) : null;

    await prisma.$executeRawUnsafe(
      `INSERT INTO Activity (id, dayId, time, category, title, description, tags, "order", latitude, longitude, locationQuery, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      id,
      dayId,
      time,
      category,
      title,
      description || null,
      tags || '',
      order,
      latVal,
      lngVal,
      locationQuery || null
    );

    const [activity] = await prisma.$queryRaw<any[]>`
      SELECT * FROM Activity WHERE id = ${id}
    `;

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error('Failed to create activity:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update activity
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, dayId, time, category, title, description, tags, order, latitude, longitude, locationQuery } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing activity ID' }, { status: 400 });
    }

    // Fetch existing title and locationQuery to check if they changed
    const [existing] = await prisma.$queryRaw<any[]>`
      SELECT title, locationQuery FROM Activity WHERE id = ${id}
    `;

    let shouldResetCoordinates = false;
    if (existing) {
      if (title !== undefined && title !== existing.title) {
        shouldResetCoordinates = true;
      }
      if (locationQuery !== undefined && locationQuery !== existing.locationQuery) {
        shouldResetCoordinates = true;
      }
    }

    // Build SQL update dynamically
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (dayId !== undefined) { fieldsToUpdate.push('dayId = ?'); values.push(dayId); }
    if (time !== undefined) { fieldsToUpdate.push('time = ?'); values.push(time); }
    if (category !== undefined) { fieldsToUpdate.push('category = ?'); values.push(category); }
    if (title !== undefined) { fieldsToUpdate.push('title = ?'); values.push(title); }
    if (description !== undefined) { fieldsToUpdate.push('description = ?'); values.push(description); }
    if (tags !== undefined) { fieldsToUpdate.push('tags = ?'); values.push(tags); }
    if (order !== undefined) { fieldsToUpdate.push('"order" = ?'); values.push(order !== null ? parseInt(order) : null); }
    if (locationQuery !== undefined) { fieldsToUpdate.push('locationQuery = ?'); values.push(locationQuery); }

    // If title/locationQuery changed and we're not providing new coordinates, reset cached ones to null
    if (latitude !== undefined) {
      fieldsToUpdate.push('latitude = ?');
      values.push(latitude !== null ? parseFloat(latitude) : null);
    } else if (shouldResetCoordinates) {
      fieldsToUpdate.push('latitude = ?');
      values.push(null);
    }

    if (longitude !== undefined) {
      fieldsToUpdate.push('longitude = ?');
      values.push(longitude !== null ? parseFloat(longitude) : null);
    } else if (shouldResetCoordinates) {
      fieldsToUpdate.push('longitude = ?');
      values.push(null);
    }

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      const query = `UPDATE Activity SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
      await prisma.$executeRawUnsafe(query, ...values);
    }

    const [activity] = await prisma.$queryRaw<any[]>`
      SELECT * FROM Activity WHERE id = ${id}
    `;

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error('Failed to update activity:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete activity
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing activity ID' }, { status: 400 });
    }

    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete activity:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
