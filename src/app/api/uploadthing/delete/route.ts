// app/api/uploadthing/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can delete files
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can delete files' }, { status: 403 });
    }

    const body = await request.json();
    const { fileKeys } = body;

    if (!fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
      return NextResponse.json({ error: 'No file keys provided' }, { status: 400 });
    }

    console.log('🗑️ Deleting files from UploadThing:', fileKeys);

    // Delete files from UploadThing
    await utapi.deleteFiles(fileKeys);

    console.log('✅ Files deleted successfully');

    return NextResponse.json({ 
      success: true, 
      deletedCount: fileKeys.length 
    });

  } catch (error: any) {
    console.error('❌ Error deleting files:', error);
    return NextResponse.json({ 
      error: 'Failed to delete files',
      message: error.message 
    }, { status: 500 });
  }
}