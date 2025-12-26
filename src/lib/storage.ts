import { promises as fs } from 'fs';
import path from 'path';
import { PostsStorage, RedditPost } from '@/types/reddit';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const EXPIRY_DAYS = 4;

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Remove posts older than EXPIRY_DAYS
function cleanupOldPosts(posts: RedditPost[]): RedditPost[] {
  const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return posts.filter((post) => {
    const postDate = post.posted_at 
      ? new Date(post.posted_at).getTime() 
      : post.created_utc * 1000;
    return postDate > cutoff;
  });
}

// Check if storage itself is expired
function isStorageExpired(generatedAt: string): boolean {
  const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return new Date(generatedAt).getTime() < cutoff;
}

export async function readPosts(): Promise<PostsStorage> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(POSTS_FILE, 'utf-8');
    let storage = JSON.parse(data) as PostsStorage;
    
    if (!storage.posted) storage.posted = [];
    
    // Auto-cleanup: if storage is older than 4 days, reset everything
    if (isStorageExpired(storage.generated_at)) {
      storage = { generated_at: new Date().toISOString(), posts: [], posted: [] };
      await fs.writeFile(POSTS_FILE, JSON.stringify(storage, null, 2), 'utf-8');
      return storage;
    }
    
    // Clean up old posts from both lists
    const originalPostsCount = storage.posts.length;
    const originalPostedCount = storage.posted.length;
    
    storage.posts = cleanupOldPosts(storage.posts);
    storage.posted = cleanupOldPosts(storage.posted);
    
    // Save if anything was cleaned up
    if (storage.posts.length !== originalPostsCount || storage.posted.length !== originalPostedCount) {
      await fs.writeFile(POSTS_FILE, JSON.stringify(storage, null, 2), 'utf-8');
    }
    
    return storage;
  } catch {
    return { generated_at: new Date().toISOString(), posts: [], posted: [] };
  }
}

export async function savePosts(posts: RedditPost[]): Promise<PostsStorage> {
  await ensureDataDir();
  const existing = await readPosts();
  
  const storage: PostsStorage = {
    generated_at: new Date().toISOString(),
    posts: cleanupOldPosts(posts),
    posted: cleanupOldPosts(existing.posted),
  };
  
  await fs.writeFile(POSTS_FILE, JSON.stringify(storage, null, 2), 'utf-8');
  return storage;
}

export async function deletePost(postId: string): Promise<PostsStorage> {
  const storage = await readPosts();
  storage.posts = storage.posts.filter(post => post.id !== postId);
  await fs.writeFile(POSTS_FILE, JSON.stringify(storage, null, 2), 'utf-8');
  return storage;
}

export async function markAsPosted(postId: string): Promise<PostsStorage> {
  const storage = await readPosts();
  const postIndex = storage.posts.findIndex(p => p.id === postId);
  
  if (postIndex !== -1) {
    const post = storage.posts[postIndex];
    post.posted_at = new Date().toISOString();
    storage.posted.unshift(post);
    storage.posts.splice(postIndex, 1);
  }
  
  await fs.writeFile(POSTS_FILE, JSON.stringify(storage, null, 2), 'utf-8');
  return storage;
}

export async function clearPostedHistory(): Promise<PostsStorage> {
  const storage = await readPosts();
  storage.posted = [];
  await fs.writeFile(POSTS_FILE, JSON.stringify(storage, null, 2), 'utf-8');
  return storage;
}
