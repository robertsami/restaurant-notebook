import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const { restaurantId } = await req.json();

    if (!restaurantId) {
      return NextResponse.json(
        { message: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

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

    // Check if the restaurant is already in the list
    const existingListRestaurant = await prisma.listRestaurant.findUnique({
      where: {
        listId_restaurantId: {
          listId,
          restaurantId,
        },
      },
    });

    if (existingListRestaurant) {
      return NextResponse.json(
        { message: 'Restaurant already in list' },
        { status: 400 }
      );
    }

    // Get the highest order in the list
    const highestOrder = await prisma.listRestaurant.findFirst({
      where: {
        listId,
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    const newOrder = highestOrder ? highestOrder.order + 1 : 0;

    // Add the restaurant to the list
    await prisma.listRestaurant.create({
      data: {
        listId,
        restaurantId,
        order: newOrder,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'add_restaurant',
        content: `Added ${restaurant.name} to ${list.title}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error adding restaurant to list:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while adding the restaurant to the list' },
      { status: 500 }
    );
  }
}