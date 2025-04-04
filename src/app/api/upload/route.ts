import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToFirebase } from '@/lib/firebase';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('photos') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      // Check file type
      if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
        return NextResponse.json(
          { message: 'Only JPEG and PNG images are allowed' },
          { status: 400 }
        );
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: 'Images must be less than 5MB' },
          { status: 400 }
        );
      }
    }

    // Upload files to Firebase Storage
    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
      return uploadToFirebase(buffer, fileName, file.type);
    });

    const urls = await Promise.all(uploadPromises);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error uploading files:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { message: 'An error occurred while uploading files' },
      { status: 500 }
    );
  }
}