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

interface Angle {
  id: string;
  avatarId: string;
  name: string;
  hookLine: string;
  format: 'UGC' | 'Static' | 'Video' | 'Carousel';
}

interface BusinessProfile {
  product_description: string | null;
  current_offer: string | null;
  price_range: string | null;
  market_notes: string | null;
}

interface CreativeBrief {
  avatarName: string;
  angleName: string;
  concept: string;
  hook: string;
  script: string;
  caption: string;
  visualDirection: string;
  productionNotes: string;
  visualPrompt: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildCreativePrompt(
  avatar: Avatar,
  angle: Angle,
  concept: string,
  profile: BusinessProfile
): string {
  return `You are an elite performance creative director with 10+ years of paid social experience.
You write ads that stop the scroll and convert. You think like a direct response copywriter and a filmmaker at once.

Your task: write a complete, production-ready creative brief for ONE specific ad.

━━━ AVATAR ━━━
${avatar.name} — ${avatar.role}, ${avatar.ageRange}
Pain (RIGHT NOW): ${avatar.painPoint}
Core desire (what they ACTUALLY want): ${avatar.coreDesire}
Buying trigger: ${avatar.buyingTrigger}

━━━ ANGLE ━━━
Type: ${angle.name}
Direction: ${angle.hookLine}
Format: ${angle.format}

━━━ CONCEPT FORMAT ━━━
${concept}

━━━ OFFER ━━━
Product: ${profile.product_description ?? 'Not specified'}
Offer: ${profile.current_offer ?? 'Not specified'}
Price: ${profile.price_range ?? 'Not specified'}
Notes: ${profile.market_notes ?? 'None'}

━━━ RULES ━━━
- Everything must be written for THIS specific avatar — not a generic audience
- Hook must create an immediate pattern interrupt in the first 1–3 seconds
- Script follows PASTOR framework: Problem → Amplify → Solution → Testimony → Offer → Response
- Caption: strategic emoji usage (3 max), ends with a soft CTA, not salesy
- Image prompt: hyper-detailed for Midjourney/DALL-E — style, lighting, composition, color palette, mood, specific scene elements
- Video prompt: scene-by-scene with camera directions for AI video generation (Runway/Sora style)
- Production notes must be specific: camera setup, tone, energy level, what to avoid
- No generic advice — every line must be specific to this avatar and this offer

Return ONLY a valid JSON object. No explanation, no markdown, no code fences.

The JSON must have exactly these fields:
{
  "hook": "string — opening hook, first 1-3 seconds, attention-grabbing pattern interrupt specific to this avatar",
  "script": "string — full script following PASTOR framework: Problem → Amplify → Solution → Testimony → Offer → Response. Use \\n\\n to separate sections. Include time markers like [0-5s], [5-20s], etc.",
  "caption": "string — social caption with max 3 strategic emojis, ends with soft CTA, NOT salesy. Use \\n for line breaks.",
  "visualDirection": "string — specific visual description: style, lighting, composition, color palette, mood, what's in frame",
  "productionNotes": "string — how to film/create: camera angles, tone, energy level, what NOT to do, platform-specific notes",
  "imagePrompt": "string — hyper-detailed Midjourney/DALL-E prompt: style, lighting, composition, color palette, mood, specific elements, technical specs",
  "videoPrompt": "string — detailed AI video generation prompt: scene-by-scene with camera directions, transitions, pacing, for Runway/Sora"
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
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = attempt.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return stripJsonMarkdown(raw);
}

// ─── POST /api/ai/creative ────────────────────────────────────────────────────

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

  let body: {
    avatar: Avatar;
    angle: Angle;
    concept: string;
    businessProfile: BusinessProfile;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { avatar, angle, concept, businessProfile } = body;

  if (!avatar?.id || !angle?.id || !concept) {
    return NextResponse.json(
      { error: 'Missing required fields: avatar, angle, concept' },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  let rawText: string;
  try {
    rawText = await callWithJsonRetry(client, buildCreativePrompt(avatar, angle, concept, businessProfile));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }

  let parsed: Omit<CreativeBrief, 'avatarName' | 'angleName' | 'concept'>;
  try {
    parsed = JSON.parse(rawText);
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Response is not a JSON object');
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response as JSON', raw: rawText.slice(0, 300) },
      { status: 500 }
    );
  }

  const brief: CreativeBrief = {
    avatarName: avatar.name,
    angleName: angle.name,
    concept,
    hook: parsed.hook ?? '',
    script: parsed.script ?? '',
    caption: parsed.caption ?? '',
    visualDirection: parsed.visualDirection ?? '',
    productionNotes: parsed.productionNotes ?? '',
    // Map both possible field names from Claude (imagePrompt or visualPrompt)
    visualPrompt:
      (parsed as Record<string, unknown>).imagePrompt as string ??
      (parsed as Record<string, unknown>).visualPrompt as string ??
      '',
  };

  return NextResponse.json(brief);
}
