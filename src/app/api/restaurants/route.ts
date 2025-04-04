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
      include: {
        tags: true,
      },
    });

    if (existingRestaurant) {
      // Parse tags from JSON
      let parsedTags: string[] = [];
      if (existingRestaurant.tagsJson) {
        try {
          parsedTags = JSON.parse(existingRestaurant.tagsJson);
        } catch (e) {
          console.error('Error parsing tagsJson:', e);
          // Fallback to tags from the relation
          parsedTags = existingRestaurant.tags.map(tag => tag.name);
        }
      } else {
        // Use tags from the relation if tagsJson doesn't exist
        parsedTags = existingRestaurant.tags.map(tag => tag.name);
      }

      return NextResponse.json({
        ...existingRestaurant,
        tags: parsedTags,
      });
    }

    // Create a new restaurant with JSON tags
    const tagsArray = tags || [];
    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        location,
        tagsJson: JSON.stringify(tagsArray),
        createdBy: session.user.id,
        // Create tag relations
        tags: {
          create: tagsArray.map(tag => ({
            name: tag,
            isAiGenerated: false,
          })),
        },
      },
      include: {
        tags: true,
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

    // Return the restaurant with tags as an array
    return NextResponse.json({
      ...newRestaurant,
      tags: tagsArray,
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while creating the restaurant' },
      { status: 500 }
    );
  }
}