import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get recent notes by the user
    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching recent notes:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while fetching recent notes' },
      { status: 500 }
    );
  }
}