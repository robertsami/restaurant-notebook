import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { summarizeText } from '@/lib/openai';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { message: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return NextResponse.json(
        { message: 'Text is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const summary = await summarizeText(text);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error summarizing text:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while summarizing the text' },
      { status: 500 }
    );
  }
}