import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const restaurantId = params.id;

    // Get the restaurant with notes and lists
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      include: {
        notes: {
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        lists: {
          where: {
            list: {
              OR: [
                { ownerId: session.user.id },
                {
                  collaborators: {
                    some: {
                      userId: session.user.id,
                    },
                  },
                },
              ],
            },
          },
          include: {
            list: {
              include: {
                _count: {
                  select: {
                    restaurants: true,
                  },
                },
              },
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

    // Parse JSON fields and transform the data
    let tags: string[] = [];
    if (restaurant.tagsJson) {
      try {
        tags = JSON.parse(restaurant.tagsJson);
      } catch (e) {
        console.error('Error parsing restaurant tagsJson:', e);
      }
    }

    // Process notes to handle JSON fields
    const processedNotes = restaurant.notes.map(note => {
      // Parse photosJson if it exists
      let photos: string[] = [];
      if (note.photosJson) {
        try {
          photos = JSON.parse(note.photosJson);
        } catch (e) {
          console.error('Error parsing photosJson:', e);
        }
      }

      // Return the note with parsed photos
      return {
        ...note,
        photos,
      };
    });

    // Transform the data to flatten the structure
    const transformedRestaurant = {
      ...restaurant,
      tags,
      notes: processedNotes,
      lists: restaurant.lists.map((item) => ({
        ...item.list,
      })),
    };

    return NextResponse.json(transformedRestaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while fetching the restaurant' },
      { status: 500 }
    );
  }
}