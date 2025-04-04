import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; restaurantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId, restaurantId } = params;

    // Check if the list exists and user has access
    const list = await prisma.restaurantList.findUnique({
      where: {
        id: listId,
      },
      include: {
        collaborators: true,
      },
    });

    if (!list) {
      return NextResponse.json({ message: 'List not found' }, { status: 404 });
    }

    const isOwner = list.ownerId === session.user.id;
    const isEditor = list.collaborators.some(
      (collaborator) => 
        collaborator.userId === session.user.id && 
        collaborator.role === 'editor'
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Check if the restaurant is in the list
    const listRestaurant = await prisma.listRestaurant.findUnique({
      where: {
        listId_restaurantId: {
          listId,
          restaurantId,
        },
      },
    });

    if (!listRestaurant) {
      return NextResponse.json(
        { message: 'Restaurant not in list' },
        { status: 404 }
      );
    }

    // Get restaurant name for activity log
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      select: {
        name: true,
      },
    });

    // Remove the restaurant from the list
    await prisma.listRestaurant.delete({
      where: {
        listId_restaurantId: {
          listId,
          restaurantId,
        },
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'remove_restaurant',
        content: `Removed ${restaurant?.name || 'a restaurant'} from ${list.title}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Restaurant removed from list' });
  } catch (error) {
    console.error('Error removing restaurant from list:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while removing the restaurant from the list' },
      { status: 500 }
    );
  }
}