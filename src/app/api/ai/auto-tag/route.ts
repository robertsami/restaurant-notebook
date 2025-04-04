import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateTags } from '@/lib/openai';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = await req.json();

    if (!restaurantId) {
      return NextResponse.json(
        { message: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Get the restaurant with notes
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      include: {
        notes: {
          select: {
            content: true,
          },
          where: {
            content: {
              not: null,
            },
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Combine all note content
    const noteTexts = restaurant.notes.map((note) => note.content).filter(Boolean);
    
    // Generate tags based on restaurant name, location, and notes
    const tags = await generateTags(restaurant.name, restaurant.location, noteTexts);

    // Update the restaurant with the new tags
    await prisma.restaurant.update({
      where: {
        id: restaurantId,
      },
      data: {
        tags,
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error auto-tagging restaurant:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while auto-tagging the restaurant' },
      { status: 500 }
    );
  }
}