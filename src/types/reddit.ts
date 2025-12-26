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
  subredditRank?: number; // 1 = top post in that subreddit
}

export interface Stats {
  totalPosted: number;
  postedToday: number;
  postedThisWeek: number;
  bySubreddit: Record<string, number>;
}

export interface PostsStorage {
  generated_at: string;
  posts: RedditPost[];
  posted: RedditPost[];
}
