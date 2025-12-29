import { NextRequest, NextResponse } from 'next/server';
import { generateQuickTweets, QuickTweetCategory } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { category = 'random' } = await request.json();

    console.log('Generating quick tweets for category:', category);

    const tweets = await generateQuickTweets(category as QuickTweetCategory);

    return NextResponse.json({ success: true, data: { tweets } });
  } catch (error) {
    console.error('Quick tweet generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate' }, { status: 500 });
  }
}
