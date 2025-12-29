import Parser from 'rss-parser';
import { RedditPost } from '@/types/reddit';

// Tech subreddits for popular content
const SUBREDDITS = [
  'technology',
  'programming', 
  'technews',
  'MachineLearning',
  'artificial',
  'netsec',
  'cybersecurity',
  'gadgets',
];

// RSS Feeds
const HACKERNEWS_FEED = 'https://hnrss.org/newest?points=200&count=30';
const TECHCRUNCH_FEED = 'https://techcrunch.com/feed/';
const WIRED_FEED = 'https://www.wired.com/feed/rss';
const GOOGLE_NEWS_TECH = 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB';

const POSTS_PER_SUBREDDIT = 15;
const TOTAL_TARGET = 30;
const MIN_REDDIT_SCORE = 50;
const MIN_REDDIT_COMMENTS = 10;

// Keywords to filter out (politics, crypto, non-tech)
const BLOCKED_KEYWORDS = [
  // Politics
  'trump', 'biden', 'democrat', 'republican', 'congress', 'senate', 'election',
  'politician', 'political', 'vote', 'voting', 'gop', 'liberal', 'conservative',
  'left-wing', 'right-wing', 'maga', 'woke', 'immigration', 'border',
  // Crypto/NFT
  'crypto', 'bitcoin', 'ethereum', 'nft', 'blockchain', 'dogecoin', 'shiba',
  'altcoin', 'defi', 'web3', 'hodl', 'memecoin', 'solana', 'binance',
  // Non-tech noise
  'kardashian', 'celebrity', 'gossip', 'dating', 'relationship', 'divorce',
  'wedding', 'baby', 'pregnant', 'horoscope', 'astrology',
];

function containsBlockedKeyword(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_KEYWORDS.some(keyword => lower.includes(keyword));
}

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

const parser: Parser = new Parser({
  customFields: {
    item: [
      ['content', 'content'],
      ['content:encoded', 'contentEncoded'],
      ['comments', 'comments'],
      ['source', 'sourceInfo'],
    ],
  },
});

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

function extractPostId(link: string): string {
  const match = link.match(/comments\/([a-z0-9]+)/i);
  return match ? match[1] : `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Check if a Reddit post is a self-post (discussion) vs link post
function isSelfPost(url: string, redditLink: string): boolean {
  return url.includes('reddit.com') || url.includes('redd.it') || url === redditLink;
}

// Extract the actual article URL from Reddit post content
function extractArticleUrl(item: Parser.Item, redditLink: string): string {
  const itemAny = item as Record<string, unknown>;
  
  // Method 1: Check if the item's link itself is external
  const directLink = String(item.link || '');
  if (directLink && !directLink.includes('reddit.com') && !directLink.includes('redd.it')) {
    return directLink;
  }
  
  // Method 2: Parse the content field for [link] href
  const content = String(
    itemAny.content || 
    itemAny.contentEncoded || 
    itemAny['content:encoded'] || 
    itemAny.description ||
    ''
  );
  
  if (content && content.length > 10) {
    // Pattern 1: [link] anchor tag
    const linkMatch = content.match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*\[link\]/i);
    if (linkMatch?.[1] && !linkMatch[1].includes('reddit.com')) {
      return linkMatch[1];
    }
    
    // Pattern 2: First external href
    const hrefMatches = content.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi);
    for (const match of hrefMatches) {
      const url = match[1];
      if (url && !url.includes('reddit.com') && !url.includes('redd.it')) {
        return url;
      }
    }
  }
  
  return redditLink;
}

// Fetch Reddit using JSON API with RSS fallback
async function fetchRedditSubreddit(subreddit: string): Promise<RedditPost[]> {
  // Try JSON API first
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const posts: RedditPost[] = [];
      
      for (const child of data.data.children) {
        if (posts.length >= POSTS_PER_SUBREDDIT) break;
        
        const post = child.data;
        
        // Skip self-posts, stickied posts, and low engagement
        if (post.is_self) continue;
        if (post.stickied) continue;
        if (post.score < MIN_REDDIT_SCORE) continue;
        if (post.num_comments < MIN_REDDIT_COMMENTS) continue;
        
        // Skip blocked keywords
        if (containsBlockedKeyword(post.title)) continue;
        
        // Skip reddit-internal URLs
        const postUrl = post.url || '';
        if (postUrl.includes('reddit.com') || postUrl.includes('redd.it')) continue;
        
        posts.push({
          id: post.id,
          title: post.title || 'Untitled',
          subreddit,
          score: post.score || 0,
          num_comments: post.num_comments || 0,
          url: postUrl,
          created_utc: post.created_utc || 0,
          permalink: `https://reddit.com${post.permalink}`,
          subredditRank: posts.length + 1,
          source: 'reddit' as const,
        });
      }
      
      if (posts.length > 0) {
        console.log(`Reddit JSON: Got ${posts.length} from r/${subreddit}`);
        return posts;
      }
    }
  } catch (error) {
    console.log(`Reddit JSON failed for r/${subreddit}, trying RSS...`);
  }
  
  // Fallback to RSS
  return fetchRedditSubredditRSS(subreddit);
}

// RSS fallback for Reddit
async function fetchRedditSubredditRSS(subreddit: string): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot/.rss`;
    const xml = await fetchWithHeaders(url);
    const feed = await parser.parseString(xml);

    const posts: RedditPost[] = [];
    
    for (let i = 0; i < feed.items.length && posts.length < POSTS_PER_SUBREDDIT; i++) {
      const item = feed.items[i];
      const redditLink = item.link || '';
      const articleUrl = extractArticleUrl(item, redditLink);
      
      // Skip self-posts
      if (isSelfPost(articleUrl, redditLink)) continue;
      
      // Skip blocked keywords
      if (containsBlockedKeyword(item.title || '')) continue;
      
      posts.push({
        id: extractPostId(redditLink),
        title: item.title || 'Untitled',
        subreddit,
        score: 100, // Assume decent score since it's on hot
        num_comments: 30,
        url: articleUrl,
        created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
        permalink: redditLink,
        subredditRank: posts.length + 1,
        source: 'reddit' as const,
      });
    }
    
    console.log(`Reddit RSS: Got ${posts.length} from r/${subreddit}`);
    return posts;
  } catch (error) {
    console.error(`Error fetching r/${subreddit} RSS:`, error);
    return [];
  }
}

async function fetchAllReddit(): Promise<RedditPost[]> {
  const allPosts = await Promise.all(
    SUBREDDITS.map(sub => fetchRedditSubreddit(sub))
  );
  return allPosts.flat();
}

// Fetch HackerNews
async function fetchHackerNews(): Promise<RedditPost[]> {
  try {
    const xml = await fetchWithHeaders(HACKERNEWS_FEED);
    const feed = await parser.parseString(xml);

    return feed.items
      .filter(item => !containsBlockedKeyword(item.title || ''))
      .slice(0, 25)
      .map((item, index) => {
        const link = item.link || '';
        const itemAny = item as Record<string, string>;
        const commentsUrl = itemAny.comments || '';
        const commentsMatch = commentsUrl.match(/item\?id=(\d+)/);
        const hnId = commentsMatch ? commentsMatch[1] : `hn-${Date.now()}-${index}`;

        return {
          id: `hn-${hnId}`,
          title: item.title || 'Untitled',
          subreddit: 'HackerNews',
          score: 200, // HN feed already filters by points
          num_comments: 50,
          url: link,
          created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
          permalink: commentsUrl || link,
          subredditRank: index + 1,
          source: 'hackernews' as const,
        };
      });
  } catch (error) {
    console.error('Error fetching HackerNews:', error);
    return [];
  }
}

// Fetch TechCrunch
async function fetchTechCrunch(): Promise<RedditPost[]> {
  try {
    const xml = await fetchWithHeaders(TECHCRUNCH_FEED);
    const feed = await parser.parseString(xml);
    
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    
    return feed.items
      .filter(item => {
        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;
        if (pubDate <= threeDaysAgo) return false;
        if (containsBlockedKeyword(item.title || '')) return false;
        return true;
      })
      .slice(0, 15)
      .map((item, index) => {
        const link = item.link || '';
        return {
          id: `tc-${link.split('/').pop() || index}`,
          title: item.title || 'Untitled',
          subreddit: 'TechCrunch',
          score: 100,
          num_comments: 30,
          url: link,
          created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
          permalink: link,
          subredditRank: index + 1,
          source: 'techcrunch' as const,
        };
      });
  } catch (error) {
    console.error('Error fetching TechCrunch:', error);
    return [];
  }
}

// Fetch Wired
async function fetchWired(): Promise<RedditPost[]> {
  try {
    const xml = await fetchWithHeaders(WIRED_FEED);
    const feed = await parser.parseString(xml);
    
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    
    return feed.items
      .filter(item => {
        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;
        if (pubDate <= fiveDaysAgo) return false;
        if (containsBlockedKeyword(item.title || '')) return false;
        return true;
      })
      .slice(0, 15)
      .map((item, index) => {
        const link = item.link || '';
        return {
          id: `wired-${link.split('/').pop() || index}`,
          title: item.title || 'Untitled',
          subreddit: 'Wired',
          score: 80,
          num_comments: 20,
          url: link,
          created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
          permalink: link,
          subredditRank: index + 1,
          source: 'wired' as const,
        };
      });
  } catch (error) {
    console.error('Error fetching Wired:', error);
    return [];
  }
}

// Fetch Google News Tech - trending tech stories
async function fetchGoogleNews(): Promise<RedditPost[]> {
  try {
    const xml = await fetchWithHeaders(GOOGLE_NEWS_TECH);
    const feed = await parser.parseString(xml);
    
    return feed.items
      .filter(item => !containsBlockedKeyword(item.title || ''))
      .slice(0, 20)
      .map((item, index) => {
        const link = item.link || '';
        const itemAny = item as Record<string, unknown>;
        
        // Google News wraps the actual URL, try to extract source
        let sourceUrl = link;
        const sourceInfo = itemAny.sourceInfo as { url?: string } | undefined;
        if (sourceInfo?.url) {
          sourceUrl = sourceInfo.url;
        }
        
        return {
          id: `gn-${Date.now()}-${index}`,
          title: item.title?.replace(/ - .*$/, '') || 'Untitled', // Remove source suffix
          subreddit: 'GoogleNews',
          score: 50,
          num_comments: 10,
          url: sourceUrl,
          created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
          permalink: link,
          subredditRank: index + 1,
          source: 'googlenews' as const,
        };
      });
  } catch (error) {
    console.error('Error fetching Google News:', error);
    return [];
  }
}

// Detect trending - posts appearing on multiple sources
function detectTrending(posts: RedditPost[]): RedditPost[] {
  const topicGroups: Map<string, RedditPost[]> = new Map();
  
  for (const post of posts) {
    let foundGroup = false;
    
    for (const [, group] of topicGroups) {
      if (areSameTopic(post.title, group[0].title)) {
        // Only count if from different source
        if (!group.some(p => p.source === post.source)) {
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

// Deduplicate posts
function deduplicatePosts(posts: RedditPost[]): RedditPost[] {
  const seen = new Map<string, RedditPost>();
  const seenUrls = new Set<string>();
  
  for (const post of posts) {
    // Skip if we've seen this exact URL
    if (seenUrls.has(post.url)) continue;
    
    // Skip if similar title exists
    let isDuplicate = false;
    for (const [existingNorm, existingPost] of seen) {
      if (areSameTopic(post.title, existingNorm)) {
        // Keep the trending one, or the one from a better source
        if (post.trending && !existingPost.trending) {
          seen.delete(existingNorm);
          seenUrls.delete(existingPost.url);
        } else {
          isDuplicate = true;
        }
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

// Main fetch function - ALWAYS returns exactly 30 posts with balanced sources
export async function fetchRedditPosts(): Promise<RedditPost[]> {
  console.log('Fetching from all sources...');
  
  // Fetch from all sources in parallel
  const [redditPosts, hnPosts, tcPosts, wiredPosts, gnPosts] = await Promise.all([
    fetchAllReddit(),
    fetchHackerNews(),
    fetchTechCrunch(),
    fetchWired(),
    fetchGoogleNews(),
  ]);
  
  console.log(`Fetched - Reddit: ${redditPosts.length}, HN: ${hnPosts.length}, TC: ${tcPosts.length}, Wired: ${wiredPosts.length}, GNews: ${gnPosts.length}`);
  
  // Sort each source by engagement
  const sortByEngagement = (posts: RedditPost[]) => 
    posts.sort((a, b) => (b.score + b.num_comments * 2) - (a.score + a.num_comments * 2));
  
  sortByEngagement(redditPosts);
  sortByEngagement(hnPosts);
  sortByEngagement(tcPosts);
  sortByEngagement(wiredPosts);
  sortByEngagement(gnPosts);
  
  // Take balanced amounts from each source (aim for ~6 each for 30 total)
  const balancedPosts: RedditPost[] = [
    ...redditPosts.slice(0, 8),
    ...hnPosts.slice(0, 8),
    ...tcPosts.slice(0, 6),
    ...wiredPosts.slice(0, 4),
    ...gnPosts.slice(0, 4),
  ];
  
  // Detect trending (appears on multiple sources)
  const withTrending = detectTrending(balancedPosts);
  
  // Sort by engagement score (score + comments * 2) and trending
  withTrending.sort((a, b) => {
    // Trending posts first
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    
    // Among trending, sort by how many sources
    if (a.trending && b.trending) {
      const countDiff = (b.trendingCount || 0) - (a.trendingCount || 0);
      if (countDiff !== 0) return countDiff;
    }
    
    // Then by engagement score (score + comments weighted)
    const engagementA = a.score + (a.num_comments * 2);
    const engagementB = b.score + (b.num_comments * 2);
    return engagementB - engagementA;
  });
  
  // Deduplicate
  const uniquePosts = deduplicatePosts(withTrending);
  
  console.log(`After dedup: ${uniquePosts.length} unique posts`);
  
  // If we don't have enough, add more from remaining posts
  let result = uniquePosts.slice(0, TOTAL_TARGET);
  
  if (result.length < TOTAL_TARGET) {
    // Add more from any source that has extras
    const usedIds = new Set(result.map(p => p.id));
    const allRemaining = [...redditPosts, ...hnPosts, ...tcPosts, ...wiredPosts, ...gnPosts]
      .filter(p => !usedIds.has(p.id) && !containsBlockedKeyword(p.title));
    
    sortByEngagement(allRemaining);
    
    for (const post of allRemaining) {
      if (result.length >= TOTAL_TARGET) break;
      // Check for duplicates by title
      const isDupe = result.some(p => areSameTopic(p.title, post.title));
      if (!isDupe) {
        result.push(post);
      }
    }
  }
  
  console.log(`Returning ${result.length} posts`);
  
  return result;
}
