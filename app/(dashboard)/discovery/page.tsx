'use client';

import { useState } from 'react';
import {
  Compass,
  Sparkles,
  Shield,
  Flame,
  Scale,
  CheckCircle2,
  Clock,
  Trophy,
  XCircle,
  Filter,
  ArrowRight,
  Send,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'conservative' | 'balanced' | 'aggressive';
type HypothesisStatus = 'pending' | 'testing' | 'winner' | 'failed';

interface HypothesisCard {
  id: number;
  subMarket: string;
  hook: string;
  painPoint: string;
  angle: string;
  creativeType: 'UGC' | 'Founder' | 'Authority';
  status: HypothesisStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_HYPOTHESES: HypothesisCard[] = [
  { id: 1, subMarket: 'Fitness Coaches', hook: 'Why your clients quit after week 3 — and the 1 message that keeps them', painPoint: 'High client churn after initial excitement', angle: 'Retention', creativeType: 'Founder', status: 'pending' },
  { id: 2, subMarket: 'Online Courses', hook: 'The completion method that turned 12% into 74% — in 30 days', painPoint: 'Low course completion rates', angle: 'Social Proof', creativeType: 'Authority', status: 'testing' },
  { id: 3, subMarket: 'E-commerce', hook: 'Stop running ads until you fix this one checkout leak', painPoint: 'Cart abandonment at 70%+', angle: 'Problem-First', creativeType: 'Founder', status: 'pending' },
  { id: 4, subMarket: 'SaaS Founders', hook: 'We got 1,200 trial sign-ups in 48h without a single ad dollar', painPoint: 'High CAC with paid channels only', angle: 'Contrarian', creativeType: 'UGC', status: 'winner' },
  { id: 5, subMarket: 'Real Estate', hook: 'The DM script that books 3-4 calls a week from cold leads', painPoint: 'Low lead-to-call conversion', angle: 'Tactical', creativeType: 'Authority', status: 'pending' },
  { id: 6, subMarket: 'Service Business', hook: 'How a 2-line follow-up email tripled our close rate', painPoint: 'Leads disappear after first contact', angle: 'Story', creativeType: 'Founder', status: 'failed' },
  { id: 7, subMarket: 'Digital Agencies', hook: 'We fired 60% of our clients and revenue went up 40%', painPoint: 'Low-margin clients draining capacity', angle: 'Contrarian', creativeType: 'Founder', status: 'pending' },
  { id: 8, subMarket: 'Health & Wellness', hook: 'The morning protocol busy moms are using to lose weight without a gym', painPoint: 'No time for traditional fitness', angle: 'Lifestyle Fit', creativeType: 'UGC', status: 'testing' },
  { id: 9, subMarket: 'B2B Consulting', hook: 'Why your proposal is getting ghosted — and the fix that took 10 minutes', painPoint: 'Proposals not converting', angle: 'Diagnostic', creativeType: 'Authority', status: 'pending' },
  { id: 10, subMarket: 'Coaching Programs', hook: 'The onboarding call that turns new clients into 12-month retainers', painPoint: 'Short LTV on coaching clients', angle: 'Retention', creativeType: 'Founder', status: 'pending' },
  { id: 11, subMarket: 'E-learning', hook: '3 questions we ask before building any course — most creators skip all 3', painPoint: 'Courses that fail to sell', angle: 'Education', creativeType: 'Authority', status: 'winner' },
  { id: 12, subMarket: 'Local Business', hook: 'How we got 200 5-star reviews in 60 days — no incentives, no bots', painPoint: 'Low review volume hurts local SEO', angle: 'Process', creativeType: 'UGC', status: 'pending' },
  { id: 13, subMarket: 'SaaS', hook: 'The onboarding flow change that cut churn by 31% in one quarter', painPoint: 'High trial-to-paid churn', angle: 'Data-Driven', creativeType: 'Founder', status: 'testing' },
  { id: 14, subMarket: 'Freelancers', hook: 'From $3k months to $18k months — same skills, different positioning', painPoint: 'Stuck in commoditized pricing', angle: 'Transformation', creativeType: 'UGC', status: 'pending' },
  { id: 15, subMarket: 'Info Products', hook: 'The VSL framework that outperformed 7 years of a/b tests — in 2 weeks', painPoint: 'Declining VSL conversion rates', angle: 'Innovation', creativeType: 'Authority', status: 'pending' },
];

const STATUS_CONFIG: Record<HypothesisStatus, { label: string; badgeVariant: 'outline' | 'secondary' | 'default' | 'success' | 'warning' | 'danger'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', badgeVariant: 'outline', icon: Clock },
  testing: { label: 'Testing', badgeVariant: 'secondary', icon: Clock },
  winner: { label: 'Winner', badgeVariant: 'success', icon: Trophy },
  failed: { label: 'Failed', badgeVariant: 'danger', icon: XCircle },
};

const CREATIVE_TYPE_COLORS: Record<string, string> = {
  UGC: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)] border border-[var(--color-warning)]/20',
  Founder: 'bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] border border-[var(--color-accent)]/20',
  Authority: 'bg-[var(--color-secondary-dim)] text-[var(--color-secondary)] border border-[var(--color-secondary)]/20',
};

// ─── Shimmer Card ──────────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col gap-3">
      <div className="shimmer h-4 w-24 rounded-full" />
      <div className="shimmer h-5 w-full rounded" />
      <div className="shimmer h-4 w-3/4 rounded" />
      <div className="flex gap-2 mt-1">
        <div className="shimmer h-5 w-16 rounded-full" />
        <div className="shimmer h-5 w-20 rounded-full" />
      </div>
      <div className="shimmer h-7 w-full rounded-lg mt-1" />
    </div>
  );
}

// ─── Hypothesis Card ───────────────────────────────────────────────────────────

function HypothesisItem({
  h,
  onSend,
  onToggleTested,
}: {
  h: HypothesisCard;
  onSend: (h: HypothesisCard) => void;
  onToggleTested: (id: number) => void;
}) {
  const status = STATUS_CONFIG[h.status];
  const StatusIcon = status.icon;

  return (
    <Card className="flex flex-col gap-0 hover:bg-[var(--color-card-hover)] transition-colors">
      <CardContent className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide shrink-0">
            {h.subMarket}
          </Badge>
          <Badge variant={status.badgeVariant} className="text-[10px] flex items-center gap-1 shrink-0">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>

        <p className="text-sm font-semibold text-[var(--color-text)] leading-snug line-clamp-2">
          {h.hook}
        </p>

        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
          {h.painPoint}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--color-border)] text-[var(--color-text-secondary)]">
            {h.angle}
          </span>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', CREATIVE_TYPE_COLORS[h.creativeType])}>
            {h.creativeType}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7"
            onClick={() => onSend(h)}
          >
            <Send className="w-3 h-3 mr-1" />
            Send to Creative Machine
          </Button>
          <button
            onClick={() => onToggleTested(h.id)}
            title="Mark as tested"
            className={cn(
              'h-7 w-7 rounded-lg border border-[var(--color-border)] flex items-center justify-center transition-colors hover:border-[var(--color-success)] hover:bg-[var(--color-success-dim)] shrink-0',
              h.status === 'testing' && 'border-[var(--color-success)] bg-[var(--color-success-dim)]'
            )}
          >
            <CheckCircle2 className={cn('w-3.5 h-3.5', h.status === 'testing' ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]')} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const [marketType, setMarketType] = useState('');
  const [offerType, setOfferType] = useState('');
  const [language, setLanguage] = useState('');
  const [tone, setTone] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('balanced');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [hypotheses, setHypotheses] = useState<HypothesisCard[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const handleGenerate = () => {
    setIsGenerating(true);
    setHasResults(false);
    setTimeout(() => {
      setHypotheses(MOCK_HYPOTHESES);
      setIsGenerating(false);
      setHasResults(true);
    }, 2200);
  };

  const handleToggleTested = (id: number) => {
    setHypotheses(prev =>
      prev.map(h =>
        h.id === id
          ? { ...h, status: h.status === 'testing' ? 'pending' : 'testing' as HypothesisStatus }
          : h
      )
    );
  };

  const handleSend = (h: HypothesisCard) => {
    // In a real app, this would navigate to /creative with the hypothesis pre-selected
    alert(`Sending to Creative Machine: "${h.hook.slice(0, 60)}..."`);
  };

  const filteredHypotheses = hypotheses.filter(h => {
    if (activeTab === 'all') return true;
    return h.status === activeTab;
  });

  const sortedHypotheses = [...filteredHypotheses].sort((a, b) => {
    if (sortOrder === 'winners') return a.status === 'winner' ? -1 : 1;
    return a.id - b.id;
  });

  const counts = {
    all: hypotheses.length,
    pending: hypotheses.filter(h => h.status === 'pending').length,
    testing: hypotheses.filter(h => h.status === 'testing').length,
    winner: hypotheses.filter(h => h.status === 'winner').length,
    failed: hypotheses.filter(h => h.status === 'failed').length,
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left Panel ── */}
      <aside className="w-[300px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
            Experiment Parameters
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Configure your hypothesis generation
          </p>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-5">
          {/* Market Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[var(--color-text-secondary)] font-medium">Market Type</Label>
            <Select value={marketType} onValueChange={setMarketType}>
              <SelectTrigger>
                <SelectValue placeholder="Select market..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b2c">B2C</SelectItem>
                <SelectItem value="b2b">B2B</SelectItem>
                <SelectItem value="dtc">DTC</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Offer Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[var(--color-text-secondary)] font-medium">Offer Type</Label>
            <Select value={offerType} onValueChange={setOfferType}>
              <SelectTrigger>
                <SelectValue placeholder="Select offer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="coaching">Coaching</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[var(--color-text-secondary)] font-medium">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hebrew">Hebrew</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[var(--color-text-secondary)] font-medium">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder="Select tone..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="empathetic">Empathetic</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Risk Level */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-[var(--color-text-secondary)] font-medium">Risk Level</Label>
            <div className="flex flex-col gap-2">
              {/* Conservative */}
              <button
                onClick={() => setRiskLevel('conservative')}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150',
                  riskLevel === 'conservative'
                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary-dim)]'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-secondary)]/40'
                )}
              >
                <Shield className={cn('w-4 h-4 shrink-0', riskLevel === 'conservative' ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text-muted)]')} />
                <div>
                  <p className={cn('text-xs font-semibold', riskLevel === 'conservative' ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text)]')}>Conservative</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Proven angles, low risk</p>
                </div>
              </button>

              {/* Balanced */}
              <button
                onClick={() => setRiskLevel('balanced')}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150',
                  riskLevel === 'balanced'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent)]/40'
                )}
              >
                <Scale className={cn('w-4 h-4 shrink-0', riskLevel === 'balanced' ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-text-muted)]')} />
                <div>
                  <p className={cn('text-xs font-semibold', riskLevel === 'balanced' ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-text)]')}>Balanced</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Mix of safe and bold ideas</p>
                </div>
              </button>

              {/* Aggressive */}
              <button
                onClick={() => setRiskLevel('aggressive')}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150',
                  riskLevel === 'aggressive'
                    ? 'border-[var(--color-warning)] bg-[var(--color-warning-dim)]'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-warning)]/40'
                )}
              >
                <Flame className={cn('w-4 h-4 shrink-0', riskLevel === 'aggressive' ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]')} />
                <div>
                  <p className={cn('text-xs font-semibold', riskLevel === 'aggressive' ? 'text-[var(--color-warning)]' : 'text-[var(--color-text)]')}>Aggressive</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">High-risk, high-reward angles</p>
                </div>
              </button>
            </div>
          </div>

          {/* Context */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[var(--color-text-secondary)] font-medium">
              Additional Context <span className="text-[var(--color-text-muted)]">(optional)</span>
            </Label>
            <Textarea
              placeholder="e.g. focus on retention, targeting women 30-45, avoid price objections..."
              className="min-h-[80px] text-xs"
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>

          {/* Generate Button */}
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
                  Generate Hypotheses
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
              <Sparkles className="w-3 h-3 text-[var(--color-accent-light)]" />
              Powered by your Business Brain
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right Panel ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Empty State */}
        {!hasResults && !isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
              <Compass className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">No hypotheses yet</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xs">
                Configure parameters on the left and generate your first batch of experiment ideas
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] animate-spin" />
                <span className="text-sm font-medium text-[var(--color-text)]">Generating hypotheses...</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ShimmerCard key={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {hasResults && !isGenerating && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Results Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-semibold text-[var(--color-text)]">
                  <span className="text-[var(--color-accent-light)] font-bold text-base">{hypotheses.length}</span>
                  {' '}Hypotheses Generated
                </h2>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8">
                    {(['all', 'pending', 'testing', 'winner', 'failed'] as const).map(tab => (
                      <TabsTrigger key={tab} value={tab} className="text-xs px-2.5 py-1 capitalize h-6">
                        {tab === 'all' ? `All (${counts.all})` : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${counts[tab]})`}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <Filter className="w-3 h-3 mr-1.5 text-[var(--color-text-muted)]" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="winners">Winners First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4">
                {sortedHypotheses.map(h => (
                  <HypothesisItem
                    key={h.id}
                    h={h}
                    onSend={handleSend}
                    onToggleTested={handleToggleTested}
                  />
                ))}
              </div>
              {sortedHypotheses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-[var(--color-text-muted)] text-sm">No hypotheses match this filter</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
