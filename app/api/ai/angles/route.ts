import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getUserIntegrations } from '@/lib/user-integrations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Avatar {
  id: string;
  emoji: string;
  name: string;
  ageRange: string;
  role: string;
  painPoint: string;
  coreDesire: string;
  buyingTrigger: string;
}

interface BusinessProfile {
  product_description: string | null;
  current_offer: string | null;
  price_range: string | null;
  market_notes: string | null;
}

interface AngleRaw {
  name: string;
  hookLine: string;
  format: 'UGC' | 'Static' | 'Video' | 'Carousel';
}

interface Angle extends AngleRaw {
  id: string;
  avatarId: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildAnglesPrompt(
  avatar: Avatar,
  profile: BusinessProfile,
  count: number
): string {
  return `You are an elite performance creative strategist with 10+ years building paid social campaigns.

Your job: generate ${count} distinct marketing ANGLES for this specific avatar and offer.
An angle is a different way to ENTER the conversation in this person's mind — same audience, completely different psychological entry point.

AVATAR:
- Name: ${avatar.name}
- Who they are: ${avatar.role}, ${avatar.ageRange}
- Their pain RIGHT NOW: ${avatar.painPoint}
- What they actually want: ${avatar.coreDesire}
- What makes them click: ${avatar.buyingTrigger}

OFFER:
- Product: ${profile.product_description ?? 'Not specified'}
- Current offer: ${profile.current_offer ?? 'Not specified'}
- Price: ${profile.price_range ?? 'Not specified'}
- Notes: ${profile.market_notes ?? 'None'}

Angle types to VARY across your ${count} angles (use different ones, don't repeat):
Pain Amplification | Dream Outcome | Social Proof | Authority/Credibility | Curiosity Gap | Fear of Missing Out | Before/After | Comparison | Shock/Pattern Interrupt | Educational | Identity-Based | Contrarian

Rules:
- Each angle must feel COMPLETELY different psychologically — not just a reworded version of another
- The hookLine must be the ACTUAL first line of the ad — first 5 seconds, punchy, specific, not generic
- The hookLine must speak directly to THIS avatar's specific situation, not a generic buyer
- Format should be assigned strategically (e.g., Social Proof → UGC, Educational → Video, Comparison → Carousel)
- Vary the formats across the ${count} angles

Return ONLY a valid JSON array with exactly ${count} objects. No explanation, no markdown, no code fences.

Each object must have exactly these fields:
{
  "name": "string (the angle type name, e.g. 'Pain Amplification')",
  "hookLine": "string (the ACTUAL first line of the ad — specific and punchy, written for this avatar)",
  "format": "UGC" | "Static" | "Video" | "Carousel"
}`;
}

// ─── JSON retry helper ────────────────────────────────────────────────────────

function stripJsonMarkdown(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

async function callWithJsonRetry(client: Anthropic, prompt: string): Promise<string> {
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

// ─── POST /api/ai/angles ──────────────────────────────────────────────────────

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

  let body: { avatar: Avatar; businessProfile: BusinessProfile; count: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { avatar, businessProfile, count = 5 } = body;
  const safeCount = Math.max(1, Math.min(10, count));

  if (!avatar?.id) {
    return NextResponse.json({ error: 'Missing avatar data' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  let rawText: string;
  try {
    rawText = await callWithJsonRetry(client, buildAnglesPrompt(avatar, businessProfile, safeCount));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }

  let parsed: AngleRaw[];
  try {
    parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response as JSON', raw: rawText.slice(0, 300) },
      { status: 500 }
    );
  }

  const VALID_FORMATS = new Set(['UGC', 'Static', 'Video', 'Carousel']);
  const angles: Angle[] = parsed.map((a) => ({
    id: crypto.randomUUID(),
    avatarId: avatar.id,
    name: a.name,
    hookLine: a.hookLine,
    format: VALID_FORMATS.has(a.format) ? a.format : 'Video',
  }));

  return NextResponse.json(angles);
}
