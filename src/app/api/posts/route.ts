import { NextResponse } from 'next/server';
import { readPosts } from '@/lib/storage';

// GET /api/posts - Read stored posts
export async function GET() {
  try {
    const storage = await readPosts();
    
    return NextResponse.json({
      success: true,
      data: storage,
    });
  } catch (error) {
    console.error('Error reading posts:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
