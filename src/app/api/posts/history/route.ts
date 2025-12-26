import { NextResponse } from 'next/server';
import { clearPostedHistory } from '@/lib/storage';

// DELETE /api/posts/history - Clear posted history
export async function DELETE() {
  try {
    const storage = await clearPostedHistory();
    return NextResponse.json({
      success: true,
      message: 'Posted history cleared',
      data: storage,
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
