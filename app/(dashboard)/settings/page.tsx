'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Settings2, Link2, CreditCard, Bot,
  CheckCircle2, XCircle, ChevronRight, Eye, EyeOff,
  Zap, RefreshCw, Loader2, ShieldAlert, Save, LogOut,
  Pencil, Trash2, Plus, Building2, AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMockMode } from '@/lib/mock-mode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type IntegrationStatus = 'connected' | 'disconnected' | 'coming-soon';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  accountName?: string;
  lastSync?: string;
  logo: React.ReactNode;
}

// ─── Logo Components ──────────────────────────────────────────────────────────
function MetaLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M8 24.5C8 27.538 9.71 29.5 12.063 29.5C13.948 29.5 15.165 28.42 16.688 26.02L18.895 22.38L16.09 17.91C14.58 15.48 13.28 14.5 11.688 14.5C9.403 14.5 8 16.62 8 19.5V24.5Z" fill="#0081FB"/>
      <path d="M16.09 17.91L14.84 15.83C13.71 13.97 12.43 13 11.17 13C8.96 13 7 15.35 7 19.5V24.5C7 27.8 8.7 30.5 11.688 30.5C13.73 30.5 15.13 29.29 16.85 26.64" stroke="#0081FB" strokeWidth="0"/>
      <path d="M20.305 22.77L22.543 19.09C24.028 16.69 25.338 15.5 27.253 15.5C29.537 15.5 31 17.65 31 20.5V24.5C31 27.5 29.45 29.5 27.253 29.5C25.338 29.5 24.028 28.31 22.543 25.91L20.305 22.77Z" fill="#0081FB"/>
      <ellipse cx="20" cy="21.5" rx="3.5" ry="5.5" fill="#0081FB"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M33.5 20.3c0-.9-.1-1.8-.2-2.7H20v5.1h7.6c-.3 1.7-1.4 3.1-2.9 4v3.4h4.7c2.8-2.5 4.1-6.2 4.1-9.8z" fill="#4285F4"/>
      <path d="M20 34c3.8 0 7-1.2 9.3-3.4l-4.7-3.4c-1.3.9-2.9 1.4-4.6 1.4-3.5 0-6.5-2.4-7.6-5.6H7.5v3.5C9.8 31.3 14.6 34 20 34z" fill="#34A853"/>
      <path d="M12.4 22.9c-.3-.9-.4-1.8-.4-2.9s.1-2 .4-2.9v-3.5H7.5C6.5 15.6 6 17.7 6 20s.5 4.4 1.5 6.4l4.9-3.5z" fill="#FBBC05"/>
      <path d="M20 13.6c2 0 3.7.7 5.1 2l3.8-3.8C26.9 9.5 23.7 8 20 8c-5.4 0-10.2 2.7-12.5 6.6l4.9 3.5c1.1-3.2 4.1-4.5 7.6-4.5z" fill="#EA4335"/>
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M28 14.8c-1.7-1.1-2.8-2.9-3.1-5h-4.1v14.5c0 1.8-1.5 3.2-3.3 3.2s-3.3-1.4-3.3-3.2 1.5-3.2 3.3-3.2c.3 0 .6.1.9.1V17c-.3 0-.6-.1-.9-.1-4.1 0-7.5 3.3-7.5 7.4s3.4 7.4 7.5 7.4 7.5-3.3 7.5-7.4v-7.3c1.5 1.1 3.3 1.7 5.1 1.7v-4c-1 0-1.9-.4-2.1-.9z" fill="#fff"/>
    </svg>
  );
}

function OpenAILogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <circle cx="20" cy="20" r="13" stroke="#10A37F" strokeWidth="2.5" fill="none"/>
      <path d="M14 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z" fill="#10A37F"/>
    </svg>
  );
}

function StripeLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="6" y="6" width="28" height="28" rx="5" fill="#635BFF"/>
      <path d="M19.2 15.2c0-1 .8-1.4 2.1-1.4 1.9 0 4.3.6 5.9 1.6V10c-2-0.8-3.9-1.1-5.9-1.1C17 8.9 13 10.8 13 15.5c0 7.3 10 6.2 10 9.3 0 1.2-1 1.6-2.4 1.6-2 0-4.7-.9-6.7-2v5.4c2.3 1 4.6 1.3 6.7 1.3 5.1 0 8.6-2.5 8.6-7.4-.1-7.8-10.2-6.5-10-8.5z" fill="white"/>
    </svg>
  );
}

function MakeLogo() {
  return (
    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6D6BE7] to-[#A855F7] flex items-center justify-center">
      <span className="text-white text-[9px] font-bold">M</span>
    </div>
  );
}

// ─── Meta Status Types ─────────────────────────────────────────────────────────
type MetaCheckState = 'loading' | 'connected' | 'error';

interface MetaStatus {
  state: MetaCheckState;
  accountName?: string;
  spend?: number;
  errorMsg?: string;
}

// ─── Meta Integration Card (live check) ───────────────────────────────────────
function MetaIntegrationCard({ integration }: { integration: Integration }) {
  const [meta, setMeta] = useState<MetaStatus>({ state: 'loading' });
  const [syncing, setSyncing] = useState(false);

  const checkConnection = async () => {
    setMeta({ state: 'loading' });
    try {
      const res = await fetch('/api/meta/insights');
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setMeta({ state: 'error', errorMsg: body.error ?? `HTTP ${res.status}` });
        return;
      }
      const data = (await res.json()) as {
        account_name?: string;
        spend?: number;
        error?: string;
      };
      if (data.error) {
        setMeta({ state: 'error', errorMsg: data.error });
        return;
      }
      setMeta({
        state: 'connected',
        accountName: data.account_name || 'LiftyGo',
        spend: data.spend,
      });
    } catch {
      setMeta({ state: 'error', errorMsg: 'Network error — could not reach Meta API' });
    }
  };

  useEffect(() => {
    checkConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await checkConnection();
    setSyncing(false);
  };

  return (
    <Card className="hover:border-[var(--color-accent)]/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            {integration.logo}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-sm text-[var(--color-text)]">{integration.name}</p>

              {meta.state === 'loading' && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Checking...
                </Badge>
              )}
              {meta.state === 'connected' && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Connected
                </Badge>
              )}
              {meta.state === 'error' && (
                <Badge variant="danger" className="gap-1">
                  <XCircle className="w-2.5 h-2.5" />
                  Token expired
                </Badge>
              )}
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mb-3">{integration.description}</p>

            {/* Connected details */}
            {meta.state === 'connected' && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Account: </span>
                  {meta.accountName}
                </p>
                {meta.spend !== undefined && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-muted)]">Last 30d spend: </span>
                    ${meta.spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}

            {/* Error details */}
            {meta.state === 'error' && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--color-danger-dim)]/20 border border-[var(--color-danger)]/20 space-y-1">
                <p className="text-xs text-[var(--color-danger)]">{meta.errorMsg}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {meta.state === 'connected' && (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:text-[var(--color-danger)]">
                    Disconnect
                  </Button>
                </>
              )}
              {meta.state === 'error' && (
                <Button size="sm" onClick={handleSync} disabled={syncing} className="gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Reconnecting...' : 'Reconnect'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Static Integrations Data ─────────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Connect your Meta Ads account to sync campaign data and automate creative experiments.',
    status: 'connected',
    logo: <MetaLogo />,
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Import Google Ads data for cross-channel attribution and spend analysis.',
    status: 'coming-soon',
    logo: <GoogleLogo />,
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Sync TikTok campaigns and creative performance metrics.',
    status: 'coming-soon',
    logo: <TikTokLogo />,
  },
  {
    id: 'openai',
    name: 'OpenAI / Claude AI',
    description: 'Power brainstorming, analysis, and hypothesis generation with your preferred AI provider.',
    status: 'connected',
    logo: <OpenAILogo />,
  },
  {
    id: 'stripe',
    name: 'Stripe Billing',
    description: 'Pull real LTV and revenue data directly from your Stripe account.',
    status: 'coming-soon',
    logo: <StripeLogo />,
  },
  {
    id: 'make',
    name: 'Make.com / Webhooks',
    description: 'Connect automation workflows and trigger webhooks on key events.',
    status: 'coming-soon',
    logo: <MakeLogo />,
  },
];

// ─── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({ integration }: { integration: Integration }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(integration.status === 'connected');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => setConnecting(false), 1500);
  };

  return (
    <Card className="hover:border-[var(--color-accent)]/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            {integration.logo}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-sm text-[var(--color-text)]">{integration.name}</p>
              {integration.status === 'connected' && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Connected
                </Badge>
              )}
              {integration.status === 'disconnected' && (
                <Badge variant="danger" className="gap-1">
                  <XCircle className="w-2.5 h-2.5" />
                  Disconnected
                </Badge>
              )}
              {integration.status === 'coming-soon' && (
                <Badge variant="outline">Coming Soon</Badge>
              )}
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mb-3">{integration.description}</p>

            {/* Connected details (non-meta integrations) */}
            {integration.status === 'connected' && integration.accountName && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Account: </span>{integration.accountName}
                </p>
                {integration.lastSync && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-muted)]">Last sync: </span>{integration.lastSync}
                  </p>
                )}
              </div>
            )}

            {/* AI toggle + key */}
            {integration.id === 'openai' && (
              <div className="mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--color-text-muted)]">Enable AI Features</Label>
                  <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                </div>
                {aiEnabled && (
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      defaultValue="sk-proj-••••••••••••••••••••••"
                      className="pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {integration.status === 'connected' && (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Now
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:text-[var(--color-danger)]">
                    Disconnect
                  </Button>
                </>
              )}
              {integration.status === 'disconnected' && (
                <Button size="sm" onClick={handleConnect} disabled={connecting}>
                  {connecting ? 'Connecting...' : 'Connect Account'}
                  {!connecting && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
                </Button>
              )}
              {integration.status === 'coming-soon' && (
                <Button size="sm" variant="outline" disabled>
                  Notify Me
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Real Integrations Tab ────────────────────────────────────────────────────

interface IntegrationState {
  anthropic_api_key_set: boolean;
  anthropic_api_key_preview: string | null;
  meta_access_token_set: boolean;
  meta_access_token_preview: string | null;
  meta_ad_account_id: string | null;
  meta_page_id: string | null;
}

function RealIntegrationsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<IntegrationState | null>(null);
  const [loading, setLoading] = useState(true);

  // Anthropic form
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');

  // Meta state
  const [disconnectingMeta, setDisconnectingMeta] = useState(false);
  const [testingMeta, setTestingMeta] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/user/integrations');
    if (res.ok) {
      const data = await res.json() as IntegrationState;
      setState(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveAI = async () => {
    setSavingAI(true);
    const res = await fetch('/api/user/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anthropic_api_key: anthropicKey || null }),
    });
    setSavingAI(false);
    if (res.ok) {
      setAnthropicKey('');
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2500);
      await load();
    }
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setAiTestResult('idle');
    try {
      const res = await fetch('/api/ai/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessProfile: { product_description: 'test', current_offer: null, price_range: null, market_notes: null }, count: 1 }),
      });
      setAiTestResult(res.ok ? 'ok' : 'fail');
    } catch {
      setAiTestResult('fail');
    }
    setTestingAI(false);
  };

  const handleDisconnectMeta = async () => {
    setDisconnectingMeta(true);
    await fetch('/api/meta/disconnect', { method: 'POST' });
    setDisconnectingMeta(false);
    setMetaTestResult('idle');
    await load();
  };

  const handleTestMeta = async () => {
    setTestingMeta(true);
    setMetaTestResult('idle');
    try {
      const res = await fetch('/api/meta/insights');
      setMetaTestResult(res.ok ? 'ok' : 'fail');
    } catch {
      setMetaTestResult('fail');
    }
    setTestingMeta(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        {[0,1].map((i) => <div key={i} className="shimmer h-64 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* ─── Anthropic / AI ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Anthropic (Claude AI)</CardTitle>
                {state?.anthropic_api_key_set ? (
                  <Badge variant="success" className="gap-1 text-[10px]"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Powers avatar generation, angle creation, and creative briefs.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.anthropic_api_key_set && (
            <div className="px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
              Current key: <span className="font-mono text-[var(--color-text)]">{state.anthropic_api_key_preview}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--color-text-muted)]">
              {state?.anthropic_api_key_set ? 'Replace API Key' : 'Add API Key'}
            </Label>
            <div className="relative">
              <Input
                type={showAnthropicKey ? 'text' : 'password'}
                placeholder="sk-ant-api03-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="pr-10 font-mono text-xs"
              />
              <button
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Get your key at{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-light)] hover:underline">
                console.anthropic.com
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5 gradient-accent border-0"
              onClick={handleSaveAI}
              disabled={!anthropicKey || savingAI}
            >
              {savingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : aiSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {aiSaved ? 'Saved!' : 'Save Key'}
            </Button>
            {state?.anthropic_api_key_set && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleTestAI} disabled={testingAI}>
                {testingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                  aiTestResult === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> :
                  aiTestResult === 'fail' ? <XCircle className="w-3.5 h-3.5 text-[#EF4444]" /> :
                  <Zap className="w-3.5 h-3.5" />}
                {testingAI ? 'Testing...' : aiTestResult === 'ok' ? 'Working!' : aiTestResult === 'fail' ? 'Failed' : 'Test'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Meta Ads ────────────────────────────────────────────────────── */}
      <Card className={state?.meta_access_token_set ? undefined : 'border-[#0081FB]/30'}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center">
              <MetaLogo />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Meta Ads</CardTitle>
                {state?.meta_access_token_set ? (
                  <Badge variant="success" className="gap-1 text-[10px]"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</Badge>
                ) : (
                  <Badge variant="danger" className="gap-1 text-[10px]"><XCircle className="w-2.5 h-2.5" /> Not connected</Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Sync campaign data, winners, and upload creatives to Meta.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {state?.meta_access_token_set ? (
            /* ── Connected state ── */
            <div className="space-y-3">
              <div className="px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                Token: <span className="font-mono text-[var(--color-text)]">{state.meta_access_token_preview}</span>
                {state.meta_ad_account_id && (
                  <span className="ml-3">Account: <span className="font-mono text-[var(--color-text)]">{state.meta_ad_account_id}</span></span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleTestMeta} disabled={testingMeta}>
                  {testingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                    metaTestResult === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> :
                    metaTestResult === 'fail' ? <XCircle className="w-3.5 h-3.5 text-[#EF4444]" /> :
                    <Zap className="w-3.5 h-3.5" />}
                  {testingMeta ? 'Testing...' : metaTestResult === 'ok' ? 'Connected!' : metaTestResult === 'fail' ? 'Failed' : 'Test connection'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                  onClick={handleDisconnectMeta}
                  disabled={disconnectingMeta}
                >
                  {disconnectingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            /* ── Connect with Facebook ── */
            <div className="space-y-3 pt-1">
              <p className="text-xs text-[var(--color-text-muted)]">
                Log in with Facebook to connect your Meta Ads account. You&apos;ll be redirected to Facebook and back.
              </p>
              <Button
                className="gap-2 w-full gradient-accent border-0"
                onClick={() => { window.location.href = '/api/meta/connect'; }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Continue with Facebook
              </Button>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                We request read &amp; management access to sync your campaigns.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Coming Soon ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'Google Ads', logo: <GoogleLogo />, desc: 'Cross-channel attribution and spend analysis.' },
          { name: 'TikTok Ads', logo: <TikTokLogo />, desc: 'Sync TikTok campaigns and creative metrics.' },
          { name: 'Stripe Billing', logo: <StripeLogo />, desc: 'Pull real LTV and revenue data from Stripe.' },
          { name: 'Make.com', logo: <MakeLogo />, desc: 'Connect automation workflows and webhooks.' },
        ].map((item) => (
          <Card key={item.name} className="opacity-60">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                {item.logo}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{item.name}</p>
                  <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Business Profile Manager ─────────────────────────────────────────────────

interface BizProfile {
  id: string;
  business_name: string | null;
  product_description: string | null;
  current_offer: string | null;
  market_notes: string | null;
}

function BusinessProfileManager() {
  const [profiles, setProfiles] = useState<BizProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<Omit<BizProfile, 'id'>>({
    business_name: '',
    product_description: '',
    current_offer: '',
    market_notes: '',
  });

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('business_profiles')
      .select('id, business_name, product_description, current_offer, market_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setProfiles((data ?? []) as BizProfile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (p: BizProfile) => {
    setEditingId(p.id);
    setEditForm({
      business_name: p.business_name ?? '',
      product_description: p.product_description ?? '',
      current_offer: p.current_offer ?? '',
      market_notes: p.market_notes ?? '',
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    await fetch(`/api/business/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    await fetch(`/api/business/${id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteConfirmId(null);
    await load();
  };

  if (loading) {
    return <div className="shimmer h-24 rounded-xl" />;
  }

  return (
    <div className="space-y-3">
      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center">
          <Building2 className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--color-text-muted)]">No business profiles yet.</p>
          <a href="/onboarding" className="text-xs text-[var(--color-accent-light)] hover:underline mt-1 inline-block">
            Create one →
          </a>
        </div>
      ) : (
        profiles.map((p) => (
          <div key={p.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            {editingId === p.id ? (
              /* Edit mode */
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Business Name</label>
                  <Input
                    value={editForm.business_name ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, business_name: e.target.value }))}
                    placeholder="Your business name"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Product / Service</label>
                  <textarea
                    value={editForm.product_description ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, product_description: e.target.value }))}
                    placeholder="What do you sell?"
                    rows={2}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Current Offer</label>
                  <Input
                    value={editForm.current_offer ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, current_offer: e.target.value }))}
                    placeholder="e.g. 30-day trial, $197 course..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Market Notes</label>
                  <textarea
                    value={editForm.market_notes ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, market_notes: e.target.value }))}
                    placeholder="Audience, competitors, positioning..."
                    rows={2}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5 gradient-accent border-0" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : deleteConfirmId === p.id ? (
              /* Delete confirm */
              <div className="p-4 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text)]">Delete &quot;{p.business_name ?? 'this business'}&quot;?</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">This can&apos;t be undone. Your creative maps using this profile won&apos;t be affected.</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting}
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {deleting ? 'Deleting...' : 'Delete'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-[var(--color-accent-light)] shrink-0" />
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                      {p.business_name ?? 'Unnamed Business'}
                    </p>
                  </div>
                  {p.product_description && (
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{p.product_description}</p>
                  )}
                  {p.current_offer && (
                    <p className="text-[11px] text-[var(--color-accent-light)] mt-1">Offer: {p.current_offer}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    onClick={() => startEdit(p)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-red-400"
                    onClick={() => setDeleteConfirmId(p.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <a
        href="/onboarding"
        className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition-colors pt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Add new business profile
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function SettingsPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') ?? 'general';

  const [businessName, setBusinessName] = useState('LiftyGo');
  const [workspaceName, setWorkspaceName] = useState('itay-workspace');
  const [saved, setSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { isMockMode, setMockMode, canToggle } = useMockMode();

  // Check admin role on mount
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.app_metadata?.role === 'admin') setIsAdmin(true);
      });
    });
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage your workspace, integrations, and AI configuration.</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic workspace configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-xs text-[var(--color-text-muted)]">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspaceName" className="text-xs text-[var(--color-text-muted)]">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="workspace-slug"
                />
                <p className="text-[10px] text-[var(--color-text-muted)]">Used in URLs and internal references. Lowercase, no spaces.</p>
              </div>
              <Separator />
              <Button onClick={handleSave} className="gap-2">
                {saved ? <CheckCircle2 className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Business Profiles */}
          <Card className="max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--color-accent-light)]" />
                <div>
                  <CardTitle>Business Profiles</CardTitle>
                  <CardDescription className="mt-0.5">Edit or remove the businesses you set up during onboarding.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BusinessProfileManager />
            </CardContent>
          </Card>

          {/* Admin Controls — only visible to admins */}
          {isAdmin && (
            <Card className="max-w-xl border-[#F59E0B]/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[#F59E0B]">
                  <ShieldAlert className="w-4 h-4" />
                  Admin Controls
                </CardTitle>
                <CardDescription>Visible to admins only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock mode warning banner */}
                {isMockMode && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-xs text-[#F59E0B]">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    Mock mode is active — screens show placeholder data
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[var(--color-text)]">Mock Mode</Label>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Show placeholder data instead of live data across all screens.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {isMockMode ? 'ON' : 'OFF'}
                    </span>
                    <Switch
                      checked={isMockMode}
                      onCheckedChange={(checked) => setMockMode(checked)}
                      disabled={!canToggle}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <RealIntegrationsTab />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
            {/* Current Plan */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/8 to-transparent pointer-events-none" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Plan</CardTitle>
                  <Badge variant="default" className="gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    CLS Pro
                  </Badge>
                </div>
                <CardDescription>Active until June 18, 2026</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-4xl font-black gradient-text">$97</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">per month</p>
                </div>
                <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
                  {['Unlimited hypotheses', '50 creatives / month', 'AI brainstorming', 'Meta Ads integration', 'Winner detection'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Separator />
                <Button variant="outline" className="w-full">Manage Subscription</Button>
              </CardContent>
            </Card>

            {/* Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>Resets on June 1, 2026</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: 'Hypotheses Generated', current: 34, max: 100, color: '#7C3AED' },
                  { label: 'Creatives Analyzed', current: 12, max: 50, color: '#38BDF8' },
                  { label: 'AI Brainstorms', current: 8, max: 30, color: '#22C55E' },
                ].map((usage) => (
                  <div key={usage.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--color-text)]">{usage.label}</p>
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        <span style={{ color: usage.color }}>{usage.current}</span>
                        <span className="text-[var(--color-text-muted)]"> / {usage.max}</span>
                      </p>
                    </div>
                    <Progress value={(usage.current / usage.max) * 100} />
                  </div>
                ))}

                <div className="pt-2">
                  <Button size="lg" className="w-full gap-2">
                    <Zap className="w-4 h-4" />
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-background)] p-6"><div className="shimmer h-32 rounded-xl max-w-xl" /></div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
