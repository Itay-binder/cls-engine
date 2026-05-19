'use client';

// CLS Onboarding — Business Selector + 5 Questions
//
// Philosophy: CLS doesn't ask about "target audience" or "avatar".
// The market discovers that through testing. We ask about the business, not the customer.
// Questions focus on: what you sell, your offer+price, your goal, what's worked, your blocker.

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  Zap,
  SkipForward,
  Plus,
  Building2,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  placeholder: string;
  hint?: string;
  optional?: boolean;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
  questionId?: number;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  product_description: string | null;
  current_offer: string | null;
  market_notes: string | null;
  created_at: string;
}

type SubscriptionTier = 'free' | 'plus' | 'pro';

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  plus: 3,
  pro: 10,
};

// ─── Questions (5 total) ─────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'What do you sell?',
    placeholder: 'e.g., Online course on copywriting, SaaS for agencies, coaching for freelancers...',
    hint: 'Be specific — product, service, or offer type. The more precise, the better.',
  },
  {
    id: 2,
    text: "What's your current offer and price?",
    placeholder: 'e.g., €997 one-time course on X, €300/month group coaching, $5k done-for-you retainer...',
    hint: 'Pricing shapes every part of the funnel and scale strategy.',
  },
  {
    id: 3,
    text: "What's your main growth goal right now?",
    placeholder: 'e.g., More qualified leads, scale an existing funnel that works, hit 50 sales/month...',
    hint: 'Be specific. Vague goals produce vague hypotheses.',
  },
  {
    id: 4,
    text: "What's worked for you in marketing before?",
    placeholder: 'e.g., Referrals, Meta ads, organic IG, webinars — or skip if you\'re starting fresh...',
    hint: "Past wins are your fastest path forward — even partial ones count.",
    optional: true,
  },
  {
    id: 5,
    text: "What's your biggest growth blocker right now?",
    placeholder: 'e.g., High CAC, low conversion, no consistent lead flow, funnel leaks...',
    hint: "The obstacle that keeps showing up. This is where the engine starts.",
  },
];

// ─── Greeting per question ────────────────────────────────────────────────────

function getGreeting(questionId: number): string {
  const greetings: Record<number, string> = {
    1: "Let's build your Business Brain. First —",
    2: 'Good. Now tell me about the actual offer and pricing.',
    3: "Solid. What are you trying to achieve right now?",
    4: "Got it. Quick one — what's worked before?",
    5: "Almost done. Last question, and it matters most —",
  };
  return greetings[questionId] ?? QUESTIONS[questionId - 1]?.text ?? '';
}

// ─── Progress Panel ───────────────────────────────────────────────────────────

function ProgressPanel({
  currentQuestion,
  answers,
}: {
  currentQuestion: number;
  answers: string[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-lg shadow-[#7C3AED]/30">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)]">Business Brain</h1>
            <p className="text-xs text-[var(--color-text-muted)]">5-question setup</p>
          </div>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          5 questions. Under 3 minutes. The engine learns your business — every output is built for
          your specific context, not a generic persona.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
            Progress
          </span>
          <span className="text-sm font-semibold text-[var(--color-accent-light)]">
            {Math.min(currentQuestion, 5)} of 5
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] transition-all duration-700 ease-out"
            style={{ width: `${(Math.min(currentQuestion, 5) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Question list */}
      <div className="flex flex-col gap-1">
        {QUESTIONS.map((q, idx) => {
          const questionNumber = idx + 1;
          const isCompleted = answers[idx] !== undefined;
          const isCurrent = questionNumber === currentQuestion;
          const isPending = questionNumber > currentQuestion;

          return (
            <div
              key={q.id}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                isCurrent && 'bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20',
                isCompleted && !isCurrent && 'opacity-60',
                isPending && 'opacity-30'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                ) : isCurrent ? (
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/20" />
                ) : (
                  <Circle className="h-4 w-4 text-[var(--color-border)]" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p
                  className={cn(
                    'text-sm leading-snug',
                    isCurrent
                      ? 'font-medium text-[var(--color-text)]'
                      : 'text-[var(--color-text-secondary)]'
                  )}
                >
                  {q.text}
                </p>
                {q.optional && (
                  <span className="text-[10px] text-[var(--color-text-muted)]">Optional</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Sparkles className="h-3 w-3 text-[var(--color-accent-light)]" />
        <span>Answers power every AI output in the engine.</span>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message, isLatest }: { message: Message; isLatest: boolean }) {
  const isAI = message.role === 'ai';
  return (
    <div className={cn('flex w-full', isAI ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isAI
            ? 'rounded-tl-sm bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
            : 'rounded-tr-sm bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-[#7C3AED]/20',
          isLatest && 'animate-in fade-in slide-in-from-bottom-2 duration-300'
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ answers }: { answers: string[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-2xl shadow-[#7C3AED]/40">
          <Brain className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-success)] shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Business Brain Created</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          The engine now understands your business. Every hypothesis, creative, and experiment will
          be built on this foundation.
        </p>
      </div>

      <Card className="w-full max-w-lg text-left">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-[var(--color-warning)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Your Business Profile
              </span>
            </div>
            {QUESTIONS.map((q, idx) => (
              <div key={q.id} className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">{q.text}</span>
                <span className="text-sm text-[var(--color-text)] font-medium">
                  {answers[idx] || '—'}
                </span>
                {idx < QUESTIONS.length - 1 && (
                  <div className="mt-2 h-px bg-[var(--color-border-subtle)]" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="gap-2" onClick={() => router.push('/map')}>
        Build Creative Map
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Business Selector ────────────────────────────────────────────────────────

function BusinessSelector({
  businesses,
  activeId,
  tier,
  onActivate,
  onNewBusiness,
  loading,
}: {
  businesses: BusinessProfile[];
  activeId: string | null;
  tier: SubscriptionTier;
  onActivate: (id: string) => void;
  onNewBusiness: () => void;
  loading: boolean;
}) {
  const limit = TIER_LIMITS[tier];
  const atLimit = businesses.length >= limit;

  if (loading) {
    return (
      <div className="flex flex-col gap-3 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="shimmer h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 glass rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--color-accent-light)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">My Businesses</h2>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-border)] text-[var(--color-text-muted)]">
            {businesses.length}/{limit}
          </span>
        </div>

        {atLimit ? (
          <div className="group relative">
            <Button size="sm" disabled className="gap-1.5 text-xs opacity-50 cursor-not-allowed">
              <Lock className="h-3 w-3" />
              + New Business
            </Button>
          </div>
        ) : (
          <Button size="sm" className="gap-1.5 text-xs gradient-accent border-0 hover:brightness-110" onClick={onNewBusiness}>
            <Plus className="h-3 w-3" />
            New Business
          </Button>
        )}
      </div>

      {/* Business list */}
      <div className="flex flex-col gap-2">
        {businesses.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
            No businesses yet. Create your first one below.
          </p>
        ) : (
          businesses.map((b) => {
            const isActive = b.id === activeId;
            const createdDate = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return (
              <button
                key={b.id}
                onClick={() => onActivate(b.id)}
                className={cn(
                  'w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-200',
                  isActive
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-card-hover)]'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0 transition-colors',
                    isActive ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium truncate', isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]')}>
                      {b.business_name}
                    </p>
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-accent)] text-white font-medium shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  {b.product_description && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                      {b.product_description.slice(0, 60)}{b.product_description.length > 60 ? '…' : ''}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">Created {createdDate}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Upgrade card — shown when at limit */}
      {atLimit && (
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-dim)] p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-[var(--color-warning)]">Upgrade to add more businesses</p>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span>Free: 1</span>
            <span className="w-px h-3 bg-[var(--color-border)]" />
            <span>Plus: 3</span>
            <span className="w-px h-3 bg-[var(--color-border)]" />
            <span>Pro: 10</span>
          </div>
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs border-[var(--color-warning)]/40 text-[var(--color-warning)] hover:bg-[var(--color-warning-dim)] mt-1">
              View Plans
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── New Business Form ─────────────────────────────────────────────────────────

function NewBusinessForm({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (business: BusinessProfile) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Let's build your Business Brain. First —", questionId: 1 },
    { role: 'ai', text: QUESTIONS[0].text, questionId: 1 },
  ]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isCompleted) inputRef.current?.focus();
  }, [currentQuestion, isCompleted]);

  const saveAndComplete = async (finalAnswers: string[]) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const businessName = finalAnswers[0]?.split(/[,.\-–]/)[0]?.trim() ?? 'My Business';

      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          business_name: businessName,
          product_description: finalAnswers[0] ?? '',
          current_offer: finalAnswers[1] ?? '',
          market_notes: [
            `Goal: ${finalAnswers[2] ?? ''}`,
            `What worked: ${finalAnswers[3] ?? '—'}`,
            `Blocker: ${finalAnswers[4] ?? ''}`,
          ].join('\n'),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        // Set as active in user metadata
        await supabase.auth.updateUser({
          data: { active_business_id: data.id },
        });
        onComplete(data as BusinessProfile);
      }
    } catch (err) {
      console.error('Failed to save business profile:', err);
    } finally {
      setIsSaving(false);
      setIsCompleted(true);
    }
  };

  const handleContinue = async (skipped = false) => {
    const trimmed = skipped ? '' : inputValue.trim();
    if (!skipped && !trimmed) return;

    const answerValue = skipped ? '' : trimmed;
    const newAnswers = [...answers, answerValue];
    setAnswers(newAnswers);

    const userMessage: Message = {
      role: 'user',
      text: skipped ? '(skipped)' : trimmed,
    };
    const nextMessages: Message[] = [...messages, userMessage];

    if (currentQuestion < QUESTIONS.length) {
      const nextQ = QUESTIONS[currentQuestion];
      const greeting = getGreeting(currentQuestion + 1);
      nextMessages.push(
        { role: 'ai', text: greeting, questionId: currentQuestion + 1 },
        { role: 'ai', text: nextQ.text, questionId: currentQuestion + 1 }
      );
      setMessages(nextMessages);
      setCurrentQuestion((prev) => prev + 1);
      setInputValue('');
    } else {
      setMessages(nextMessages);
      await saveAndComplete(newAnswers);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContinue(false);
    }
  };

  const currentQ = QUESTIONS[currentQuestion - 1];

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-lg shadow-[#7C3AED]/30">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">Business Created!</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">It's now set as your active business.</p>
        </div>
        <Button onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to My Businesses
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to my businesses
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left: Progress panel */}
        <aside className="glass rounded-2xl p-6">
          <ProgressPanel currentQuestion={currentQuestion} answers={answers} />
        </aside>

        {/* Right: Chat interface */}
        <div className="flex flex-col gap-4">
          <Card className="glass flex-1 overflow-hidden">
            <CardContent className="flex h-[520px] flex-col gap-4 overflow-y-auto p-6 pt-6">
              {messages.map((msg, idx) => (
                <ChatBubble
                  key={idx}
                  message={msg}
                  isLatest={idx === messages.length - 1 || idx === messages.length - 2}
                />
              ))}
              <div ref={chatBottomRef} />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="flex flex-col gap-4 p-4">
              {currentQ?.hint && (
                <div className="flex items-start gap-2 rounded-lg bg-[var(--color-accent-dim)] px-3 py-2 border border-[var(--color-accent)]/10">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent-light)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">{currentQ.hint}</span>
                </div>
              )}

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentQ?.placeholder ?? 'Type your answer...'}
                rows={3}
                className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card-hover)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 transition-all duration-200"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Enter to continue · Shift+Enter for new line
                </span>
                <div className="flex items-center gap-2">
                  {currentQ?.optional && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-[var(--color-text-muted)]"
                      onClick={() => handleContinue(true)}
                      disabled={isSaving}
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                      Skip
                    </Button>
                  )}
                  <Button
                    onClick={() => handleContinue(false)}
                    disabled={!inputValue.trim() || isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : currentQuestion === QUESTIONS.length ? (
                      <>
                        Complete
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  // Load businesses and user info
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingBusinesses(false);
        return;
      }

      // Get tier from app_metadata
      const userTier = (user.app_metadata?.subscription_tier as SubscriptionTier | undefined) ?? 'free';
      setTier(userTier);

      // Get active business from user_metadata
      const activeBiz = user.user_metadata?.active_business_id ?? null;
      setActiveId(activeBiz);

      // Load all business profiles
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setBusinesses((data as BusinessProfile[]) ?? []);
      setLoadingBusinesses(false);
    };

    load();
  }, []);

  const handleActivate = async (id: string) => {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { active_business_id: id } });
    setActiveId(id);
  };

  const handleNewBusiness = () => {
    setShowNewForm(true);
  };

  const handleNewBusinessComplete = (business: BusinessProfile) => {
    setBusinesses((prev) => [business, ...prev]);
    setActiveId(business.id);
  };

  const handleBackFromForm = () => {
    setShowNewForm(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        {showNewForm ? (
          <NewBusinessForm onBack={handleBackFromForm} onComplete={handleNewBusinessComplete} />
        ) : (
          <>
            {/* Business Selector — always at the top */}
            <BusinessSelector
              businesses={businesses}
              activeId={activeId}
              tier={tier}
              onActivate={handleActivate}
              onNewBusiness={handleNewBusiness}
              loading={loadingBusinesses}
            />

            {/* If no businesses, show the form directly */}
            {!loadingBusinesses && businesses.length === 0 && (
              <NewBusinessForm onBack={() => {}} onComplete={handleNewBusinessComplete} />
            )}

            {/* If user has businesses but wants to see what the form looks like — show info */}
            {!loadingBusinesses && businesses.length > 0 && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-lg shadow-[#7C3AED]/30">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">Business Brain Active</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm">
                    Select a business above to activate it, or create a new one.
                    Every AI output will be tailored to your active business.
                  </p>
                </div>
                <Button
                  className="gap-2 gradient-accent border-0 hover:brightness-110"
                  onClick={handleNewBusiness}
                  disabled={businesses.length >= TIER_LIMITS[tier]}
                >
                  <Plus className="h-4 w-4" />
                  Add Another Business
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
