import { NextResponse } from 'next/server';
import { fetchRedditPosts } from '@/lib/reddit';
import { savePosts } from '@/lib/storage';

// GET /api/fetch - Fetch posts from Reddit, deduplicate, and save
export async function GET() {
  try {
    // Fetch posts from Reddit
    const posts = await fetchRedditPosts();
    
    // Save to storage
    const storage = await savePosts(posts);
    
    return NextResponse.json({
      success: true,
      message: `Fetched and saved ${posts.length} posts`,
      data: storage,
    });
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
