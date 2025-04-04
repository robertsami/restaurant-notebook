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

    // Get recent activity for the user
    const activity = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while fetching activity' },
      { status: 500 }
    );
  }
}