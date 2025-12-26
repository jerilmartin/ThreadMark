import Parser from 'rss-parser';
import { RedditPost } from '@/types/reddit';

// 9 tech subreddits
const RSS_FEEDS = [
  'https://www.reddit.com/r/technology/top/.rss?t=day',
  'https://www.reddit.com/r/programming/top/.rss?t=day',
  'https://www.reddit.com/r/technews/top/.rss?t=day',
  'https://www.reddit.com/r/MachineLearning/top/.rss?t=day',
  'https://www.reddit.com/r/artificial/top/.rss?t=day',
  'https://www.reddit.com/r/netsec/top/.rss?t=day',
  'https://www.reddit.com/r/futurology/top/.rss?t=day',
  'https://www.reddit.com/r/cybersecurity/top/.rss?t=day',
  'https://www.reddit.com/r/gadgets/top/.rss?t=day',
];

const POSTS_PER_SUBREDDIT = 6; // Fetch 6 to ensure 25 after dedup
const TARGET_POSTS = 25;

async function fetchWithHeaders(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  if (!response.ok) throw new Error(`Status code ${response.status}`);
  return response.text();
}

const parser = new Parser();

function normalizeForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 8)
    .sort()
    .join(' ');
}

function areSameTopic(title1: string, title2: string): boolean {
  const norm1 = normalizeForComparison(title1);
  const norm2 = normalizeForComparison(title2);
  
  if (norm1 === norm2) return true;
  
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  
  let matches = 0;
  words1.forEach(word => { if (words2.has(word)) matches++; });
  
  const minSize = Math.min(words1.size, words2.size);
  return minSize > 0 && matches / minSize >= 0.6;
}

function getSubredditFromUrl(feedUrl: string): string {
  const match = feedUrl.match(/\/r\/([^/]+)\//);
  return match ? match[1] : 'unknown';
}

function extractPostId(link: string): string {
  const match = link.match(/comments\/([a-z0-9]+)/i);
  return match ? match[1] : link;
}


async function fetchFeed(feedUrl: string): Promise<RedditPost[]> {
  try {
    const subreddit = getSubredditFromUrl(feedUrl);
    const xml = await fetchWithHeaders(feedUrl);
    const feed = await parser.parseString(xml);

    const topItems = feed.items.slice(0, POSTS_PER_SUBREDDIT);

    return topItems.map((item, index) => ({
      id: extractPostId(item.link || ''),
      title: item.title || 'Untitled',
      subreddit,
      score: 0,
      num_comments: 0,
      url: item.link || '',
      created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
      permalink: item.link || '',
      subredditRank: index + 1,
    }));
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error);
    return [];
  }
}

function detectTrending(posts: RedditPost[]): RedditPost[] {
  const topicGroups: Map<string, RedditPost[]> = new Map();
  
  for (const post of posts) {
    let foundGroup = false;
    
    for (const [, group] of topicGroups) {
      if (areSameTopic(post.title, group[0].title)) {
        if (!group.some(p => p.subreddit === post.subreddit)) {
          group.push(post);
        }
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      topicGroups.set(normalizeForComparison(post.title), [post]);
    }
  }
  
  const trendingTopics = new Map<string, number>();
  
  for (const [key, group] of topicGroups) {
    if (group.length >= 2) {
      trendingTopics.set(key, group.length);
    }
  }
  
  return posts.map(post => {
    for (const [key, count] of trendingTopics) {
      if (areSameTopic(post.title, key)) {
        return { ...post, trending: true, trendingCount: count };
      }
    }
    return post;
  });
}


function deduplicatePosts(posts: RedditPost[]): RedditPost[] {
  const seen = new Map<string, RedditPost>();
  const seenUrls = new Set<string>();
  
  const sorted = [...posts].sort((a, b) => {
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    return (a.subredditRank || 99) - (b.subredditRank || 99);
  });
  
  for (const post of sorted) {
    if (seenUrls.has(post.url)) continue;
    
    let isDuplicate = false;
    for (const [existingNorm] of seen) {
      if (areSameTopic(post.title, existingNorm)) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.set(normalizeForComparison(post.title), post);
      seenUrls.add(post.url);
    }
  }
  
  return Array.from(seen.values());
}

// Ensure we always return TARGET_POSTS by fetching more if needed
export async function fetchRedditPosts(): Promise<RedditPost[]> {
  // Fetch from all subreddits
  const allPostsArrays = await Promise.all(RSS_FEEDS.map(fetchFeed));
  const allPosts = allPostsArrays.flat();
  
  // Detect trending
  const withTrending = detectTrending(allPosts);
  
  // Deduplicate
  let uniquePosts = deduplicatePosts(withTrending);
  
  // Sort: trending first, then by subreddit rank, then by recency
  uniquePosts.sort((a, b) => {
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    // Prefer higher ranked posts within subreddit
    const rankDiff = (a.subredditRank || 99) - (b.subredditRank || 99);
    if (rankDiff !== 0) return rankDiff;
    return b.created_utc - a.created_utc;
  });
  
  // Always return exactly TARGET_POSTS (or all if less available)
  return uniquePosts.slice(0, TARGET_POSTS);
}
