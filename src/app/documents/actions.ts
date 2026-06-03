"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
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

export async function uploadDocumentAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string || 'OTHER';
    
    if (!file) {
      throw new Error('Файл не предоставлен');
    }

    // Find the active trip
    const trip = await prisma.trip.findFirst();
    if (!trip) throw new Error('Поездка не найдена');

    // Get active user as the uploader
    const activeUserId = await getActiveUserId();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalName = file.name;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_');
    const fileName = `${Date.now()}_${baseName}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    // Determine fileType
    const fileType = ext.toLowerCase() === '.pdf' ? 'PDF' : 'IMG';

    // Create Document record
    const newDoc = await prisma.document.create({
      data: {
        tripId: trip.id,
        uploadedById: activeUserId,
        title: originalName.replace(ext, ''),
        fileName: fileName,
        fileType: fileType,
        fileUrl: `/uploads/${fileName}`,
        category: ['TICKETS', 'HOTELS', 'TRANSPORT', 'INSURANCE', 'OTHER'].includes(category) ? category : 'OTHER',
        size: file.size,
        isOfflineAvailable: true // Make offline by default
      },
      include: {
        uploadedBy: {
          select: {
            name: true
          }
        }
      }
    });

    revalidatePath('/documents');
    return newDoc;
  } catch (err) {
    console.error('Failed upload action:', err);
    throw err;
  }
}
