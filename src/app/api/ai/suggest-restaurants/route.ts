import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { suggestSimilarRestaurants } from '@/lib/openai';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantName, location, tags } = await req.json();

    if (!restaurantName) {
      return NextResponse.json(
        { message: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    const suggestions = await suggestSimilarRestaurants(restaurantName, location, tags);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting restaurants:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while suggesting restaurants' },
      { status: 500 }
    );
  }
}