'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Sparkles, CheckCircle2, Circle, ArrowRight, Loader2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  placeholder: string;
  hint?: string;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
  questionId?: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'What do you sell?',
    placeholder: 'e.g., Online course, SaaS product, coaching program...',
    hint: 'Be specific — the more precise, the better the AI can help.',
  },
  {
    id: 2,
    text: 'What transformation do you create for your customers?',
    placeholder: 'e.g., From overwhelmed freelancer to 6-figure agency owner...',
    hint: 'Before → After. This is the core of your marketing.',
  },
  {
    id: 3,
    text: 'What problem do you solve?',
    placeholder: 'e.g., Business owners waste hours on manual lead follow-up...',
    hint: 'The pain they feel before finding you.',
  },
  {
    id: 4,
    text: 'What is your current offer?',
    placeholder: 'e.g., 8-week group program, 1:1 consulting retainer...',
    hint: 'How is it structured? What do customers actually get?',
  },
  {
    id: 5,
    text: 'What price range? (e.g., $47, $497, $2,000+)',
    placeholder: 'e.g., $997 one-time or $297/month...',
    hint: 'Pricing shapes every part of the funnel strategy.',
  },
  {
    id: 6,
    text: 'What marketing has worked before?',
    placeholder: 'e.g., Referrals, Meta ads, organic Instagram, email...',
    hint: 'Even partial wins are data points.',
  },
  {
    id: 7,
    text: 'What has failed or underperformed?',
    placeholder: 'e.g., Cold outreach, YouTube ads, Google PPC...',
    hint: "Failures are market intelligence — don't skip this.",
  },
  {
    id: 8,
    text: 'What is your growth goal for the next 90 days?',
    placeholder: 'e.g., 10 new clients, $50k MRR, 500 leads...',
    hint: 'Be specific. Vague goals produce vague strategies.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(questionId: number, answer?: string): string {
  const greetings: Record<number, string> = {
    1: "Let's build your Business Brain. First —",
    2: 'Good. Now tell me about the outcome you deliver.',
    3: 'Every strong offer starts with a clear problem. Tell me —',
    4: "Got it. Now let's look at what you're actually selling.",
    5: 'Pricing determines funnel architecture. What range are you in?',
    6: "Past wins are your fastest path forward. What's worked?",
    7: "Knowing what doesn't work saves time and money. Be honest —",
    8: "Last one. Make it specific — vague goals produce vague results.",
  };
  return greetings[questionId] ?? QUESTIONS[questionId - 1]?.text ?? '';
}

// ─── Components ──────────────────────────────────────────────────────────────

function ProgressPanel({
  currentQuestion,
  answers,
}: {
  currentQuestion: number;
  answers: string[];
}) {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-lg shadow-[#7C3AED]/30">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)]">Business Brain</h1>
            <p className="text-xs text-[var(--color-text-muted)]">AI Onboarding Interview</p>
          </div>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          8 questions. Under 5 minutes. The engine learns your business — so every output is built
          for your specific context.
        </p>
      </div>

      {/* Progress counter */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
            Progress
          </span>
          <span className="text-sm font-semibold text-[var(--color-accent-light)]">
            {Math.min(currentQuestion, 8)} of 8
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] transition-all duration-700 ease-out"
            style={{ width: `${(Math.min(currentQuestion, 8) / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Question list */}
      <div className="flex flex-col gap-1">
        {QUESTIONS.map((q, idx) => {
          const questionNumber = idx + 1;
          const isCompleted = answers[idx] !== undefined && answers[idx] !== '';
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
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/20 pulse-glow" />
                ) : (
                  <Circle className="h-4 w-4 text-[var(--color-border)]" />
                )}
              </div>
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
            </div>
          );
        })}
      </div>

      {/* Footer label */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Sparkles className="h-3 w-3 text-[var(--color-accent-light)]" />
        <span>Answers are saved to your Business Brain and power all AI outputs.</span>
      </div>
    </div>
  );
}

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

function SuccessState({ answers }: { answers: string[] }) {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-2xl shadow-[#7C3AED]/40">
          <Brain className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-success)] shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Business Brain Created</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          The engine now understands your business. Every hypothesis, creative, and experiment will
          be built on this foundation.
        </p>
      </div>

      {/* Summary card */}
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

      <Button size="lg" className="gap-2" onClick={() => (window.location.href = '/dashboard')}>
        Go to Mission Control
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: "Let's build your Business Brain. First —",
      questionId: 1,
    },
    {
      role: 'ai',
      text: QUESTIONS[0].text,
      questionId: 1,
    },
  ]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on question change
  useEffect(() => {
    if (!isCompleted) inputRef.current?.focus();
  }, [currentQuestion, isCompleted]);

  const handleContinue = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newAnswers = [...answers, trimmed];
    setAnswers(newAnswers);

    // Add user message
    const userMessage: Message = { role: 'user', text: trimmed };
    const nextMessages: Message[] = [...messages, userMessage];

    if (currentQuestion < QUESTIONS.length) {
      // Add next AI message
      const nextQ = QUESTIONS[currentQuestion]; // currentQuestion is 1-indexed, array is 0-indexed
      const greeting = getGreeting(currentQuestion + 1);
      nextMessages.push(
        { role: 'ai', text: greeting, questionId: currentQuestion + 1 },
        { role: 'ai', text: nextQ.text, questionId: currentQuestion + 1 }
      );
      setMessages(nextMessages);
      setCurrentQuestion((prev) => prev + 1);
      setInputValue('');
    } else {
      // Final answer — complete
      setMessages(nextMessages);
      setIsSaving(true);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const profileData = QUESTIONS.reduce<Record<string, string>>((acc, q, idx) => {
          const key = q.text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_|_$)/g, '');
          acc[key] = newAnswers[idx] ?? '';
          return acc;
        }, {});

        await supabase.from('business_profiles').upsert({
          user_id: user?.id ?? 'anonymous',
          ...profileData,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to save business profile:', err);
      } finally {
        setIsSaving(false);
        setIsCompleted(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContinue();
    }
  };

  const currentQ = QUESTIONS[currentQuestion - 1];

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        {isCompleted ? (
          /* ── Completion state (full width) ── */
          <SuccessState answers={answers} />
        ) : (
          /* ── Two-column interview layout ── */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
            {/* Left: Progress panel */}
            <aside className="glass rounded-2xl p-6">
              <ProgressPanel currentQuestion={currentQuestion} answers={answers} />
            </aside>

            {/* Right: Chat interface */}
            <div className="flex flex-col gap-4">
              {/* Chat history */}
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

              {/* Input area */}
              <Card className="glass">
                <CardContent className="flex flex-col gap-4 p-4">
                  {/* Current question hint */}
                  {currentQ?.hint && (
                    <div className="flex items-start gap-2 rounded-lg bg-[var(--color-accent-dim)] px-3 py-2 border border-[var(--color-accent)]/10">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent-light)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">{currentQ.hint}</span>
                    </div>
                  )}

                  {/* Text input */}
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentQ?.placeholder ?? 'Type your answer...'}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card-hover)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 transition-all duration-200"
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Enter to continue · Shift+Enter for new line
                    </span>
                    <Button
                      onClick={handleContinue}
                      disabled={!inputValue.trim() || isSaving}
                      size="md"
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
