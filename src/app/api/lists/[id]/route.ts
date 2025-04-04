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

    const listId = params.id;

    // Get the list with restaurants and collaborators
    const list = await prisma.restaurantList.findUnique({
      where: {
        id: listId,
      },
      include: {
        restaurants: {
          include: {
            restaurant: {
              include: {
                _count: {
                  select: {
                    notes: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        collaborators: {
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
        },
        _count: {
          select: {
            restaurants: true,
            collaborators: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ message: 'List not found' }, { status: 404 });
    }

    // Check if user has access to the list
    const isOwner = list.ownerId === session.user.id;
    const isCollaborator = list.collaborators.some(
      (collaborator) => collaborator.userId === session.user.id
    );
    const isPublic = list.visibility === 'public';
    const isFriends = list.visibility === 'friends';

    if (!isOwner && !isCollaborator && !isPublic && !isFriends) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Transform the data to flatten the structure
    const transformedList = {
      ...list,
      restaurants: list.restaurants.map((item) => ({
        ...item.restaurant,
        order: item.order,
      })),
    };

    return NextResponse.json(transformedList);
  } catch (error) {
    console.error('Error fetching list:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while fetching the list' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const { title, description, visibility } = await req.json();

    // Check if the list exists and user is the owner
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

    if (list.ownerId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Update the list
    const updatedList = await prisma.restaurantList.update({
      where: {
        id: listId,
      },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        visibility: visibility !== undefined ? visibility : undefined,
      },
      include: {
        collaborators: {
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
        },
        _count: {
          select: {
            restaurants: true,
            collaborators: true,
          },
        },
      },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating list:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while updating the list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;

    // Check if the list exists and user is the owner
    const list = await prisma.restaurantList.findUnique({
      where: {
        id: listId,
      },
    });

    if (!list) {
      return NextResponse.json({ message: 'List not found' }, { status: 404 });
    }

    if (list.ownerId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Delete the list
    await prisma.restaurantList.delete({
      where: {
        id: listId,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'delete_list',
        content: `Deleted list: ${list.title}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while deleting the list' },
      { status: 500 }
    );
  }
}