"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

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

    // Find Alina as the uploader
    const alina = await prisma.user.findFirst({ where: { name: 'Алина' } });
    if (!alina) throw new Error('Owner Alina not found');

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
    await prisma.document.create({
      data: {
        tripId: trip.id,
        uploadedById: alina.id,
        title: originalName.replace(ext, ''),
        fileName: fileName,
        fileType: fileType,
        fileUrl: `/uploads/${fileName}`,
        category: ['TICKETS', 'HOTELS', 'TRANSPORT', 'INSURANCE', 'OTHER'].includes(category) ? category : 'OTHER',
        size: file.size,
        isOfflineAvailable: true // Make offline by default
      }
    });

    revalidatePath('/documents');
  } catch (err) {
    console.error('Failed upload action:', err);
    throw err;
  }
}
