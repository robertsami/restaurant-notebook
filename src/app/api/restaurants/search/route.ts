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
          // Search in tags via the RestaurantTag model
          {
            tags: {
              some: {
                name: {
                  contains: query.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      include: {
        tags: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    // Process restaurants to handle JSON fields
    const processedRestaurants = restaurants.map(restaurant => {
      // Parse tagsJson if it exists
      let tags: string[] = [];
      if (restaurant.tagsJson) {
        try {
          tags = JSON.parse(restaurant.tagsJson);
        } catch (e) {
          console.error('Error parsing tagsJson:', e);
          // Fallback to tags from the relation
          tags = restaurant.tags.map(tag => tag.name);
        }
      } else {
        // Use tags from the relation if tagsJson doesn't exist
        tags = restaurant.tags.map(tag => tag.name);
      }

      // Return the restaurant with parsed tags
      return {
        ...restaurant,
        tags,
      };
    });

    return NextResponse.json(processedRestaurants);
  } catch (error) {
    console.error('Error searching restaurants:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while searching for restaurants' },
      { status: 500 }
    );
  }
}