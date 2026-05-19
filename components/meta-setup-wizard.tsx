'use client';

import { useState } from 'react';
import {
  ExternalLink, ChevronRight, Loader2, CheckCircle2,
  XCircle, Eye, EyeOff, ChevronDown, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Meta Business Manager — System Users page (deep link)
const BM_TOKEN_URL =
  'https://business.facebook.com/settings/system-users';

interface AdAccount {
  id: string;
  name: string;
  status: string;
  currency: string;
}

interface StepIndicatorProps {
  step: number;
  current: number;
  label: string;
}

function StepIndicator({ step, current, label }: StepIndicatorProps) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
          done
            ? 'bg-[#22C55E] text-white'
            : active
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
        )}
      >
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step}
      </div>
      <span
        className={cn(
          'text-xs font-medium',
          active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface MetaSetupWizardProps {
  onComplete: () => void;
}

export function MetaSetupWizard({ onComplete }: MetaSetupWizardProps) {
  const [step, setStep] = useState(1);

  // Step 2 state
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<AdAccount[] | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Step 3 state
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFetchAccounts = async () => {
    if (!token.trim()) return;
    setLoadingAccounts(true);
    setTokenError(null);
    setAccounts(null);
    setSelectedAccount(null);

    try {
      const res = await fetch(
        `/api/meta/ad-accounts?token=${encodeURIComponent(token.trim())}`
      );
      const data = await res.json() as { accounts?: AdAccount[]; error?: string };
      if (!res.ok || data.error) {
        setTokenError(data.error ?? 'Invalid token. Make sure you copied the full token.');
        setLoadingAccounts(false);
        return;
      }
      setAccounts(data.accounts ?? []);
      if ((data.accounts ?? []).length === 1) {
        setSelectedAccount(data.accounts![0]);
      }
      setStep(3);
    } catch {
      setTokenError('Network error. Try again.');
    }
    setLoadingAccounts(false);
  };

  const handleSave = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    setSaveError(null);

    const res = await fetch('/api/user/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_access_token: token.trim(),
        meta_ad_account_id: selectedAccount.id,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setSaveError(body.error ?? 'Save failed. Try again.');
      return;
    }

    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-3">
        <StepIndicator step={1} current={step} label="Open Meta" />
        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
        <StepIndicator step={2} current={step} label="Paste token" />
        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
        <StepIndicator step={3} current={step} label="Select account" />
      </div>

      {/* ─── Step 1 ───────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-3">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Generate an access token in Meta Business Manager
            </p>
            <ol className="space-y-2 text-xs text-[var(--color-text-muted)] list-decimal list-inside">
              <li>Click the button below to open Meta Business Manager</li>
              <li>Go to <strong className="text-[var(--color-text)]">System Users</strong> → select or create a system user</li>
              <li>Click <strong className="text-[var(--color-text)]">Generate New Token</strong></li>
              <li>Select your app, check <strong className="text-[var(--color-text)]">ads_read</strong> and <strong className="text-[var(--color-text)]">ads_management</strong></li>
              <li>Copy the generated token and come back here</li>
            </ol>
          </div>

          <Button
            className="gap-2 w-full"
            onClick={() => {
              window.open(BM_TOKEN_URL, '_blank', 'noopener,noreferrer');
              setStep(2);
            }}
          >
            Open Meta Business Manager
            <ExternalLink className="w-4 h-4" />
          </Button>

          <button
            className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline w-full text-center transition-colors"
            onClick={() => setStep(2)}
          >
            I already have a token — skip to step 2
          </button>
        </div>
      )}

      {/* ─── Step 2 ───────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--color-text-muted)]">
              Paste your access token
            </Label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="EAANx..."
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenError(null);
                }}
                className="pr-10 font-mono text-xs"
                autoFocus
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                type="button"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              System User tokens never expire. Regular user tokens expire in ~60 days.
            </p>

            {tokenError && (
              <div className="flex items-start gap-1.5 text-xs text-[var(--color-danger)]">
                <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {tokenError}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              size="sm"
              className="gap-1.5 gradient-accent border-0 flex-1"
              disabled={!token.trim() || loadingAccounts}
              onClick={handleFetchAccounts}
            >
              {loadingAccounts ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding your accounts...</>
              ) : (
                <>Find my ad accounts <ChevronRight className="w-3.5 h-3.5" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3 ───────────────────────────────────────────────────────── */}
      {step === 3 && accounts !== null && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--color-text-muted)]">
              Select your ad account
            </Label>

            {accounts.length === 0 ? (
              <div className="rounded-lg border border-[var(--color-border)] p-4 text-center space-y-2">
                <p className="text-sm text-[var(--color-text-muted)]">
                  No ad accounts found for this token.
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Make sure the System User has access to at least one ad account.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => { setStep(2); setAccounts(null); }}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try a different token
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc)}
                    className={cn(
                      'flex items-center justify-between w-full rounded-xl border px-4 py-3 text-left transition-all',
                      selectedAccount?.id === acc.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
                        : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-background)]'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{acc.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">{acc.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)]">{acc.currency}</span>
                      <Badge
                        variant={acc.status === 'active' ? 'success' : 'outline'}
                        className="text-[10px]"
                      >
                        {acc.status}
                      </Badge>
                      {selectedAccount?.id === acc.id && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {saveError && (
            <div className="flex items-start gap-1.5 text-xs text-[var(--color-danger)]">
              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {saveError}
            </div>
          )}

          {accounts.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep(2); setSelectedAccount(null); }}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="gap-1.5 gradient-accent border-0 flex-1"
                disabled={!selectedAccount || saving}
                onClick={handleSave}
              >
                {saving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Connect {selectedAccount?.name ?? 'account'}</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
