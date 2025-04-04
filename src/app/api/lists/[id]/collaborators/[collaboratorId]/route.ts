import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; collaboratorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId, collaboratorId } = params;

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

    // Check if the collaborator exists
    const collaborator = await prisma.listCollaborator.findUnique({
      where: {
        id: collaboratorId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { message: 'Collaborator not found' },
        { status: 404 }
      );
    }

    // Remove the collaborator
    await prisma.listCollaborator.delete({
      where: {
        id: collaboratorId,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'remove_collaborator',
        content: `Removed ${collaborator.user.name || collaborator.user.email} from ${list.title}`,
        userId: session.user.id,
      },
    });

    // Create notification for the removed user
    await prisma.notification.create({
      data: {
        type: 'list_removal',
        content: `You were removed from "${list.title}"`,
        userId: collaborator.userId,
        metadata: {
          listId,
          removerId: session.user.id,
        },
      },
    });

    // Return the updated list with collaborators
    const updatedList = await prisma.restaurantList.findUnique({
      where: {
        id: listId,
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
    console.error('Error removing collaborator:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while removing the collaborator' },
      { status: 500 }
    );
  }
}