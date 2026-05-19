'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Zap,
  Grid3X3,
  ChevronRight,
  Copy,
  Save,
  Check,
  X,
  ImageIcon,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import {
  saveCreativeSession,
  loadCreativeSession,
  loadCreativeSessionLocal,
  clearCreativeSession,
} from '@/lib/creative-map-store';

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface BusinessProfile {
  id: string;
  business_name: string | null;
  product_description: string | null;
  current_offer: string | null;
  market_notes: string | null;
}

interface CreativeMapState {
  step: 1 | 2 | 3 | 4;
  avatarCount: number;
  avatars: Avatar[];
  selectedAvatarIds: string[];
  angleCount: number;
  angles: Angle[];
  selectedAngleIds: string[];
  concepts: string[];
  businessProfile: BusinessProfile | null;
  workspaceId: string | null;
  activeCell: { avatarId: string; angleId: string; concept: string } | null;
  generatingCreative: boolean;
  currentCreative: CreativeBrief | null;
  error: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AVATAR_EMOJIS = ['👔', '💼', '🎯', '🏆', '📊', '💡', '🔥', '⚡', '🎪', '🌟'];

const ANGLE_TYPES = [
  'Pain Amplifier',
  'Dream Outcome',
  'Social Proof',
  'Authority',
  'Curiosity Gap',
  'Fear of Missing Out',
  'Comparison',
  'Before/After',
  'Shock Hook',
  'Educational',
];

const ALL_CONCEPTS = [
  { name: 'UGC', description: 'Raw, authentic creator content', example: '"I tried this for 30 days..."' },
  { name: 'Founder Story', description: 'Personal brand narrative', example: '"When I started this business..."' },
  { name: 'Problem / Solution', description: 'Diagnose then fix', example: '"If you\'re struggling with X, here\'s why..."' },
  { name: 'Authority / Expert', description: 'Credibility-first positioning', example: '"After 10 years in this industry..."' },
  { name: 'Comparison / vs', description: 'Us vs. the alternative', example: '"Most people do X. We do Y."' },
  { name: 'Testimonial', description: 'Real results from real people', example: '"This changed everything for me..."' },
  { name: 'Before / After', description: 'Transformation arc', example: '"6 months ago I was... now I..."' },
  { name: 'Product Demo', description: 'Show the thing working', example: '"Watch this in action..."' },
  { name: 'Social Proof', description: 'Volume and validation', example: '"10,000 people already use..."' },
  { name: 'Emotional Hook', description: 'Lead with feeling', example: '"You deserve better than this..."' },
  { name: 'Shock / Pattern Interrupt', description: 'Break expectations', example: '"Stop doing this immediately..."' },
  { name: 'Educational / How-To', description: 'Teach to sell', example: '"Here\'s exactly how to..."' },
];

const CONCEPT_COLORS: Record<string, string> = {
  'UGC': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Founder Story': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Problem / Solution': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Authority / Expert': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Comparison / vs': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Testimonial': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Before / After': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Product Demo': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Social Proof': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Emotional Hook': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Shock / Pattern Interrupt': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Educational / How-To': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const FORMAT_COLORS: Record<string, string> = {
  UGC: 'bg-amber-500/10 text-amber-400',
  Static: 'bg-sky-500/10 text-sky-400',
  Video: 'bg-purple-500/10 text-purple-400',
  Carousel: 'bg-emerald-500/10 text-emerald-400',
};

// ─── Mock Generators ─────────────────────────────────────────────────────────

function generateMockAvatars(count: number, businessContext: string): Avatar[] {
  const base: Omit<Avatar, 'id' | 'emoji'>[] = [
    {
      name: 'The Scaling Founder',
      ageRange: '32–45',
      role: 'CEO / Business Owner',
      painPoint: 'Revenue has plateaued and every new tactic feels like guesswork',
      coreDesire: 'Predictable, system-driven growth that doesn\'t depend on them',
      buyingTrigger: 'Sees a peer scale past them or hits a wall after months of stagnation',
    },
    {
      name: 'The Frustrated Manager',
      ageRange: '28–40',
      role: 'Marketing Manager',
      painPoint: 'Campaigns run but results are inconsistent — leadership wants answers',
      coreDesire: 'A repeatable playbook that makes them look like the hero',
      buyingTrigger: 'Gets handed more budget with no clear strategy to spend it',
    },
    {
      name: 'The Ambitious Side-Hustler',
      ageRange: '24–35',
      role: 'Creator / Freelancer',
      painPoint: 'Trading time for money with no leverage or scalable income',
      coreDesire: 'Build something that generates revenue without constant effort',
      buyingTrigger: 'Sees someone similar achieve the result they want in less time',
    },
    {
      name: 'The Experienced Professional',
      ageRange: '38–52',
      role: 'Consultant / Coach',
      painPoint: 'Great at the work, terrible at selling it — clients come from referrals only',
      coreDesire: 'Consistent inbound pipeline without cold outreach or ad guesswork',
      buyingTrigger: 'A dry month with no new leads forces them to take action',
    },
    {
      name: 'The Growth-Hungry Operator',
      ageRange: '26–38',
      role: 'COO / Head of Growth',
      painPoint: 'Metrics tracked everywhere but no clear lever that actually moves revenue',
      coreDesire: 'Clear attribution and a model that justifies scaling ad spend',
      buyingTrigger: 'Board pressure or a competitor growing faster triggers urgency',
    },
    {
      name: 'The Digital Course Creator',
      ageRange: '27–42',
      role: 'Online Educator / Influencer',
      painPoint: 'Big audience but low conversion — content gets attention, not sales',
      coreDesire: 'Turn existing followers into paying customers at a predictable rate',
      buyingTrigger: 'A launch underperforms and they realize reach alone isn\'t enough',
    },
    {
      name: 'The E-commerce Brand Owner',
      ageRange: '25–40',
      role: 'Founder / DTC Brand',
      painPoint: 'ROAS is declining and acquisition cost keeps creeping up',
      coreDesire: 'Lower CAC while growing AOV and repeat purchase rate',
      buyingTrigger: 'A losing month on Meta forces a re-evaluation of the whole funnel',
    },
    {
      name: 'The Agency Owner',
      ageRange: '30–45',
      role: 'Agency CEO / Director',
      painPoint: 'Selling hours, margin is thin, and client churn is unpredictable',
      coreDesire: 'Productized offers with better margins and less delivery chaos',
      buyingTrigger: 'Losing a big client or hitting capacity ceiling triggers change',
    },
    {
      name: 'The Solopreneur',
      ageRange: '22–38',
      role: 'Solo Founder / Freelancer',
      painPoint: 'Everything relies on them — no systems, no team, no breathing room',
      coreDesire: 'Build a business that functions without them being the bottleneck',
      buyingTrigger: 'Burnout or a missed opportunity because they had no capacity',
    },
    {
      name: 'The Corporate Escapee',
      ageRange: '33–48',
      role: 'Ex-Executive / New Entrepreneur',
      painPoint: 'Left a stable job and now needs to replace that income — fast',
      coreDesire: 'Proven path to revenue without wasting time on wrong decisions',
      buyingTrigger: 'Runway is shrinking and they need traction within 90 days',
    },
  ];

  // Use business context to prioritize more relevant avatars
  const relevant = base.slice(0, count);
  return relevant.map((a, i) => ({
    ...a,
    id: `avatar-${i}`,
    emoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
  }));
}

function generateMockAngles(avatarId: string, avatarName: string, count: number): Angle[] {
  const formats: Angle['format'][] = ['UGC', 'Static', 'Video', 'Carousel'];
  return ANGLE_TYPES.slice(0, count).map((name, i) => ({
    id: `angle-${avatarId}-${i}`,
    avatarId,
    name,
    hookLine: getMockHookLine(name, avatarName),
    format: formats[i % formats.length],
  }));
}

function getMockHookLine(angleType: string, avatarName: string): string {
  const hooks: Record<string, string> = {
    'Pain Amplifier': `If you're still doing this manually, you're leaving money on the table every single day.`,
    'Dream Outcome': `Imagine waking up to new sales without lifting a finger — here's the exact system.`,
    'Social Proof': `Over 2,000 ${avatarName.toLowerCase()}s are already using this to scale faster.`,
    'Authority': `After studying 100+ high-performing funnels, here's what actually works.`,
    'Curiosity Gap': `There's a reason the top 1% never talk about this growth method publicly.`,
    'Fear of Missing Out': `This window closes soon — and your competitors are already inside.`,
    'Comparison': `Most businesses do X. The ones that scale do Y. Here's the difference.`,
    'Before/After': `3 months ago they had 0 systems. Today they're running on autopilot.`,
    'Shock Hook': `Stop running ads until you watch this. Seriously.`,
    'Educational': `Here's the 3-step framework behind every 7-figure funnel we've built.`,
  };
  return hooks[angleType] ?? `A fresh angle for ${avatarName} — proven to convert.`;
}

function generateMockCreativeBrief(
  avatar: Avatar,
  angle: Angle,
  concept: string
): CreativeBrief {
  return {
    avatarName: avatar.name,
    angleName: angle.name,
    concept,
    hook: `${angle.hookLine}`,
    script: `**[0–5s Hook]**\n${angle.hookLine}\n\n**[5–20s Problem]**\nHere's what most people miss: ${avatar.painPoint.toLowerCase()}. And it's costing you more than you think.\n\n**[20–40s Solution]**\nThe solution isn't working harder — it's building the right system. One that handles the heavy lifting so you can focus on what actually moves the needle.\n\n**[40–55s CTA]**\nIf you're ready to stop guessing and start scaling, click the link below. Let's map it out together.`,
    caption: `Still doing this the hard way? 🤔\n\n${avatar.painPoint}.\n\nMost ${avatar.role.toLowerCase()}s have been burned by this at least once.\n\nHere's what changes everything 👇\n\n#growth #business #marketing #scale`,
    visualDirection: `Dark, premium background (deep navy or black). Close-up face shot with confident expression. Text overlay: "${angle.hookLine.substring(0, 60)}..." in bold white. Minimal, high-contrast design.`,
    productionNotes: `Film in portrait (9:16) for Reels/TikTok. Use natural light or ring light. No fancy equipment needed — phone works. Speak directly to camera, conversational tone. Keep energy slightly higher than normal conversation. First 3 seconds are everything.`,
    visualPrompt: `Professional ${avatar.role.toLowerCase()}, confident expression, modern office or clean background, looking directly at camera, ${concept.toLowerCase()} style advertisement, dark premium aesthetic, cinematic lighting, photorealistic, 4K`,
  };
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────

function AvatarShimmer() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="shimmer w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="shimmer h-4 w-32 rounded" />
          <div className="shimmer h-3 w-20 rounded" />
        </div>
      </div>
      <div className="shimmer h-3 w-full rounded" />
      <div className="shimmer h-3 w-3/4 rounded" />
      <div className="shimmer h-3 w-5/6 rounded" />
    </div>
  );
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = [
    { num: 1, label: 'Avatars', icon: Users },
    { num: 2, label: 'Angles', icon: Zap },
    { num: 3, label: 'Concepts', icon: Lightbulb },
    { num: 4, label: 'Matrix', icon: Grid3X3 },
  ];

  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-card)] shrink-0">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = step === s.num;
        const isDone = step > s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200',
                  isDone
                    ? 'bg-[var(--color-accent)] text-white'
                    : isActive
                      ? 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-accent)]/30'
                      : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive
                    ? 'text-[var(--color-text)]'
                    : isDone
                      ? 'text-[var(--color-accent-light)]'
                      : 'text-[var(--color-text-muted)]'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-3 h-px w-12 transition-all duration-300',
                  step > s.num ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Avatars ──────────────────────────────────────────────────────────

function Step1Avatars({
  state,
  setState,
}: {
  state: CreativeMapState;
  setState: React.Dispatch<React.SetStateAction<CreativeMapState>>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const selectedCount = state.selectedAvatarIds.length;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('business_profiles')
        .select('id, business_name, product_description, current_offer, market_notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setBusinesses(data as BusinessProfile[]);
            if (!state.businessProfile) {
              setState((prev) => ({ ...prev, businessProfile: data[0] as BusinessProfile }));
            }
          }
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      const res = await fetch('/api/ai/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: state.businessProfile,
          count: state.avatarCount,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setState((prev) => ({ ...prev, error: err.error ?? 'Avatar generation failed' }));
        return;
      }
      const avatars = await res.json() as Avatar[];
      setState((prev) => ({ ...prev, avatars, selectedAvatarIds: avatars.map((a) => a.id), error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setState((prev) => ({ ...prev, error: msg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAvatar = (id: string) => {
    setState((prev) => ({
      ...prev,
      selectedAvatarIds: prev.selectedAvatarIds.includes(id)
        ? prev.selectedAvatarIds.filter((x) => x !== id)
        : [...prev.selectedAvatarIds, id],
    }));
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel */}
      <aside className="w-[320px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
            Step 1 — Avatars
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Who might buy from you?
          </p>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-5">
          {/* Avatar Count Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Generate avatars
              </span>
              <span className="text-sm font-bold text-[var(--color-accent-light)]">
                {state.avatarCount}
              </span>
            </div>
            <Slider
              value={state.avatarCount}
              onChange={(v) => setState((prev) => ({ ...prev, avatarCount: v }))}
              min={3}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          {/* Business Selector */}
          {businesses.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                Business
              </span>
              <select
                value={state.businessProfile?.id ?? ''}
                onChange={(e) => {
                  const biz = businesses.find((b) => b.id === e.target.value);
                  if (biz) setState((prev) => ({ ...prev, businessProfile: biz, avatars: [], selectedAvatarIds: [], error: null }));
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.business_name ?? 'Unnamed Business'}
                  </option>
                ))}
              </select>
            </div>
          )}
          {businesses.length === 0 && (
            <div className="text-[11px] text-[var(--color-text-muted)] bg-[var(--color-border)]/30 rounded-lg p-3">
              No business profile found.{' '}
              <a href="/onboarding" className="text-[var(--color-accent-light)] underline">Set one up →</a>
            </div>
          )}

          <Separator />

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            CLS doesn't pre-define your audience. We generate hypotheses for the market to test.
          </p>

          <div className="flex flex-col gap-2 mt-auto pt-2">
            <Button
              className="w-full h-11 text-sm font-semibold gradient-accent border-0 shadow-lg shadow-[var(--color-accent)]/20 hover:shadow-[var(--color-accent)]/40 hover:brightness-110"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Avatars
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Error Banner */}
        {state.error && !isGenerating && state.avatars.length === 0 && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{state.error}</span>
          </div>
        )}
        {/* Empty State */}
        {!isGenerating && state.avatars.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
              <Users className="w-9 h-9 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                {state.businessProfile ? `Generating for ${state.businessProfile.business_name ?? 'your business'}` : 'Click Generate to create avatar hypotheses'}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm">
                {state.businessProfile
                  ? 'AI will build buyer hypotheses based on your business profile.'
                  : 'Select a business from the sidebar, then click Generate.'}
              </p>
            </div>
          </div>
        )}

        {/* Generating shimmer */}
        {isGenerating && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: state.avatarCount }).map((_, i) => (
                <AvatarShimmer key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!isGenerating && state.avatars.length > 0 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="text-[var(--color-accent-light)] font-bold text-sm">{state.avatars.length}</span> avatars generated
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {selectedCount} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {state.avatars.map((avatar) => {
                  const isSelected = state.selectedAvatarIds.includes(avatar.id);
                  return (
                    <div
                      key={avatar.id}
                      onClick={() => toggleAvatar(avatar.id)}
                      className={cn(
                        'relative rounded-xl border bg-[var(--color-card)] p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-card-hover)]',
                        isSelected
                          ? 'border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/10 bg-gradient-to-br from-[var(--color-card)] to-[var(--color-accent-dim)]'
                          : 'border-[var(--color-border)]'
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200',
                          isSelected
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                            : 'border-[var(--color-border)]'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      <div className="flex items-start gap-3 mb-3 pr-6">
                        <span className="text-2xl leading-none">{avatar.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">
                            {avatar.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-[var(--color-text-muted)]">{avatar.ageRange}</span>
                            <span className="text-[var(--color-border)]">·</span>
                            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-[var(--color-border)] text-[var(--color-text-secondary)]">
                              {avatar.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex gap-1.5">
                          <span className="text-[var(--color-text-muted)] shrink-0 font-medium w-20">Pain</span>
                          <span className="text-[var(--color-text-secondary)] line-clamp-2">{avatar.painPoint}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[var(--color-text-muted)] shrink-0 font-medium w-20">Desire</span>
                          <span className="text-[var(--color-text-secondary)] line-clamp-1">{avatar.coreDesire}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[var(--color-text-muted)] shrink-0 font-medium w-20">Trigger</span>
                          <span className="text-[var(--color-text-secondary)] line-clamp-1">{avatar.buyingTrigger}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end shrink-0">
              <Button
                className="gradient-accent border-0 shadow-lg shadow-[var(--color-accent)]/20 hover:brightness-110"
                disabled={selectedCount === 0}
                onClick={() => setState((prev) => ({ ...prev, step: 2 }))}
              >
                Continue with {selectedCount} selected
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Step 2: Angles ───────────────────────────────────────────────────────────

function Step2Angles({
  state,
  setState,
}: {
  state: CreativeMapState;
  setState: React.Dispatch<React.SetStateAction<CreativeMapState>>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const selectedAvatars = state.avatars.filter((a) => state.selectedAvatarIds.includes(a.id));
  const selectedCount = state.selectedAngleIds.length;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      const results = await Promise.all(
        selectedAvatars.map((avatar) =>
          fetch('/api/ai/angles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatar,
              businessProfile: state.businessProfile,
              count: state.angleCount,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json() as { error?: string };
              throw new Error(err.error ?? `Angles failed for ${avatar.name}`);
            }
            return res.json() as Promise<Angle[]>;
          })
        )
      );
      const angles = results.flat();
      setState((prev) => ({ ...prev, angles, selectedAngleIds: angles.map((a) => a.id), error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Angle generation failed';
      setState((prev) => ({ ...prev, error: msg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAngle = (id: string) => {
    setState((prev) => ({
      ...prev,
      selectedAngleIds: prev.selectedAngleIds.includes(id)
        ? prev.selectedAngleIds.filter((x) => x !== id)
        : [...prev.selectedAngleIds, id],
    }));
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel */}
      <aside className="w-[320px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
            Step 2 — Angles
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Different ways to speak to the same person
          </p>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-5">
          {/* Selected avatars chips */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
              Working with
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedAvatars.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] border border-[var(--color-accent)]/20"
                >
                  {a.emoji} {a.name}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          {/* Angles per avatar slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Angles per avatar
              </span>
              <span className="text-sm font-bold text-[var(--color-accent-light)]">
                {state.angleCount}
              </span>
            </div>
            <Slider
              value={state.angleCount}
              onChange={(v) => setState((prev) => ({ ...prev, angleCount: v }))}
              min={3}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Each angle is a different way to speak to the same person — same audience, different entry point.
          </p>

          <div className="flex flex-col gap-2 mt-auto pt-2">
            <Button
              className="w-full h-11 text-sm font-semibold gradient-accent border-0 shadow-lg shadow-[var(--color-accent)]/20 hover:brightness-110"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Angles
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs text-[var(--color-text-muted)]"
              onClick={() => setState((prev) => ({ ...prev, step: 1 }))}
            >
              ← Back to Avatars
            </Button>
          </div>
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!isGenerating && state.angles.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
              <Zap className="w-9 h-9 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Generate angles for your avatars</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm">
                Each avatar gets {state.angleCount} unique angles — different hooks, same audience.
              </p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {selectedAvatars.map((avatar) => (
              <div key={avatar.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{avatar.emoji}</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{avatar.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: state.angleCount }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col gap-2">
                      <div className="shimmer h-3 w-24 rounded" />
                      <div className="shimmer h-4 w-full rounded" />
                      <div className="shimmer h-3 w-3/4 rounded" />
                      <div className="shimmer h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isGenerating && state.angles.length > 0 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="text-[var(--color-accent-light)] font-bold text-sm">{state.angles.length}</span> angles total
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{selectedCount} selected</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {selectedAvatars.map((avatar) => {
                const avatarAngles = state.angles.filter((a) => a.avatarId === avatar.id);
                return (
                  <div key={avatar.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{avatar.emoji}</span>
                      <span className="text-sm font-semibold text-[var(--color-text)]">{avatar.name}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{avatar.role}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {avatarAngles.map((angle) => {
                        const isSelected = state.selectedAngleIds.includes(angle.id);
                        return (
                          <div
                            key={angle.id}
                            onClick={() => toggleAngle(angle.id)}
                            className={cn(
                              'relative rounded-xl border bg-[var(--color-card)] p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-card-hover)]',
                              isSelected
                                ? 'border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/10 bg-gradient-to-br from-[var(--color-card)] to-[var(--color-accent-dim)]'
                                : 'border-[var(--color-border)]'
                            )}
                          >
                            <div
                              className={cn(
                                'absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200',
                                isSelected
                                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                                  : 'border-[var(--color-border)]'
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>

                            <p className="text-xs font-bold text-[var(--color-accent-light)] mb-1.5 pr-6">
                              {angle.name}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mb-2.5">
                              {angle.hookLine}
                            </p>
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', FORMAT_COLORS[angle.format])}>
                              {angle.format}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end shrink-0">
              <Button
                className="gradient-accent border-0 shadow-lg shadow-[var(--color-accent)]/20 hover:brightness-110"
                disabled={selectedCount === 0}
                onClick={() => setState((prev) => ({ ...prev, step: 3 }))}
              >
                Continue with {selectedCount} angles
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Step 3: Concepts ─────────────────────────────────────────────────────────

function Step3Concepts({
  state,
  setState,
}: {
  state: CreativeMapState;
  setState: React.Dispatch<React.SetStateAction<CreativeMapState>>;
}) {
  const selectedAvatars = state.avatars.filter((a) => state.selectedAvatarIds.includes(a.id));
  const selectedAngles = state.angles.filter((a) => state.selectedAngleIds.includes(a.id));

  const toggleConcept = (name: string) => {
    setState((prev) => ({
      ...prev,
      concepts: prev.concepts.includes(name)
        ? prev.concepts.filter((c) => c !== name)
        : [...prev.concepts, name],
    }));
  };

  const totalCombinations =
    selectedAvatars.length * selectedAngles.length * state.concepts.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Step 3 — Concepts</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Select the creative formats to include in the matrix</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setState((prev) => ({ ...prev, concepts: ALL_CONCEPTS.map((c) => c.name) }))}
            className="text-xs text-[var(--color-accent-light)] hover:underline"
          >
            Select all
          </button>
          <span className="text-[var(--color-border)]">·</span>
          <button
            onClick={() => setState((prev) => ({ ...prev, concepts: [] }))}
            className="text-xs text-[var(--color-text-muted)] hover:underline"
          >
            Deselect all
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-3">
          {ALL_CONCEPTS.map((concept) => {
            const isSelected = state.concepts.includes(concept.name);
            const colorClass = CONCEPT_COLORS[concept.name] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            return (
              <div
                key={concept.name}
                onClick={() => toggleConcept(concept.name)}
                className={cn(
                  'relative rounded-xl border bg-[var(--color-card)] p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-card-hover)]',
                  isSelected
                    ? 'border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/10'
                    : 'border-[var(--color-border)]'
                )}
              >
                <div
                  className={cn(
                    'absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isSelected
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                      : 'border-[var(--color-border)]'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                <div className="pr-6">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border mb-2', colorClass)}>
                    {concept.name}
                  </span>
                  <p className="text-xs font-medium text-[var(--color-text)] mb-1">{concept.description}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] italic line-clamp-1">{concept.example}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between shrink-0">
        <div className="text-sm text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-secondary)]">{selectedAvatars.length} avatars</span>
          <span className="mx-2 text-[var(--color-border)]">×</span>
          <span className="text-[var(--color-text-secondary)]">{selectedAngles.length} angles</span>
          <span className="mx-2 text-[var(--color-border)]">×</span>
          <span className="text-[var(--color-text-secondary)]">{state.concepts.length} concepts</span>
          <span className="mx-2">=</span>
          <span className="font-bold text-[var(--color-accent-light)] text-base">{totalCombinations} combinations</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-xs text-[var(--color-text-muted)]"
            onClick={() => setState((prev) => ({ ...prev, step: 2 }))}
          >
            ← Back
          </Button>
          <Button
            className="gradient-accent border-0 shadow-lg shadow-[var(--color-accent)]/20 hover:brightness-110"
            disabled={state.concepts.length === 0 || totalCombinations === 0}
            onClick={() => setState((prev) => ({ ...prev, step: 4 }))}
          >
            Build Creative Matrix →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Creative Drawer ──────────────────────────────────────────────────────────

function CreativeDrawer({
  state,
  onClose,
  onSave,
}: {
  state: CreativeMapState;
  onClose: () => void;
  onSave: (brief: CreativeBrief) => Promise<boolean>;
}) {
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!state.activeCell || !state.currentCreative) return null;

  const brief = state.currentCreative;
  const avatar = state.avatars.find((a) => a.id === state.activeCell!.avatarId);
  const angle = state.angles.find((a) => a.id === state.activeCell!.angleId);

  const handleSave = async () => {
    setSaving(true);
    await onSave(brief);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[520px] bg-[#0D1422] border-l border-[var(--color-border)] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)] shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {avatar && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] border border-[var(--color-accent)]/20">
                  {avatar.emoji} {avatar.name}
                </span>
              )}
              {angle && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--color-border)] text-[var(--color-text-secondary)]">
                  {angle.name}
                </span>
              )}
              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border', CONCEPT_COLORS[brief.concept] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20')}>
                {brief.concept}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-[var(--color-text)] mt-2">Creative Brief</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Hook */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-accent-light)]">Hook</span>
              <CopyButton text={brief.hook} label="Copy" />
            </div>
            <p className="text-sm text-[var(--color-text)] leading-relaxed font-medium">{brief.hook}</p>
          </div>

          {/* Script */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-secondary)]">Script (30–60s)</span>
              <CopyButton text={brief.script} label="Copy" />
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
              {brief.script}
            </div>
          </div>

          {/* Caption */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Caption</span>
              <CopyButton text={brief.caption} label="Copy" />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{brief.caption}</p>
          </div>

          {/* Visual Direction */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">Visual Direction</span>
              <CopyButton text={brief.visualDirection} label="Copy" />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{brief.visualDirection}</p>
          </div>

          {/* Production Notes */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400">Production Notes</span>
              <CopyButton text={brief.productionNotes} label="Copy" />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{brief.productionNotes}</p>
          </div>

          {/* Image Prompt */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-pink-400">Visual Prompt</span>
              <button
                onClick={() => setShowImagePrompt((p) => !p)}
                className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition-colors"
              >
                {showImagePrompt ? 'Hide' : 'Show'} prompt
              </button>
            </div>
            {showImagePrompt ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-mono bg-[var(--color-background)] rounded-lg p-3">
                  {brief.visualPrompt}
                </p>
                <CopyButton text={brief.visualPrompt} label="Copy for Midjourney / DALL-E" />
              </div>
            ) : (
              <p className="text-[11px] text-[var(--color-text-muted)]">
                <ImageIcon className="w-3 h-3 inline mr-1" />
                Use this in Midjourney or DALL-E to generate a visual
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-[var(--color-border)] shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-400" /> Saved!</>
            ) : saving ? (
              <><span className="w-4 h-4 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Save to Library</>
            )}
          </Button>
          <Button
            variant="ghost"
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
            onClick={() => setShowImagePrompt(true)}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Generate Image
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Step 4: Matrix ───────────────────────────────────────────────────────────

function Step4Matrix({
  state,
  setState,
}: {
  state: CreativeMapState;
  setState: React.Dispatch<React.SetStateAction<CreativeMapState>>;
}) {
  const selectedAvatars = state.avatars.filter((a) => state.selectedAvatarIds.includes(a.id));
  const selectedAngles = state.angles.filter((a) => state.selectedAngleIds.includes(a.id));
  const totalCombinations = selectedAvatars.length * selectedAngles.length * state.concepts.length;

  const handleCellClick = async (avatarId: string, angleId: string, concept: string) => {
    const avatar = state.avatars.find((a) => a.id === avatarId)!;
    const angle = state.angles.find((a) => a.id === angleId)!;

    setState((prev) => ({
      ...prev,
      activeCell: { avatarId, angleId, concept },
      generatingCreative: true,
      currentCreative: null,
      error: null,
    }));

    try {
      const res = await fetch('/api/ai/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar,
          angle,
          concept,
          businessProfile: state.businessProfile,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setState((prev) => ({ ...prev, generatingCreative: false, error: err.error ?? 'Creative generation failed' }));
        return;
      }
      const brief = await res.json() as CreativeBrief;
      setState((prev) => ({ ...prev, generatingCreative: false, currentCreative: brief, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setState((prev) => ({ ...prev, generatingCreative: false, error: msg }));
    }
  };

  const handleSaveToLibrary = async (brief: CreativeBrief): Promise<boolean> => {
    try {
      const res = await fetch('/api/creative/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${brief.avatarName} — ${brief.angleName} — ${brief.concept}`,
          hook: brief.hook,
          script: brief.script,
          caption: brief.caption,
          visual_prompt: brief.visualPrompt,
          production_notes: brief.productionNotes,
          avatar_name: brief.avatarName,
          angle_name: brief.angleName,
          concept: brief.concept,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Creative Matrix</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {selectedAvatars.length} Avatars
            </span>
            <span className="text-[var(--color-border)]">×</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {selectedAngles.length} Angles
            </span>
            <span className="text-[var(--color-border)]">×</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {state.concepts.length} Concepts
            </span>
            <span className="text-[var(--color-border)]">=</span>
            <span className="text-sm font-bold text-[var(--color-accent-light)]">
              {totalCombinations} Creative Variations
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-xs text-[var(--color-text-muted)]"
          onClick={() => setState((prev) => ({ ...prev, step: 3 }))}
        >
          ← Back to Concepts
        </Button>
      </div>

      {/* Matrix Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue={selectedAvatars[0]?.id} className="flex flex-col h-full">
          {/* Avatar tabs */}
          <div className="px-6 py-3 border-b border-[var(--color-border)] shrink-0">
            <TabsList>
              {selectedAvatars.map((avatar) => (
                <TabsTrigger key={avatar.id} value={avatar.id} className="text-xs gap-1.5">
                  <span>{avatar.emoji}</span>
                  <span>{avatar.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Matrix per avatar */}
          {selectedAvatars.map((avatar) => {
            const avatarAngles = selectedAngles.filter((a) => a.avatarId === avatar.id);
            return (
              <TabsContent key={avatar.id} value={avatar.id} className="flex-1 overflow-auto m-0">
                <div className="p-6 overflow-auto">
                  <div className="min-w-max">
                    {/* Header row: concept types */}
                    <div className="flex gap-2 mb-2 pl-[200px]">
                      {state.concepts.map((concept) => {
                        const colorClass = CONCEPT_COLORS[concept] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
                        return (
                          <div
                            key={concept}
                            className={cn('w-[140px] shrink-0 text-center rounded-full px-2 py-1 text-[10px] font-bold border', colorClass)}
                          >
                            {concept}
                          </div>
                        );
                      })}
                    </div>

                    {/* Rows: angles */}
                    {avatarAngles.map((angle) => (
                      <div key={angle.id} className="flex gap-2 mb-2 items-start">
                        {/* Row label */}
                        <div className="w-[190px] shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 mr-2">
                          <p className="text-[11px] font-bold text-[var(--color-accent-light)] leading-tight">{angle.name}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{angle.hookLine.substring(0, 45)}...</p>
                          <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium mt-1', FORMAT_COLORS[angle.format])}>
                            {angle.format}
                          </span>
                        </div>

                        {/* Cells: concepts */}
                        {state.concepts.map((concept) => {
                          const colorClass = CONCEPT_COLORS[concept] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
                          const isActive =
                            state.activeCell?.avatarId === avatar.id &&
                            state.activeCell?.angleId === angle.id &&
                            state.activeCell?.concept === concept;
                          return (
                            <button
                              key={concept}
                              onClick={() => handleCellClick(avatar.id, angle.id, concept)}
                              className={cn(
                                'w-[140px] shrink-0 rounded-lg border text-[10px] font-medium px-2 py-2 text-left transition-all duration-150 flex items-center justify-between gap-1 group',
                                isActive
                                  ? cn(colorClass, 'shadow-md scale-[1.02]')
                                  : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-secondary)]'
                              )}
                            >
                              <span className="truncate">{concept}</span>
                              <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Creative Drawer */}
      {state.activeCell && state.currentCreative && (
        <CreativeDrawer
          state={state}
          onClose={() => setState((prev) => ({ ...prev, activeCell: null, currentCreative: null }))}
          onSave={handleSaveToLibrary}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreativeMapPage() {
  const [state, setState] = useState<CreativeMapState>({
    step: 1,
    avatarCount: 5,
    avatars: [],
    selectedAvatarIds: [],
    angleCount: 5,
    angles: [],
    selectedAngleIds: [],
    concepts: ALL_CONCEPTS.slice(0, 6).map((c) => c.name),
    businessProfile: null,
    workspaceId: null,
    activeCell: null,
    generatingCreative: false,
    currentCreative: null,
    error: null,
  });

  // Load business profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('business_profiles')
        .select('id, business_name, product_description, current_offer, market_notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setState((prev) => ({ ...prev, businessProfile: data as BusinessProfile }));
      }
    };

    loadProfile();
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#070A12' }}
    >
      <StepProgressBar step={state.step} />

      <div className="flex-1 flex overflow-hidden">
        {state.step === 1 && <Step1Avatars state={state} setState={setState} />}
        {state.step === 2 && <Step2Angles state={state} setState={setState} />}
        {state.step === 3 && <Step3Concepts state={state} setState={setState} />}
        {state.step === 4 && <Step4Matrix state={state} setState={setState} />}
      </div>
    </div>
  );
}
