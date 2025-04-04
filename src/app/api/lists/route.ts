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

    // Get all lists owned by the user
    const lists = await prisma.restaurantList.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while fetching lists' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, visibility = 'private' } = await req.json();

    // Validate input
    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    // Create new list
    const list = await prisma.restaurantList.create({
      data: {
        title,
        description,
        visibility,
        ownerId: session.user.id,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'create_list',
        content: `Created a new list: ${title}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while creating the list' },
      { status: 500 }
    );
  }
}