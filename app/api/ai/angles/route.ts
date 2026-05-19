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
  return `You are a senior direct-response creative strategist who has written winning ad angles for 8-figure ecom brands, high-ticket coaches, and B2B SaaS companies. You understand that an angle is not a headline — it's a completely different PSYCHOLOGICAL ENTRY POINT into the same audience's mind.

━━━ WHO YOU'RE WRITING FOR ━━━
${avatar.name} — ${avatar.role}, age ${avatar.ageRange}
Their reality RIGHT NOW: ${avatar.painPoint}
What they actually want (the real thing, not the surface answer): ${avatar.coreDesire}
The moment that makes them stop and click: ${avatar.buyingTrigger}

━━━ THE OFFER ━━━
Product: ${profile.product_description ?? 'Not specified'}
Offer: ${profile.current_offer ?? 'Not specified'}
Price: ${profile.price_range ?? 'Not specified'}
Market notes: ${profile.market_notes ?? 'None'}

━━━ YOUR MISSION ━━━
Generate ${count} ANGLES that are psychologically distinct — each entering the conversation from a completely different place in this person's emotional world.

ANGLE FRAMEWORKS TO DRAW FROM (pick ${count} that fit this avatar's psychology):
1. PAIN AMPLIFICATION — Make the current pain undeniable. "You already know this isn't working."
2. DREAM OUTCOME — Paint the life they actually want. Sensory, specific, emotionally resonant.
3. SOCIAL PROOF — "People exactly like you are doing X." Mirror identity, not just results.
4. AUTHORITY REFRAME — Challenge a belief they hold with a credible counter-claim.
5. CURIOSITY GAP — Create an irresistible information gap. They must know what's on the other side.
6. IDENTITY SHIFT — Not "here's a product" but "here's who you become." Speaks to self-image.
7. BEFORE/AFTER CONTRAST — The transformation story in 5 seconds. Visceral and visual.
8. FEAR OF STAYING SAME — Not FOMO of missing out, but the cost of doing nothing. Specific.
9. PATTERN INTERRUPT — Say something so unexpected it breaks their scroll-trance immediately.
10. ENEMY FRAMING — Name what's REALLY causing the problem (not the surface symptom).
11. CONTRARIAN — Take the opposite position from what the market expects. Earn attention by disagreeing.
12. EDUCATIONAL HOOK — Teach something genuinely useful in the first 5 seconds. Builds trust fast.

━━━ HOOK LINE RULES ━━━
- This must be the ACTUAL first spoken or written line of the ad — word-for-word ready to use
- First 5 seconds max. If it takes longer to say, cut it.
- Must name something specific to THIS avatar's situation — not "are you struggling with X?" but the exact texture of their struggle
- Must create an immediate emotional reaction: recognition, curiosity, fear, or hope
- NEVER start with "Are you...", "Do you want...", "I'm going to show you...", or the brand name
- Each hook must feel like it was written by a different human with a different creative personality

━━━ FORMAT ASSIGNMENT LOGIC ━━━
Assign formats strategically:
- UGC → Social Proof, Identity Shift, Before/After (feels authentic, peer-to-peer)
- Video → Pain Amplification, Enemy Framing, Educational (needs visual storytelling)
- Static → Curiosity Gap, Pattern Interrupt, Contrarian (high-impact single visual)
- Carousel → Before/After Contrast, Educational, Comparison (needs multiple frames)

Return ONLY a valid JSON array with exactly ${count} objects. No explanation, no markdown, no code fences.

Each object must have exactly these fields:
{
  "name": "string (the angle framework name — specific, not generic)",
  "hookLine": "string (the ACTUAL first line of the ad — word-for-word, written for this exact avatar)",
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
