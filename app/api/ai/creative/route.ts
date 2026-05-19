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
  return `You are a senior direct-response creative director who has run paid social for 8-figure brands. You think like both a copywriter and a film director — you know that the best ads feel like content, not ads. You understand that 95% of people who see this won't buy today, but the right message plants a seed.

Your job: write a COMPLETE, production-ready creative brief for ONE specific ad. Everything must be specific enough that a freelance creator can execute it without asking a single question.

━━━ THE HUMAN YOU'RE TALKING TO ━━━
${avatar.name} | ${avatar.role} | Age ${avatar.ageRange}
What they're living through RIGHT NOW: ${avatar.painPoint}
What they actually want (the deep thing): ${avatar.coreDesire}
The exact moment that makes them take action: ${avatar.buyingTrigger}

━━━ THE ANGLE & FORMAT ━━━
Angle: ${angle.name}
Hook direction: ${angle.hookLine}
Format: ${angle.format}

━━━ CONCEPT ━━━
${concept}

━━━ THE OFFER ━━━
Product: ${profile.product_description ?? 'Not specified'}
Offer: ${profile.current_offer ?? 'Not specified'}
Price: ${profile.price_range ?? 'Not specified'}
Notes: ${profile.market_notes ?? 'None'}

━━━ WRITING STANDARDS ━━━

HOOK — the most critical element:
- Must stop someone mid-scroll within 1-3 seconds
- Speaks directly to THIS avatar's specific emotional state — not "are you struggling with X" but the feeling itself
- For video/UGC: the opening spoken line or the on-screen text overlay
- For static: the headline text in the image
- Pattern interrupts that work: unexpected confession, counterintuitive claim, mirror their internal monologue, name a specific frustration they've never heard named before

SCRIPT — use the PASTOR framework:
[P] Problem: Name the specific pain. Make them feel seen, not diagnosed.
[A] Amplify: What happens if this doesn't get solved? Make the cost of inaction real.
[S] Solution: Introduce the product as the mechanism that solves the named problem. Not features — transformation.
[T] Testimony: Social proof woven in naturally — sounds like a real person, not a testimonial ad.
[O] Offer: Be specific and create urgency without being pushy. Name the transformation, not the product.
[R] Response: Soft CTA. The next step should feel like a small, obvious action — not a commitment.

Include time markers: [0-3s], [3-15s], [15-30s], [30-45s], [45-60s]
For static/carousel: use [Frame 1], [Frame 2], etc. instead of time markers.

CAPTION:
- Written like a human, not a brand
- Max 3 emojis, placed strategically (not at sentence starts)
- First line must work as a standalone hook (Instagram cuts after ~125 chars)
- End with soft CTA — "link in bio" or "comment X" or "DM us" — never "click buy now"

VISUAL DIRECTION:
- Specific enough that a creative director can brief a videographer or designer
- Name: color palette, lighting mood, subject energy, background, props, wardrobe
- What should be AVOIDED (as important as what to include)
- If UGC: what kind of creator fits this (age, energy, vibe, not gender/ethnicity)

PRODUCTION NOTES:
- Camera: angle, movement, distance from subject
- Tone: energy level (whisper/confessional vs. punchy/fast), pace, cadence
- What this ad should NOT look like (protect against generic execution)
- Platform-specific: TikTok vs. Reels vs. Facebook Feed vs. Stories

IMAGE PROMPT (for Midjourney / DALL-E):
- Start with the main subject description
- Include: art style, lighting setup, color palette, composition, mood, background details
- End with technical specs: --ar 9:16 for vertical, --ar 1:1 for square, --ar 16:9 for horizontal
- Example format: "Photorealistic photo of [subject], [action/pose], [environment], [lighting], [mood], [color palette], shot on Canon R5, f/1.8, cinematic color grade, --ar 9:16 --v 6"

VIDEO PROMPT (for Runway / Sora / Kling):
- Scene-by-scene breakdown with camera instructions
- [Scene 1: 0-3s] Subject, action, camera move, mood
- Include: transitions, text overlays timing, music energy direction
- End with: overall visual style reference (think "[Film/Director] meets [aesthetic]")

Return ONLY a valid JSON object. No explanation, no markdown, no code fences.

The JSON must have exactly these fields:
{
  "hook": "string — the actual opening hook, word-for-word ready to use, first 1-3 seconds",
  "script": "string — full PASTOR script with time markers. Use \\n\\n between sections.",
  "caption": "string — social caption, max 3 emojis, soft CTA. Use \\n for line breaks.",
  "visualDirection": "string — specific visual brief: palette, lighting, subject, energy, what to avoid",
  "productionNotes": "string — camera, tone, pace, platform notes, what this should NOT look like",
  "imagePrompt": "string — complete Midjourney/DALL-E prompt with technical specs and aspect ratio",
  "videoPrompt": "string — scene-by-scene Runway/Sora prompt with camera directions and transitions"
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
