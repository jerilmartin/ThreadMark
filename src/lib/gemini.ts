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
      temperature: tone === 'unhinged' ? 1.1 : tone === 'sarcastic' ? 0.95 : tone === 'analytical' ? 0.7 : 0.9,
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
    hottake: `Write like someone who's been in tech for years and is tired of the BS. Not trying to be funny, just stating facts that happen to be brutal.

VOICE: Confident, direct, slightly jaded. Like texting a friend about industry news.

GOOD TWEETS (this energy):
- "they've been doing the opposite of this for 5 years but sure"
- "funny how this drops right after the earnings call"  
- "remember when they said they'd never do this? I remember"
- "this is literally just [thing] with extra steps"
- "the bar was on the floor and they brought a shovel"

AVOID these AI patterns:
- Starting with "So" or "Well"
- Using "wild" "insane" "crazy" "incredible"
- Rhetorical questions
- Explaining the joke
- Sounding impressed or excited`,

    analytical: `Write like a tech insider sharing genuine insight. You understand the business side, not just the product. Keep it to 2 sentences max.

VOICE: Informed, connecting dots. Like a senior engineer explaining context in slack.

GOOD TWEETS (this energy):
- "this is really about their Q2 numbers, the feature is just the excuse"
- "makes more sense when you know their enterprise contracts are up"
- "third time they've tried this. different market now"
- "the timing here isn't random"

AVOID these AI patterns:
- Starting with "The real story is..." or "Here's the thing"
- Numbered lists or bullet points
- Sounding like a LinkedIn post
- Using "landscape" "ecosystem" "leverage"`,

    sarcastic: `Write like someone who's seen this exact thing happen 10 times before. Dry, understated, not trying hard.

VOICE: Deadpan, ironic, tired. The humor comes from understatement, not exaggeration.

GOOD TWEETS (this energy):
- "ah yes, the classic 'we care about users now' pivot"
- "can't wait to see how this gets walked back in 6 months"
- "incredible how they managed to make [thing] worse"
- "they really said 'what if we did [bad thing] but called it [good thing]'"

AVOID these AI patterns:
- "Revolutionary. Groundbreaking." (overused)
- Obvious sarcasm markers like /s
- Being actually mean or cruel
- Explaining why it's ironic`,

    unhinged: `Write like someone who spends too much time online but is actually making a point. Lowercase, casual, meme-adjacent.

VOICE: Chaotic but relatable. The joke is in the delivery, not the content.

GOOD TWEETS (this energy):
- "me watching this unfold knowing exactly how it ends"
- "we're really just doing this now huh"
- "the way they announced this like we wouldn't notice"
- "not them acting like this is new"

AVOID these AI patterns:
- Forced meme references
- "the simulation" jokes
- Random emojis everywhere
- ALL CAPS for emphasis`,
  };

  const prompt = `${context}

${tonePrompts[tone]}

Write 3 tweets about this news. Each tweet should:
- Be 1-2 sentences max
- Take a different angle on the story
- Sound like an actual person typed it, NOT like AI or a brand
- Reference something specific from the news

CRITICAL: Do NOT use these AI giveaway phrases: "Let's talk about", "Here's the thing", "I mean", "Look,", "Honestly,", "It's giving", "The fact that", "Imagine", "Picture this"

Return only JSON:
{"tweets":[{"text":"..."},{"text":"..."},{"text":"..."}]}`;

  try {
    console.log('Gemini - Calling with tone:', tone);
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('Gemini response:', response.substring(0, 300));
    
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
      `they've been saying the opposite for years but sure`,
      `funny timing on this one`,
      `we're really doing this again huh`,
    ],
    analytical: [
      `this is really about their upcoming earnings, the rest is just positioning`,
      `makes more sense when you look at what their competitors announced last week`,
      `third time they've tried this approach. curious if anything's different now`,
    ],
    sarcastic: [
      `ah yes, because that worked so well last time`,
      `can't wait to see how this gets quietly reversed`,
      `the audacity is almost impressive`,
    ],
    unhinged: [
      `me watching this knowing exactly how it ends`,
      `we're really just doing this now`,
      `not them acting like we wouldn't notice`,
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

Write a Twitter THREAD (4 tweets) about this news. This should be informative and engaging.

THREAD STRUCTURE:
1. Hook - grab attention, state the news in an interesting way
2. Context - why this matters, background info
3. Analysis - your take, what this means, implications
4. Closer - prediction, question, or call to action

RULES:
- Each tweet should be under 280 characters
- First tweet should hook people to read more
- Don't number the tweets (no "1/4" etc)
- Sound like a knowledgeable person sharing insights, not a news outlet
- Last tweet should invite discussion or make a prediction
- NO hashtags

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
        `Here's why this matters and what you need to know.`,
        `The implications of this could be significant for the industry.`,
        `What do you think - is this a good move? Reply with your take.`,
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
    generationConfig: { temperature: 1.0 }
  });

  const categoryPrompts: Record<QuickTweetCategory, string> = {
    uncomfortable: `Generate short, punchy questions that make people uncomfortable but want to answer. Under 100 characters.

EXAMPLES:
- "what's a tech opinion that would get you mass unfollowed"
- "what tool does everyone use that you refuse to touch"
- "what's the worst advice you followed early in your career"
- "what's something you pretend to understand but don't"
- "what's a popular take you're tired of hearing"`,

    reflective: `Generate simple, thoughtful questions. Under 100 characters. Easy to answer.

EXAMPLES:
- "what's something you stopped doing that improved your work"
- "what took you way too long to learn"
- "what's a small change that made a big difference"
- "what do you wish you knew 5 years ago"
- "what's underrated in your workflow"`,

    debate: `Generate short debate starters. Under 100 characters. Two valid sides.

EXAMPLES:
- "is remote work actually more productive"
- "are code reviews worth the time"
- "is typescript worth the overhead"
- "should you specialize or generalize"
- "is perfectionism holding you back or pushing you forward"`,

    punchy: `Generate very short, direct questions. Under 80 characters. One-liners.

EXAMPLES:
- "most overrated tool in your stack?"
- "tabs or spaces and why"
- "what's your unpopular tech opinion"
- "what trend are you ignoring"
- "what's dying that nobody talks about"`,

    personal: `Generate simple personal experience questions. Under 100 characters.

EXAMPLES:
- "what's a tool you dropped and never looked back"
- "what's the best career decision you made"
- "what's something you learned the hard way"
- "what habit actually stuck"
- "what did you stop caring about"`,

    random: `Generate a mix of short, engaging tech questions. Under 100 characters each. Variety of styles.`,
  };

  const prompt = `Generate 5 short tech engagement tweets. No news needed.

${categoryPrompts[category]}

RULES:
- Keep it SHORT. Under 100 characters each, ideally under 80
- Simple language, lowercase is fine
- Questions work best
- NO hashtags, NO links
- Sound like a real person, not a brand
- Easy to reply to

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
      "what's a tech opinion that would get you mass unfollowed",
      "what tool does everyone use that you refuse to touch",
      "what's the worst advice you followed early on",
      "what's something you pretend to understand",
      "what popular take are you tired of hearing",
    ],
    reflective: [
      "what's something you stopped doing that improved your work",
      "what took you way too long to learn",
      "what small change made a big difference",
      "what do you wish you knew 5 years ago",
      "what's underrated in your workflow",
    ],
    debate: [
      "is remote work actually more productive",
      "are code reviews worth the time",
      "is typescript worth the overhead",
      "should you specialize or generalize",
      "is perfectionism helping or hurting you",
    ],
    punchy: [
      "most overrated tool in your stack?",
      "tabs or spaces and why",
      "unpopular tech opinion?",
      "what trend are you ignoring",
      "what's dying that nobody talks about",
    ],
    personal: [
      "what tool did you drop and never miss",
      "best career decision you made",
      "something you learned the hard way",
      "what habit actually stuck",
      "what did you stop caring about",
    ],
    random: [
      "what's a tech opinion that would get you unfollowed",
      "what took you way too long to learn",
      "is remote work actually more productive",
      "most overrated tool?",
      "what tool did you drop and never miss",
    ],
  };

  return fallbacks[category].map(text => ({ text, category }));
}

// Call-to-action suggestions
export const CTA_OPTIONS = [
  { id: 'none', label: 'No CTA', text: '' },
  { id: 'thoughts', label: 'Thoughts?', text: '\n\nthoughts?' },
  { id: 'agree', label: 'Agree/Disagree', text: '\n\nagree or disagree?' },
  { id: 'reply', label: 'Reply', text: '\n\nreply with your take' },
  { id: 'predict', label: 'Prediction', text: '\n\nwhat do you think happens next?' },
  { id: 'hot', label: 'Hot Take', text: '\n\nam I wrong?' },
  { id: 'discuss', label: 'Discuss', text: '\n\nlet\'s discuss 👇' },
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
