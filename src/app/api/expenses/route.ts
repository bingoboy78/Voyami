import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Add new expense
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, category, description, paidById, participantIds, tripId } = body;

    if (!amount || !category || !description || !paidById || !participantIds || !participantIds.length || !tripId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const floatAmount = parseFloat(amount);
    const shareAmount = floatAmount / participantIds.length;

    // Create expense and participants in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          tripId,
          paidById,
          amount: floatAmount,
          category,
          description,
        },
      });

      // Create ExpenseParticipant records
      await Promise.all(
        participantIds.map((userId: string) =>
          tx.expenseParticipant.create({
            data: {
              expenseId: exp.id,
              userId,
              share: shareAmount,
            },
          })
        )
      );

      return exp;
    });

    return NextResponse.json({ expense });
  } catch (error: any) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove expense
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
