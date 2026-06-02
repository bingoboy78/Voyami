"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { USER_COOKIE_NAME } from '@/lib/user';

async function getActiveUserId(): Promise<string> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_COOKIE_NAME)?.value;
  
  if (userId) {
    // Verify user exists in DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user.id;
  }
  
  // Fallback to first owner or any user
  const defaultUser = await prisma.tripParticipant.findFirst({
    where: { role: 'OWNER' },
    include: { user: true }
  }) || await prisma.tripParticipant.findFirst({
    include: { user: true }
  });
  
  if (!defaultUser) throw new Error('No users or participants found in database');
  return defaultUser.userId;
}

export async function sendMessageAction(tripId: string, content: string) {
  try {
    const senderId = await getActiveUserId();

    await prisma.chatMessage.create({
      data: {
        tripId,
        senderId,
        content,
      }
    });

    revalidatePath('/notes');
  } catch (err) {
    console.error('sendMessageAction error:', err);
    throw err;
  }
}

export async function createNoteAction(tripId: string, title: string, content: string) {
  try {
    const authorId = await getActiveUserId();

    await prisma.note.create({
      data: {
        tripId,
        authorId,
        title,
        content,
      }
    });

    revalidatePath('/notes');
  } catch (err) {
    console.error('createNoteAction error:', err);
    throw err;
  }
}

