import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getUserIntegrations } from '@/lib/user-integrations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParentAvatar {
  id: string;
  name: string;
  role: string;
  ageRange: string;
  painPoint: string;
  coreDesire: string;
  buyingTrigger: string;
  awarenessLevel?: string;
  sophisticationLevel?: string;
}

interface SubAvatarRaw {
  name: string;
  stage: string;
  specificPain: string;
  buyingReadiness: 'browsing' | 'considering' | 'ready';
  ownWords: string;
}

interface SubAvatar extends SubAvatarRaw {
  id: string;
  parentAvatarId: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildSubAvatarPrompt(parent: ParentAvatar): string {
  return `You are a direct-response segmentation expert. Your job is to take a broad buyer avatar and split it into 3 distinct sub-segments — people who are all "the same type" but at completely different stages or situations.

PARENT AVATAR:
Name: ${parent.name}
Role: ${parent.role} (${parent.ageRange})
Core Pain: ${parent.painPoint}
Core Desire: ${parent.coreDesire}
Buying Trigger: ${parent.buyingTrigger}
${parent.awarenessLevel ? `Awareness: ${parent.awarenessLevel}` : ''}
${parent.sophisticationLevel ? `Sophistication: ${parent.sophisticationLevel}` : ''}

YOUR TASK:
Create 3 sub-avatars. Each shares the same core identity as the parent but represents a meaningfully different situation, stage, or mindset. Think of them as three different "versions" of the same person at different points in their journey.

SEGMENTATION CRITERIA — pick the axis that makes the most sense for this avatar:
- Journey stage: just starting / actively trying / hitting a wall
- Revenue/result bracket: 0-X / X-Y / Y+ (if the avatar is business-related)
- Emotional state: scared and stuck / hopeful but unsure / frustrated after failed attempts
- Urgency level: casual interest / serious consideration / urgent crisis mode
- Prior experience: never tried / tried and failed / tried and partially succeeded

BUYING READINESS — assign one per sub-avatar:
- "browsing" — just looking, no urgency, comparing options passively
- "considering" — actively evaluating, has a budget, needs the right trigger
- "ready" — needs to act NOW, the problem is costing them today

For "ownWords" — write the EXACT search query or Facebook group post this specific sub-avatar would write right now. Raw, unpolished, no marketing language. E.g. "how do I get more clients without ads I already tried everything"

Return ONLY a raw JSON array with exactly 3 objects. No markdown, no explanation.

Schema:
{
  "name": "short label for this sub-segment (e.g. 'The Stuck Beginner', 'The Burned Intermediate')",
  "stage": "one-liner describing their current situation bracket (e.g. '0-5K/month, first 6 months in business')",
  "specificPain": "the pain that is UNIQUE to this sub-segment — different from the parent's generic pain",
  "buyingReadiness": "browsing" | "considering" | "ready",
  "ownWords": "the verbatim sentence they would type in a search or group post right now"
}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripJsonMarkdown(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

// ─── POST /api/ai/sub-avatars ─────────────────────────────────────────────────

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

  let body: { avatar: ParentAvatar };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { avatar } = body;
  if (!avatar?.id) {
    return NextResponse.json({ error: 'Missing avatar data' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  let rawText: string;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildSubAvatarPrompt(avatar) }],
    });
    rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    rawText = stripJsonMarkdown(rawText);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }

  let parsed: SubAvatarRaw[];
  try {
    parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response as JSON', raw: rawText.slice(0, 300) },
      { status: 500 }
    );
  }

  const VALID_READINESS = new Set(['browsing', 'considering', 'ready']);

  const subAvatars: SubAvatar[] = parsed.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    parentAvatarId: avatar.id,
    buyingReadiness: VALID_READINESS.has(s.buyingReadiness) ? s.buyingReadiness : 'considering',
  }));

  return NextResponse.json(subAvatars);
}
