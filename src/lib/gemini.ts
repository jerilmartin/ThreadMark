import { GoogleGenerativeAI } from '@google/generative-ai';

export type TweetTone = 'hottake' | 'analytical' | 'sarcastic' | 'unhinged';

export interface GeneratedTweet {
  text: string;
  tone: TweetTone;
  characterCount: number;
}

export async function generateTweet(
  title: string,
  tone: TweetTone = 'hottake',
  articleSummary: string | null = null,
  companyContext: string | null = null
): Promise<GeneratedTweet[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: tone === 'unhinged' ? 1.2 : tone === 'sarcastic' ? 1.0 : 0.8,
    }
  });

  let context = `NEWS: "${title}"`;
  if (articleSummary) {
    context += `\n\nARTICLE: ${articleSummary.substring(0, 400)}`;
  }
  if (companyContext) {
    context += `\n\nBACKGROUND: ${companyContext}`;
  }

  const tonePrompts: Record<TweetTone, string> = {
    hottake: `Write like a tech veteran giving a blunt reality check. 
STYLE:
- Lowercase (mostly)
- Short, punchy sentences
- No filler words
- Brutally honest
- NOT trying to be funny, just right

BAD EXAMPLES (Don't do this):
- "Let's talk about..."
- "So, X just happened..."
- "Big news!"
- "[Company] is shaking things up"

GOOD EXAMPLES:
- "everyone acting surprised like this wasn't obvious 6 months ago"
- "cool feature but nobody asked for this"
- "solving a problem that doesn't exist"
- "10 years later and we're still doing this"
`,

    analytical: `Write like a senior principal engineer in a private group chat.
STYLE:
- Lowercase
- Technical and precise
- Cynical but insightful
- Focus on the *why* or the *money/incentives*
- No corporate buzzwords

BAD EXAMPLES (Don't do this):
- "This represents a paradigm shift..."
- "Leveraging AI for..."
- "In the current landscape..."

GOOD EXAMPLES:
- "this is just an acqui-hire with better pr"
- "optimization for metrics vs actual utility"
- "the unit economics on this don't make sense"
- "cleaning up the tech debt from the 2021 pivot"
`,

    sarcastic: `Write like you are exhausted by the tech industry hype cycle.
STYLE:
- Dry, deadpan
- No "lol" or "lmao"
- No exclamation points!
- Specificity > broad jokes

BAD EXAMPLES (Don't do this):
- "Oh great! Another AI app!" (Too generic)
- "Whatever shall we do?" (Too theatrical)
- "/s" (Never use this)

GOOD EXAMPLES:
- "revolutionary new feature called 'copy paste'"
- "can't wait to pay $20/month for this"
- "bold strategy to alienate the only users they have left"
- "finally, a solution for the 3 people who wanted this"
`,

    unhinged: `Write like a chaotic internet native.
STYLE:
- Lowercase
- Stream of consciousness
- Specific, weird details
- Can be slightly nonsensical
- Referenced niche tech culture

BAD EXAMPLES (Don't do this):
- "I'm screaming!"
- "Omg"
- "Literally me"

GOOD EXAMPLES:
- "my sleep paralysis demon coded this"
- "i would trust this company with a ham sandwich let alone my data"
- "visualizing the pm meeting where this was decided"
- "putting this in the folder with the metaverse and nft pets"
`,
  };

  const prompt = `${context}

${tonePrompts[tone]}

TASK: Write 3 tweets about this news.
CONSTRAINTS:
- ABSOLUTELY NO HASHTAGS (#)
- ABSOLUTELY NO EMOJIS (unless specific to 'unhinged' vibe)
- No questions at the start
- No "engagement bait"
- Keep it under 200 characters

Return only JSON:
{"tweets":[{"text":"..."},{"text":"..."},{"text":"..."}]}`;

  try {
    console.log('Gemini - Calling with tone:', tone);
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    let clean = response.trim();
    if (clean.includes('```')) {
      clean = clean.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    }
    
    const parsed = JSON.parse(clean);
    
    if (!parsed.tweets?.length) {
      throw new Error('No tweets in response');
    }
    
    return parsed.tweets.slice(0, 3).map((t: { text: string }) => ({
      text: t.text || '',
      tone,
      characterCount: (t.text || '').length,
    })).filter((t: GeneratedTweet) => t.text.length > 0);
  } catch (error) {
    console.error('Gemini error:', error instanceof Error ? error.message : error);
    return generateFallbackTweets(title, tone);
  }
}

function generateFallbackTweets(_title: string, tone: TweetTone): GeneratedTweet[] {
  const fallbacks: Record<TweetTone, string[]> = {
    hottake: [
      `everyone acting surprised like this wasn't obvious months ago`,
      `solving a problem that honestly doesn't exist`,
      `10 years later and we're still doing this loop`,
    ],
    analytical: [
      `this is just an acqui-hire with better pr`,
      `optimization for metrics vs actual utility`,
      `the unit economics on this don't make sense`,
    ],
    sarcastic: [
      `revolutionary new feature called 'copy paste'`,
      `can't wait to pay monthly for something that was free`,
      `bold strategy to alienate the only users they have left`,
    ],
    unhinged: [
      `my sleep paralysis demon coded this`,
      `visualizing the pm meeting where this was decided`,
      `putting this in the folder with the metaverse`,
    ],
  };

  return fallbacks[tone].map((text) => ({
    text,
    tone,
    characterCount: text.length,
  }));
}

// Thread generation - creates a 3-5 tweet thread
export interface GeneratedThread {
  tweets: string[];
  tone: TweetTone;
}

export async function generateThread(
  title: string,
  tone: TweetTone = 'analytical',
  articleSummary: string | null = null
): Promise<GeneratedThread> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.8 }
  });

  let context = `NEWS: "${title}"`;
  if (articleSummary) {
    context += `\n\nARTICLE DETAILS:\n${articleSummary.substring(0, 800)}`;
  }

  const prompt = `${context}

TASK: Write a Twitter/X THREAD (4 tweets) about this.
VIBE: Knowledgeable, concise, low-ego. Like a knowledgeable friend explaining something cool.

STRUCTURE:
1. The Hook: Just the facts or the most interesting part. NO clickbait questions.
2. The Context: Why it matters now.
3. The Detail: A specific interesting nuance.
4. The Takeaway: A forward-looking statement.

CONSTRAINTS:
- Lowercase styling preferred
- NO emojis
- NO hashtags
- NO "Thread 🧵" or "1/4" markers
- Max 250 chars per tweet

Return JSON only:
{"thread":["tweet 1","tweet 2","tweet 3","tweet 4"]}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    let clean = response.trim();
    if (clean.includes('```')) {
      clean = clean.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    }
    
    const parsed = JSON.parse(clean);
    
    if (!parsed.thread?.length) {
      throw new Error('No thread in response');
    }
    
    return {
      tweets: parsed.thread.slice(0, 5),
      tone,
    };
  } catch (error) {
    console.error('Thread generation error:', error);
    return {
      tweets: [
        `${title}`,
        `context on why this matters right now.`,
        `interesting detail that most people miss.`,
        `where this goes from here.`,
      ],
      tone,
    };
  }
}

// Quick Tweet categories for standalone engagement tweets
export type QuickTweetCategory = 'uncomfortable' | 'reflective' | 'debate' | 'punchy' | 'personal' | 'random';

export interface QuickTweet {
  text: string;
  category: QuickTweetCategory;
}

export async function generateQuickTweets(category: QuickTweetCategory = 'random'): Promise<QuickTweet[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return getQuickTweetFallbacks(category);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 1.1 }
  });

  const categoryPrompts: Record<QuickTweetCategory, string> = {
    uncomfortable: `PROMPT: spicy tech questions that hurt feelings.
STYLE: lowercase, direct.
EXAMPLES:
- "post your screen time"
- "show me a senior dev who actually likes scrum"
- "name a framework that died and you're glad"`,

    reflective: `PROMPT: thoughtful questions for devs.
STYLE: chill, genuine.
EXAMPLES:
- "what did you learn this year that actually mattered"
- "hardest thing you shipped recently"
- "who helped you the most in your career"`,

    debate: `PROMPT: subtle divisive topics.
STYLE: short, binary choices.
EXAMPLES:
- "remote or hybrid given the choice"
- "startup equity or big tech salary"
- "generalist or specialist in 2025"`,

    punchy: `PROMPT: super short questions.
STYLE: under 60 chars.
EXAMPLES:
- "fav vs code theme"
- "mac or linux be honest"
- "best tech podcast?"`,

    personal: `PROMPT: authentic career questions.
STYLE: vulnerable but professional.
EXAMPLES:
- "moment you felt like a senior dev"
- "biggest mistake you made in prod"
- "why did you start coding"`,

    random: `PROMPT: mix of chaotic and interesting tech questions.`,
  };

  const prompt = `Generate 5 short tech engagement tweets.
CATEGORY: ${category}
${categoryPrompts[category]}

RULES:
- STRICTLY LOWERCASE ONLY
- NO HASHTAGS
- NO EMOJIS
- NO "Question:" PREFACE
- Sound like a person, not a brand account
- Under 100 characters

Return JSON only:
{"tweets":["tweet 1","tweet 2","tweet 3","tweet 4","tweet 5"]}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    let clean = response.trim();
    if (clean.includes('```')) {
      clean = clean.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    }
    
    const parsed = JSON.parse(clean);
    
    if (!parsed.tweets?.length) {
      throw new Error('No tweets in response');
    }
    
    return parsed.tweets.slice(0, 5).map((text: string) => ({
      text,
      category,
    }));
  } catch (error) {
    console.error('Quick tweet generation error:', error);
    return getQuickTweetFallbacks(category);
  }
}

function getQuickTweetFallbacks(category: QuickTweetCategory): QuickTweet[] {
  const fallbacks: Record<QuickTweetCategory, string[]> = {
    uncomfortable: [
      "post your screen time",
      "name a framework that deserves to die",
      "show me a senior dev who likes jira",
      "what code are you ashamed of",
      "who is the most overrated tech ceo",
    ],
    reflective: [
      "what did you learn this year that mattered",
      "hardest thing you shipped recently",
      "who helped you most in your career",
      "what advice was actually useful",
      "what skill is keeping you employed",
    ],
    debate: [
      "remote or hybrid given the choice",
      "startup equity or big tech salary",
      "typescript: yes or no",
      "manager path or ic path",
      "bootstrap or vc funding",
    ],
    punchy: [
      "fav vs code theme",
      "mac or linux be honest",
      "best tech podcast?",
      "worst language syntax?",
      "coffee or tea while coding",
    ],
    personal: [
      "moment you felt like a senior dev",
      "biggest mistake you made in prod",
      "why did you start coding",
      "what keeps you in this industry",
      "first language you learned vs fav now",
    ],
    random: [
      "post your screen time",
      "fav vs code theme",
      "remote or hybrid?",
      "what skill is keeping you employed",
      "biggest mistake in prod?",
    ],
  };

  return fallbacks[category].map(text => ({ text, category }));
}

// Call-to-action suggestions
export const CTA_OPTIONS = [
  { id: 'none', label: 'No CTA', text: '' },
  { id: 'thoughts', label: 'thoughts', text: '\n\nthoughts?' },
  { id: 'agree', label: 'agree/disagree', text: '\n\nagree or disagree?' },
  { id: 'reply', label: 'reply', text: '\n\nreply with your take' },
  { id: 'predict', label: 'prediction', text: '\n\nwhere do we go from here' },
  { id: 'hot', label: 'hot take', text: '\n\nam i wrong' },
  { id: 'discuss', label: 'discuss', text: '\n\nlet\'s discuss' },
] as const;

export type CTAOption = typeof CTA_OPTIONS[number]['id'];

export function addCTA(tweet: string, ctaId: CTAOption): string {
  const cta = CTA_OPTIONS.find(c => c.id === ctaId);
  if (!cta || cta.id === 'none') return tweet;
  
  const combined = tweet + cta.text;
  // Make sure we don't exceed 280 chars
  if (combined.length > 280) {
    return tweet; // Skip CTA if it would exceed limit
  }
  return combined;
}
