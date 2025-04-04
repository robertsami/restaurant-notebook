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
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!['viewer', 'editor'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be "viewer" or "editor"' },
        { status: 400 }
      );
    }

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

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found. They need to sign up first.' },
        { status: 404 }
      );
    }

    // Check if the user is already a collaborator
    const existingCollaborator = await prisma.listCollaborator.findFirst({
      where: {
        listId,
        userId: user.id,
      },
    });

    if (existingCollaborator) {
      // Update the role if it's different
      if (existingCollaborator.role !== role) {
        await prisma.listCollaborator.update({
          where: {
            id: existingCollaborator.id,
          },
          data: {
            role,
          },
        });
      } else {
        return NextResponse.json(
          { message: 'User is already a collaborator with this role' },
          { status: 400 }
        );
      }
    } else {
      // Add the user as a collaborator
      await prisma.listCollaborator.create({
        data: {
          listId,
          userId: user.id,
          role,
        },
      });

      // Create activity record
      await prisma.activity.create({
        data: {
          type: 'add_collaborator',
          content: `Added ${user.name || user.email} as a ${role} to ${list.title}`,
          userId: session.user.id,
        },
      });

      // Create notification for the invited user
      await prisma.notification.create({
        data: {
          type: 'list_invitation',
          content: `You were invited to collaborate on "${list.title}" as a ${role}`,
          userId: user.id,
          metadata: {
            listId,
            inviterId: session.user.id,
          },
        },
      });
    }

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
    console.error('Error adding collaborator:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while adding the collaborator' },
      { status: 500 }
    );
  }
}