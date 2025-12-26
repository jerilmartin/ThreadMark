'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RedditPost, PostsStorage, Stats } from '@/types/reddit';

type Tab = 'pending' | 'history' | 'stats';

export default function Dashboard() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [posted, setPosted] = useState<RedditPost[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const stats: Stats = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const bySubreddit: Record<string, number> = {};
    let postedToday = 0;
    let postedThisWeek = 0;

    posted.forEach((post) => {
      const postedTime = post.posted_at ? new Date(post.posted_at).getTime() : 0;
      if (postedTime > oneDayAgo) postedToday++;
      if (postedTime > oneWeekAgo) postedThisWeek++;
      bySubreddit[post.subreddit] = (bySubreddit[post.subreddit] || 0) + 1;
    });

    return { totalPosted: posted.length, postedToday, postedThisWeek, bySubreddit };
  }, [posted]);

  const updateFromStorage = (storage: PostsStorage) => {
    setPosts(storage.posts);
    setPosted(storage.posted || []);
    setGeneratedAt(storage.generated_at);
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/posts');
      const json = await res.json();
      if (json.success) updateFromStorage(json.data);
      else setError(json.error);
    } catch {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNewPosts = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/fetch');
      const json = await res.json();
      if (json.success) {
        updateFromStorage(json.data);
        setActiveTab('pending');
      } else setError(json.error);
    } catch {
      setError('Failed to fetch');
    } finally {
      setFetching(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) updateFromStorage(json.data);
    } catch {
      setError('Failed to delete');
    }
  };

  const markAsPosted = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/posted`, { method: 'POST' });
      const json = await res.json();
      if (json.success) updateFromStorage(json.data);
    } catch {
      setError('Failed to mark');
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all history?')) return;
    try {
      const res = await fetch('/api/posts/history', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) setPosted([]);
    } catch {
      setError('Failed to clear');
    }
  };

  const copy = async (text: string, id: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  useEffect(() => { loadPosts(); }, [loadPosts]);


  const subredditColors: Record<string, string> = {
    technology: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    programming: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    technews: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    MachineLearning: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    artificial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    netsec: 'bg-red-500/10 text-red-400 border-red-500/20',
    futurology: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    cybersecurity: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    gadgets: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  const getSubredditStyle = (sub: string) => subredditColors[sub] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  const PostCard = ({ post, isHistory = false }: { post: RedditPost; isHistory?: boolean }) => (
    <article className={`bg-white dark:bg-gray-900 border rounded-lg p-5 hover:shadow-md transition-shadow ${
      post.trending 
        ? 'border-orange-300 dark:border-orange-500/50 ring-1 ring-orange-200 dark:ring-orange-500/20' 
        : 'border-gray-200 dark:border-gray-800'
    }`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.trending && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded">
                TRENDING · {post.trendingCount} subs
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSubredditStyle(post.subreddit)}`}>
              {post.subreddit}
            </span>
            <span className="text-xs text-gray-400">{timeAgo(post.created_utc)} ago</span>
          </div>
          
          <h3 className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed mb-4">
            {post.title}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => copy(`${post.title}\n\n${post.url}`, post.id, 'all')}
              className="px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity"
            >
              {copiedId === `${post.id}-all` ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => copy(post.title, post.id, 'title')}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {copiedId === `${post.id}-title` ? 'Copied' : 'Title'}
            </button>
            <button
              onClick={() => copy(post.url, post.id, 'link')}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {copiedId === `${post.id}-link` ? 'Copied' : 'Link'}
            </button>
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Open ↗
            </a>
            {!isHistory && (
              <>
                <button
                  onClick={() => markAsPosted(post.id)}
                  className="px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ThreadMark</h1>
              <p className="text-sm text-gray-500 mt-0.5">Tech content discovery</p>
            </div>
            <button
              onClick={fetchNewPosts}
              disabled={fetching}
              className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {fetching ? 'Fetching...' : 'Fetch Posts'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Navigation */}
        <nav className="flex items-center gap-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          {[
            { id: 'pending', label: 'Pending', count: posts.length },
            { id: 'history', label: 'History', count: posted.length },
            { id: 'stats', label: 'Stats', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 text-xs text-gray-400">{tab.count}</span>
              )}
            </button>
          ))}
          
          <div className="ml-auto pb-3">
            <button
              onClick={loadPosts}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </nav>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}


        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : activeTab === 'stats' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total', value: stats.totalPosted },
                { label: 'Today', value: stats.postedToday },
                { label: 'This Week', value: stats.postedThisWeek },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {Object.keys(stats.bySubreddit).length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">By Subreddit</h3>
                <div className="space-y-3">
                  {Object.entries(stats.bySubreddit)
                    .sort(([, a], [, b]) => b - a)
                    .map(([sub, count]) => (
                      <div key={sub} className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-28">{sub}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-gray-900 dark:bg-white h-full rounded-full transition-all"
                            style={{ width: `${(count / stats.totalPosted) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {stats.totalPosted === 0 && (
              <div className="text-center py-16 text-gray-500">
                No activity yet
              </div>
            )}
          </div>
        ) : activeTab === 'pending' ? (
          posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">No posts available</p>
              <button
                onClick={fetchNewPosts}
                className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
              >
                Fetch Posts
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post, i) => (
                <PostCard key={`${post.id}-${i}`} post={post} />
              ))}
            </div>
          )
        ) : posted.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No history yet
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={clearHistory} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
                Clear history
              </button>
            </div>
            <div className="space-y-3">
              {posted.map((post, i) => (
                <PostCard key={`${post.id}-${i}`} post={post} isHistory />
              ))}
            </div>
          </div>
        )}

        {generatedAt && (
          <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
            Last updated {timeAgo(new Date(generatedAt).getTime() / 1000)} ago · 9 subreddits · Auto-expires in 4 days
          </footer>
        )}
      </main>
    </div>
  );
}
