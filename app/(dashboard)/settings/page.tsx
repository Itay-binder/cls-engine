'use client';

import { useState, useEffect } from 'react';
import {
  Settings2, Link2, CreditCard, Bot,
  CheckCircle2, XCircle, ChevronRight, Eye, EyeOff,
  Zap, RefreshCw, AlertCircle, Loader2, ShieldAlert,
} from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
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

  const [aiProvider, setAiProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [temperature, setTemperature] = useState(0.7);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = () => {
    setTestStatus('testing');
    setTimeout(() => setTestStatus(apiKey.length > 10 ? 'ok' : 'fail'), 1800);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage your workspace, integrations, and AI configuration.</p>
      </div>

      <Tabs defaultValue="general">
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
          <TabsTrigger value="ai" className="gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            AI Config
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {INTEGRATIONS.map((integration) =>
              integration.id === 'meta' ? (
                <MetaIntegrationCard key={integration.id} integration={integration} />
              ) : (
                <IntegrationCard key={integration.id} integration={integration} />
              )
            )}
          </div>
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

        {/* AI Config Tab */}
        <TabsContent value="ai">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure the AI provider powering your engine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Provider */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[var(--color-text-muted)]">AI Provider</Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[var(--color-text-muted)]">API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder={aiProvider === 'claude' ? 'sk-ant-...' : 'sk-proj-...'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)]">Stored encrypted. Never sent to third parties.</p>
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[var(--color-text-muted)]">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiProvider === 'claude' ? (
                      <>
                        <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6 (Recommended)</SelectItem>
                        <SelectItem value="claude-opus-4-5">Claude Opus 4.5</SelectItem>
                        <SelectItem value="claude-haiku-3-5">Claude Haiku 3.5 (Fast)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--color-text-muted)]">
                    Temperature
                    <span className="ml-1 text-[10px] text-[var(--color-text-muted)] normal-case font-normal">
                      (creativity level)
                    </span>
                  </Label>
                  <span className="text-xs font-medium text-[var(--color-text)]">{temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={temperature * 100}
                  onChange={(v) => setTemperature(parseFloat((v / 100).toFixed(2)))}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                  <span>Precise (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleTest}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                      Testing...
                    </>
                  ) : testStatus === 'ok' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      Connection OK
                    </>
                  ) : testStatus === 'fail' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                      Failed — check key
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSave}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
