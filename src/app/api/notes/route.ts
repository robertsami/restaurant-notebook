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

    const { restaurantId, listId, rating, content, visitDate, isPublic, photos } = await req.json();

    if (!restaurantId) {
      return NextResponse.json(
        { message: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    if (!rating && !content) {
      return NextResponse.json(
        { message: 'Rating or note content is required' },
        { status: 400 }
      );
    }

    // Check if the restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // If listId is provided, check if the list exists and user has access
    if (listId) {
      const list = await prisma.restaurantList.findUnique({
        where: {
          id: listId,
        },
        include: {
          collaborators: true,
        },
      });

      if (!list) {
        return NextResponse.json(
          { message: 'List not found' },
          { status: 404 }
        );
      }

      const isOwner = list.ownerId === session.user.id;
      const isEditor = list.collaborators.some(
        (collaborator) => 
          collaborator.userId === session.user.id && 
          collaborator.role === 'editor'
      );

      if (!isOwner && !isEditor) {
        return NextResponse.json(
          { message: 'Unauthorized to add notes to this list' },
          { status: 403 }
        );
      }
    }

    // Create the note with JSON fields
    const note = await prisma.note.create({
      data: {
        restaurantId,
        userId: session.user.id,
        listId,
        rating,
        content,
        visitDate: visitDate ? new Date(visitDate) : null,
        isPublic,
        photosJson: JSON.stringify(photos || []),
      },
    });

    // Update restaurant average rating
    const allRatings = await prisma.note.findMany({
      where: {
        restaurantId,
        rating: {
          not: null,
        },
      },
      select: {
        rating: true,
      },
    });

    if (allRatings.length > 0) {
      const sum = allRatings.reduce((acc, note) => acc + (note.rating || 0), 0);
      const average = sum / allRatings.length;

      await prisma.restaurant.update({
        where: {
          id: restaurantId,
        },
        data: {
          averageRating: average,
        },
      });
    }

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'add_note',
        content: `Added a note to ${restaurant.name}`,
        userId: session.user.id,
      },
    });

    // Return the note with photos parsed from JSON
    return NextResponse.json({
      ...note,
      photos: photos || [],
    });
  } catch (error) {
    console.error('Error creating note:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while creating the note' },
      { status: 500 }
    );
  }
}