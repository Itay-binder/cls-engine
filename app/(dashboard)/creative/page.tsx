'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  Trophy,
  RefreshCw,
  Search,
  FileText,
  Zap,
  Image,
  AlignLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type HypothesisStatus = 'pending' | 'testing' | 'winner' | 'failed';

interface HypothesisItem {
  id: string;
  hook: string;
  sub_market: string | null;
  hypothesis_status: HypothesisStatus;
}

interface CreativeOutput {
  script: string;
  hook: string;
  caption: string;
  visualPrompt: string;
  productionNotes: string[];
}

// ─── Mock creative output (placeholder for real AI) ──────────────────────────

const MOCK_OUTPUT: CreativeOutput = {
  hook: "Most fitness coaches think clients quit because of motivation. They're wrong.",
  script: `[HOOK — 0:00-0:05]
"Most fitness coaches think clients quit because of motivation. They're wrong."

[PROBLEM — 0:05-0:20]
Cut to coach looking at empty calendar. Voiceover:
"Week 3. That's when 70% of clients ghost you. Not because they gave up — because you went silent."

[AGITATE — 0:20-0:40]
Quick cut montage: unanswered DMs, cancelled sessions, refund requests.
"You built the program. You did the work. But you missed the one thing that keeps people: acknowledgment."

[SOLUTION — 0:40-1:00]
Coach on camera, casual setup:
"We added one message to our Week 3 sequence. 3 lines. No fluff. Client churn dropped 41% in the first month."

[CTA — 1:00-1:15]
"Comment 'CHECK-IN' and I'll send you the exact 3-line message we use. Free."`,

  caption: `Most coaches lose clients in week 3. Not because of bad programming — because of silence.

We fixed it with one message. Churn dropped 41%.

Here's what we changed 👇

Week 3 used to feel like a wall for our clients. Excitement wore off, results weren't obvious yet.

So we built a 3-line "momentum check-in" — sent automatically on day 18 of every program.

The result? 41% less churn. Happier clients. More referrals.

Comment "CHECK-IN" and I'll send you the exact message. No opt-in needed.

#fitnesscoach #onlinecoach #clientretention #coachingbusiness`,

  visualPrompt: `Cinematic vertical video (9:16). Location: Modern minimalist home office.

SHOT 1 (Hook): Close-up of coach's face, direct eye contact. Slightly underexposed, warm tungsten light from left.

SHOT 2 (Problem): Split-screen — phone screen with unanswered messages, empty Calendly slots.

SHOT 3 (Solution): Coach sits forward, shows phone with message template. Warmer grade returns.

SHOT 4 (CTA): Pull back to full setup. Coach smiles naturally. Lower third: "DM me 'CHECK-IN'"

Overall aesthetic: iPhone-shot UGC feel. Real. Raw. Credible.`,

  productionNotes: [
    'Record hook in one take — no cuts in the first 5 seconds. Critical for hold rate.',
    'Use natural lighting (window light) for UGC credibility. Avoid ring lights.',
    'Captions via CapCut or Captions app — white text, black outline, bottom third.',
    'Keep total length under 75 seconds for Reels/TikTok algorithm.',
    'Shoot 3 hook variations: direct-to-camera, walking, while looking at phone.',
    'B-roll: get 30s of "phone with DM screen" footage for editing flexibility.',
    'Sound: trending audio (low volume) + voiceover, or clean voice-only. Test both.',
    'CTA delivery: pause 0.5s before saying the keyword — creates micro-anticipation.',
  ],
};

const STATUS_CONFIG: Record<
  HypothesisStatus,
  { label: string; badgeVariant: 'outline' | 'secondary' | 'default' | 'success' | 'warning' | 'danger' }
> = {
  pending: { label: 'Pending', badgeVariant: 'outline' },
  testing: { label: 'Testing', badgeVariant: 'secondary' },
  winner: { label: 'Winner', badgeVariant: 'success' },
  failed: { label: 'Failed', badgeVariant: 'danger' },
};

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ─── Output Card ──────────────────────────────────────────────────────────────

function OutputCard({
  title,
  icon: Icon,
  content,
  large,
  isLoading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  large?: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="shimmer w-4 h-4 rounded" />
            <div className="shimmer w-16 h-4 rounded" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="shimmer w-full h-4 rounded" />
          <div className="shimmer w-5/6 h-4 rounded" />
          <div className="shimmer w-4/6 h-4 rounded" />
          {large && (
            <>
              <div className="shimmer w-full h-4 rounded mt-2" />
              <div className="shimmer w-3/4 h-4 rounded" />
              <div className="shimmer w-5/6 h-4 rounded" />
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col hover:bg-[var(--color-card-hover)] transition-colors">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[var(--color-accent-light)]" />
          <CardTitle className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            {title}
          </CardTitle>
        </div>
        <CopyButton text={content} />
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-[var(--color-text)] leading-relaxed whitespace-pre-line',
            large ? 'text-xs' : 'text-sm font-medium'
          )}
        >
          {content}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Workspace helper ─────────────────────────────────────────────────────────

async function getWorkspaceId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.id ?? null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreativePage() {
  const [selectedHypothesis, setSelectedHypothesis] = useState<HypothesisItem | null>(null);
  const [customBrief, setCustomBrief] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hypotheses, setHypotheses] = useState<HypothesisItem[]>([]);
  const [isLoadingHypotheses, setIsLoadingHypotheses] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [creativeType, setCreativeType] = useState('');
  const [platform, setPlatform] = useState('');
  const [format, setFormat] = useState('');
  const [language, setLanguage] = useState('');
  const [cta, setCta] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [output, setOutput] = useState<CreativeOutput | null>(null);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  // Load hypotheses and workspace on mount
  const loadData = useCallback(async () => {
    const supabase = createClient();
    const wsId = await getWorkspaceId(supabase);
    setWorkspaceId(wsId);

    if (!wsId) {
      setIsLoadingHypotheses(false);
      return;
    }

    const [hypoResult, countResult] = await Promise.all([
      supabase
        .from('hypotheses')
        .select('id, hook, sub_market, hypothesis_status')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false }),
      supabase
        .from('creative_assets')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', wsId),
    ]);

    if (!hypoResult.error && hypoResult.data) {
      setHypotheses(hypoResult.data as HypothesisItem[]);
    }
    setSavedCount(countResult.count ?? 0);
    setIsLoadingHypotheses(false);
  }, []);

  useEffect(() => {
    loadData();

    // Check if a hypothesis was passed from Discovery Engine via sessionStorage
    const stored = sessionStorage.getItem('selected_hypothesis');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; hook: string; sub_market: string | null };
        setSelectedHypothesis({ ...parsed, hypothesis_status: 'pending' });
        sessionStorage.removeItem('selected_hypothesis');
      } catch {
        // ignore parse errors
      }
    }
  }, [loadData]);

  const filteredHypotheses = hypotheses.filter(
    (h) =>
      h.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.sub_market ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!selectedHypothesis && !customBrief) return;
    setIsGenerating(true);
    setOutput(null);
    setSavedSuccessfully(false);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setOutput(MOCK_OUTPUT);
    setIsGenerating(false);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setOutput(null);
    setSavedSuccessfully(false);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setOutput(MOCK_OUTPUT);
    setIsGenerating(false);
  };

  const handleSaveToLibrary = async () => {
    if (!output || !workspaceId) return;
    setIsSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from('creative_assets').insert({
      workspace_id: workspaceId,
      hypothesis_id: selectedHypothesis?.id ?? null,
      hook: output.hook,
      script: output.script,
      caption: output.caption,
      visual_prompt: output.visualPrompt,
      production_notes: output.productionNotes,
      creative_type: creativeType || null,
      platform: platform || null,
      format: format || null,
      language: language || null,
      cta: cta || null,
    });

    if (!error) {
      setSavedSuccessfully(true);
      setSavedCount((prev) => prev + 1);
    }

    setIsSaving(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel: Hypothesis Selector */}
      <aside className="w-[300px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
            Select Hypothesis
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {isLoadingHypotheses
              ? 'Loading...'
              : `${hypotheses.length} available · ${savedCount} saved to library`}
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[var(--color-border)] shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search hypotheses..."
              className="pl-8 h-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Hypothesis List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {isLoadingHypotheses ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer h-16 w-full rounded-xl" />
            ))
          ) : filteredHypotheses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                {hypotheses.length === 0
                  ? 'No hypotheses yet. Generate some in Discovery first.'
                  : 'No matches found.'}
              </p>
            </div>
          ) : (
            filteredHypotheses.map((h) => {
              const status = STATUS_CONFIG[h.hypothesis_status];
              const isSelected = selectedHypothesis?.id === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => {
                    setSelectedHypothesis(h);
                    setCustomBrief('');
                  }}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 transition-all duration-150 flex flex-col gap-2',
                    isSelected
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                      : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-card-hover)]'
                  )}
                >
                  <p
                    className={cn(
                      'text-xs font-medium leading-snug',
                      isSelected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'
                    )}
                  >
                    {h.hook}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.sub_market && (
                      <Badge variant="secondary" className="text-[10px]">
                        {h.sub_market}
                      </Badge>
                    )}
                    <Badge variant={status.badgeVariant} className="text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-accent-light)] font-medium">
                      <Check className="w-3 h-3" />
                      Selected
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Custom Brief */}
        <div className="p-3 border-t border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Separator className="flex-1" />
            <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap font-medium uppercase tracking-wide">
              or from scratch
            </span>
            <Separator className="flex-1" />
          </div>
          <Input
            placeholder="Enter custom brief..."
            className="h-8 text-xs"
            value={customBrief}
            onChange={(e) => {
              setCustomBrief(e.target.value);
              setSelectedHypothesis(null);
            }}
          />
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Creative Configuration Bar */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-6 py-4 shrink-0">
          <div className="flex items-end gap-3 flex-wrap">
            {/* Creative Type */}
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <Label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide font-medium">
                Creative Type
              </Label>
              <Select value={creativeType} onValueChange={setCreativeType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ugc">UGC</SelectItem>
                  <SelectItem value="founder">Founder Video</SelectItem>
                  <SelectItem value="authority">Authority Ad</SelectItem>
                  <SelectItem value="problem">Problem-Aware</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="testimonial">Testimonial</SelectItem>
                  <SelectItem value="story">Story Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Platform */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide font-medium">
                Platform
              </Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Platform..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide font-medium">
                Format
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Format..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide font-medium">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Language..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hebrew">Hebrew</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <Label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide font-medium">
                CTA
              </Label>
              <Input
                placeholder='e.g. "Book a Call"'
                className="h-8 text-xs"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              className="h-8 px-5 text-xs font-semibold gradient-accent border-0 shadow-md shadow-[var(--color-accent)]/20 hover:brightness-110 ml-auto shrink-0"
              onClick={handleGenerate}
              disabled={isGenerating || (!selectedHypothesis && !customBrief)}
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1.5" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generate Creative
                </>
              )}
            </Button>
          </div>

          {/* Selected hypothesis indicator */}
          {selectedHypothesis && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <ChevronRight className="w-3 h-3 text-[var(--color-accent-light)]" />
              <span className="text-[var(--color-accent-light)] font-medium">Using:</span>
              <span className="truncate max-w-xl">{selectedHypothesis.hook}</span>
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Empty state */}
          {!output && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
                <Zap className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">No creative yet</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xs">
                  Select a hypothesis and configure your creative settings, then hit Generate
                </p>
              </div>
            </div>
          )}

          {/* Output Grid */}
          {(output || isGenerating) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <OutputCard
                  title="Script"
                  icon={FileText}
                  content={output?.script ?? ''}
                  large
                  isLoading={isGenerating}
                />
                <OutputCard
                  title="Hook"
                  icon={Zap}
                  content={output?.hook ?? ''}
                  isLoading={isGenerating}
                />
                <OutputCard
                  title="Caption"
                  icon={AlignLeft}
                  content={output?.caption ?? ''}
                  large
                  isLoading={isGenerating}
                />
                <OutputCard
                  title="Visual Prompt"
                  icon={Image}
                  content={output?.visualPrompt ?? ''}
                  large
                  isLoading={isGenerating}
                />
              </div>

              {/* Production Notes */}
              {isGenerating ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="shimmer w-32 h-4 rounded" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="shimmer w-full h-3 rounded" />
                    ))}
                  </CardContent>
                </Card>
              ) : output ? (
                <Card>
                  <CardHeader className="pb-3 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
                      <CardTitle className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Production Notes
                      </CardTitle>
                    </div>
                    <CopyButton
                      text={output.productionNotes.map((n) => `• ${n}`).join('\n')}
                    />
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-2">
                      {output.productionNotes.map((note, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              {/* Bottom Actions */}
              {output && !isGenerating && (
                <div className="flex items-center gap-3 pb-2">
                  <Button
                    className="gap-2"
                    onClick={handleSaveToLibrary}
                    disabled={isSaving || savedSuccessfully}
                  >
                    {isSaving ? (
                      <>
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Saving...
                      </>
                    ) : savedSuccessfully ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved to Library
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-4 h-4" />
                        Save to Library
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" className="gap-2">
                    <Trophy className="w-4 h-4" />
                    Send to Winner Tracker
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 ml-auto"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
