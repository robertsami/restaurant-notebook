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

    // Get recent notes (both user's own notes and public notes from others)
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            location: true,
            tagsJson: true,
            averageRating: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    // Process notes to handle JSON fields
    const processedNotes = notes.map(note => {
      // Parse photosJson if it exists
      let photos: string[] = [];
      if (note.photosJson) {
        try {
          photos = JSON.parse(note.photosJson);
        } catch (e) {
          console.error('Error parsing photosJson:', e);
        }
      }

      // Parse restaurant tags if they exist
      let restaurantTags: string[] = [];
      if (note.restaurant.tagsJson) {
        try {
          restaurantTags = JSON.parse(note.restaurant.tagsJson);
        } catch (e) {
          console.error('Error parsing restaurant tagsJson:', e);
        }
      }

      // Return the note with parsed fields
      return {
        ...note,
        photos,
        restaurant: {
          ...note.restaurant,
          tags: restaurantTags,
        },
      };
    });

    return NextResponse.json(processedNotes);
  } catch (error) {
    console.error('Error fetching recent notes:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while fetching recent notes' },
      { status: 500 }
    );
  }
}