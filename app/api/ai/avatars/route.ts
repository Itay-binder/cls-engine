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
}

interface Avatar extends AvatarRaw {
  id: string;
  emoji: string;
}

const AVATAR_EMOJIS = ['👔', '💼', '🎯', '🏆', '📊', '💡', '🔥', '⚡', '🎪', '🌟'];

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildAvatarPrompt(profile: BusinessProfile, count: number): string {
  return `You are a market research expert building creative testing hypotheses for performance marketers.

Your job is NOT to define a target audience — your job is to generate distinct avatar HYPOTHESES: real segments who MIGHT respond to this offer. Each hypothesis is a bet to be tested, not a confirmed buyer.

Business context:
- Product / Service: ${profile.product_description ?? 'Not specified'}
- Current offer: ${profile.current_offer ?? 'Not specified'}
- Price point: ${profile.price_range ?? 'Not specified'}
- Additional market notes: ${profile.market_notes ?? 'None'}

Generate ${count} distinct avatar hypotheses. Rules:
- Each avatar must be a genuinely different market segment — different situation, different mindset, different trigger
- Avoid marketing-speak clichés like "entrepreneurs aged 25-45 who want to grow their business"
- Each avatar should feel like a real, specific person you could picture — with a specific job, specific frustration, specific desire
- Make them diverse in age range, role, and buying psychology
- The name format: "The [Specific Descriptor]" (e.g., "The Burned-Out Agency Owner", "The Scaling Ecom Founder", "The DIY Coach Who Hit a Ceiling")
- Pain points should describe what they're experiencing RIGHT NOW — not in general, but this week
- Core desire should be what they actually want deep down, not what they'd say in a survey
- Buying trigger should be the specific moment or event that would make them stop scrolling and click

Return ONLY a valid JSON array with exactly ${count} objects. No explanation, no markdown, no code blocks. Just the raw JSON array.

Each object must have exactly these fields:
{
  "name": "string",
  "ageRange": "string (e.g. '32-45')",
  "role": "string (specific job/situation)",
  "painPoint": "string (the specific problem they're experiencing RIGHT NOW)",
  "coreDesire": "string (what they ACTUALLY want, not what they say they want)",
  "buyingTrigger": "string (what would make them stop scrolling and click)"
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
    model: 'claude-haiku-4-5',
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

  const avatars: Avatar[] = parsed.map((a, i) => ({
    ...a,
    id: crypto.randomUUID(),
    emoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
  }));

  return NextResponse.json(avatars);
}
