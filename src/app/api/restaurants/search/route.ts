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

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { message: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search for restaurants by name or location
    const restaurants = await prisma.restaurant.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            location: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              has: query.toLowerCase(),
            },
          },
        ],
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('Error searching restaurants:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while searching for restaurants' },
      { status: 500 }
    );
  }
}