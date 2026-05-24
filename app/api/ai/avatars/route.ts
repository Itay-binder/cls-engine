import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getUserIntegrations } from '@/lib/user-integrations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessProfile {
  product_description: string | null;
  current_offer: string | null;
  price_range: string | null;
  market_notes: string | null;
}

interface AvatarRaw {
  name: string;
  ageRange: string;
  role: string;
  painPoint: string;
  coreDesire: string;
  buyingTrigger: string;
  awarenessLevel: 'unaware' | 'problem_aware' | 'solution_aware' | 'brand_aware';
  primaryObjection: string;
  voiceOfCustomer: string;
  sophisticationLevel: 'new' | 'experienced' | 'sophisticated';
}

interface Avatar extends AvatarRaw {
  id: string;
  emoji: string;
}

const AVATAR_EMOJIS = ['👔', '💼', '🎯', '🏆', '📊', '💡', '🔥', '⚡', '🎪', '🌟'];

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildAvatarPrompt(profile: BusinessProfile, count: number): string {
  return `You are a direct-response marketing strategist who has built and optimized over 500 paid social campaigns. You understand buyer psychology at a deep level — not demographics, but psychographics, emotional states, and behavioral triggers.

CONTEXT:
- Business: ${profile.product_description ?? 'Not specified'}
- Offer: ${profile.current_offer ?? 'Not specified'}
- Market notes: ${profile.market_notes ?? 'None'}

YOUR JOB:
Generate ${count} DISTINCT market segment hypotheses — not "target audiences" but specific bets about who might respond to this offer. Each is a testable hypothesis, not a confirmed buyer.

RULES FOR EACH AVATAR:
1. SPECIFICITY — Not "business owner who wants to grow" but "the agency owner who tripled clients but profit stayed flat and now doesn't know which client to fire"
2. EMOTIONAL STATE — What is this person feeling THIS WEEK? Frustrated? Embarrassed? Urgently searching? Name the specific emotional state.
3. BUYING PSYCHOLOGY — Are they pain-motivated (running away from something) or gain-motivated (running toward something)? This affects everything.
4. TRIGGER MOMENT — What specific event in their life would make them stop scrolling and actually click? Be precise: "just got rejected from a bank loan" not "needs money"
5. INTERNAL NARRATIVE — What story are they telling themselves about their situation? This is the conversation already happening in their head that your ad needs to enter.

NAME FORMAT: "The [Vivid Descriptor]" — make it immediately evocative. Someone reading it should instantly picture a real person.

DIVERSITY REQUIREMENTS:
- Vary the buying psychology: mix pain-avoiders and gain-seekers
- Vary the urgency level: some are in crisis mode, some are in planning mode
- Vary the sophistication: some have tried many solutions, some are first-timers
- Vary age ranges meaningfully (not just 25-55 for everyone)
- Vary awareness levels across the full spectrum

AWARENESS LEVEL — pick exactly one per avatar:
- "unaware" — doesn't know they have a fixable problem or that a solution exists
- "problem_aware" — knows the pain but hasn't searched for solutions yet
- "solution_aware" — actively comparing options, knows the category exists
- "brand_aware" — has seen the brand before, needs a reason to finally commit

SOPHISTICATION LEVEL — pick exactly one per avatar:
- "new" — first time exploring this type of solution
- "experienced" — tried 1-2 solutions before, has been burned
- "sophisticated" — deep knowledge of the space, high skepticism toward claims

Return ONLY a raw JSON array with exactly ${count} objects. No markdown, no explanation, no code fences.

Schema for each object:
{
  "name": "The [Vivid Descriptor]",
  "ageRange": "XX-XX",
  "role": "specific job title or life situation",
  "painPoint": "what they are experiencing RIGHT NOW this week — specific and emotional",
  "coreDesire": "what they ACTUALLY want deep down (not the surface-level answer)",
  "buyingTrigger": "the specific moment or event that makes them stop scrolling and take action",
  "awarenessLevel": "unaware" | "problem_aware" | "solution_aware" | "brand_aware",
  "primaryObjection": "the single biggest thought that would make them close the ad without clicking — their real hesitation in their own words",
  "voiceOfCustomer": "a verbatim sentence they would type in a Facebook group or Google search — raw, unpolished, their exact language",
  "sophisticationLevel": "new" | "experienced" | "sophisticated"
}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripJsonMarkdown(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

async function callWithJsonRetry(
  client: Anthropic,
  prompt: string,
): Promise<string> {
  const attempt = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = attempt.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return stripJsonMarkdown(raw);
}

// ─── POST /api/ai/avatars ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  const userResult = await getUserIntegrations();
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = userResult.integrations.anthropic_api_key;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured. Add it in Settings → Integrations.', setupUrl: '/settings' },
      { status: 503 }
    );
  }

  let body: { businessProfile: BusinessProfile; count: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessProfile, count = 5 } = body;
  const safeCount = Math.max(1, Math.min(10, count));

  const client = new Anthropic({ apiKey });

  let rawText: string;
  try {
    rawText = await callWithJsonRetry(client, buildAvatarPrompt(businessProfile, safeCount));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }

  let parsed: AvatarRaw[];
  try {
    parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response as JSON', raw: rawText.slice(0, 300) },
      { status: 500 }
    );
  }

  const VALID_AWARENESS = new Set(['unaware', 'problem_aware', 'solution_aware', 'brand_aware']);
  const VALID_SOPHISTICATION = new Set(['new', 'experienced', 'sophisticated']);

  const avatars: Avatar[] = parsed.map((a, i) => ({
    ...a,
    id: crypto.randomUUID(),
    emoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
    awarenessLevel: VALID_AWARENESS.has(a.awarenessLevel) ? a.awarenessLevel : 'problem_aware',
    sophisticationLevel: VALID_SOPHISTICATION.has(a.sophisticationLevel) ? a.sophisticationLevel : 'new',
  }));

  return NextResponse.json(avatars);
}
