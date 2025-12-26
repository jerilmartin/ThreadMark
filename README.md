# ThreadMark

A content discovery dashboard that aggregates the best tech posts from Reddit, HackerNews, and TechCrunch.

## Features

- **Multi-source aggregation**: Reddit + HackerNews + TechCrunch = 25 top posts
- **Trending detection**: Highlights stories appearing across multiple sources
- **No API keys required**: Uses public RSS feeds
- **Track what you've shared**: Mark posts as done and view history
- **Auto-cleanup**: Posts expire after 4 days
- **Stats dashboard**: See your activity by source and topic

## Sources

**Reddit (8 subreddits, top/week for quality):**
- r/technology, r/programming, r/technews
- r/MachineLearning, r/artificial
- r/netsec, r/cybersecurity
- r/gadgets

**HackerNews:**
- Stories with 150+ points

**TechCrunch:**
- Latest tech news and startup coverage (last 3 days)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

```bash
vercel
```

No environment variables needed.
