import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, location, tags } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    // Normalize the name and location for deduplication
    const normalizedName = name.trim().toLowerCase();
    const normalizedLocation = location ? location.trim().toLowerCase() : null;

    // Check if a similar restaurant already exists
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        AND: [
          {
            name: {
              contains: normalizedName,
              mode: 'insensitive',
            },
          },
          normalizedLocation
            ? {
                location: {
                  contains: normalizedLocation,
                  mode: 'insensitive',
                },
              }
            : {},
        ],
      },
    });

    if (existingRestaurant) {
      return NextResponse.json(existingRestaurant);
    }

    // Create a new restaurant
    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        location,
        tags: tags || [],
        createdBy: session.user.id,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'create_restaurant',
        content: `Created restaurant: ${name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while creating the restaurant' },
      { status: 500 }
    );
  }
}