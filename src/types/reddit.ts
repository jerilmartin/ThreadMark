export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
  permalink: string;
  posted_at?: string;
  trending?: boolean;
  trendingCount?: number;
  subredditRank?: number;
  source: 'reddit' | 'hackernews' | 'techcrunch'; // Track source
}

export interface Stats {
  totalPosted: number;
  postedToday: number;
  postedThisWeek: number;
  bySubreddit: Record<string, number>;
  bySource: Record<string, number>; // Track by source
}

export interface PostsStorage {
  generated_at: string;
  posts: RedditPost[];
  posted: RedditPost[];
}
