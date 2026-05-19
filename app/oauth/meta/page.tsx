'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdAccount {
  id: string;
  name: string;
  status: string;
  currency: string;
}

type Phase = 'loading' | 'pick' | 'saving' | 'error';

export default function MetaOAuthCallbackPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selected, setSelected] = useState<AdAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.search);
      const fbError = params.get('error_description') ?? params.get('error');
      setErrorMsg(fbError ?? 'No access token received from Facebook.');
      setPhase('error');
      return;
    }

    const hashParams = new URLSearchParams(hash.slice(1));
    const fbToken = hashParams.get('access_token');
    if (!fbToken) {
      setErrorMsg('Invalid OAuth response from Facebook.');
      setPhase('error');
      return;
    }

    setToken(fbToken);
    window.history.replaceState(null, '', '/oauth/meta');

    fetch(`/api/meta/ad-accounts?token=${encodeURIComponent(fbToken)}`)
      .then((r) => r.json())
      .then((data: { accounts?: AdAccount[]; error?: string }) => {
        if (data.error) {
          setErrorMsg(data.error);
          setPhase('error');
          return;
        }
        const list = data.accounts ?? [];
        setAccounts(list);
        if (list.length === 1) setSelected(list[0]);
        setPhase('pick');
      })
      .catch(() => {
        setErrorMsg('Network error. Please try again.');
        setPhase('error');
      });
  }, []);

  const handleSave = async () => {
    if (!token || !selected) return;
    setPhase('saving');

    const res = await fetch('/api/user/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_access_token: token,
        meta_ad_account_id: selected.id,
      }),
    });

    if (res.ok) {
      router.replace('/settings?tab=integrations');
    } else {
      const body = (await res.json()) as { error?: string };
      setErrorMsg(body.error ?? 'Save failed. Please try again.');
      setPhase('error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0081FB]/20 to-[#0081FB]/5 border border-[#0081FB]/20 flex items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
              <path d="M8 24.5C8 27.538 9.71 29.5 12.063 29.5C13.948 29.5 15.165 28.42 16.688 26.02L18.895 22.38L16.09 17.91C14.58 15.48 13.28 14.5 11.688 14.5C9.403 14.5 8 16.62 8 19.5V24.5Z" fill="#0081FB"/>
              <path d="M20.305 22.77L22.543 19.09C24.028 16.69 25.338 15.5 27.253 15.5C29.537 15.5 31 17.65 31 20.5V24.5C31 27.5 29.45 29.5 27.253 29.5C25.338 29.5 24.028 28.31 22.543 25.91L20.305 22.77Z" fill="#0081FB"/>
              <ellipse cx="20" cy="21.5" rx="3.5" ry="5.5" fill="#0081FB"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">Connect Meta Ads</h1>
        </div>

        {/* Loading */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-text-muted)]">Loading your ad accounts…</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[var(--color-danger)]">
                <XCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">Connection failed</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{errorMsg}</p>
            </div>
            <Button
              className="w-full gradient-accent border-0"
              onClick={() => { window.location.href = '/api/meta/connect'; }}
            >
              Try again
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[var(--color-text-muted)] text-xs"
              onClick={() => router.replace('/settings?tab=integrations')}
            >
              Back to Settings
            </Button>
          </div>
        )}

        {/* Account picker */}
        {(phase === 'pick' || phase === 'saving') && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">Select your ad account</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Choose the account CLS Engine will connect to.
              </p>
            </div>

            {accounts.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)]">
                No ad accounts found for this Facebook user. Make sure the account has access to at least one Meta ad account.
              </div>
            ) : (
              <div className="grid gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelected(acc)}
                    disabled={phase === 'saving'}
                    className={cn(
                      'flex items-center justify-between w-full rounded-xl border px-4 py-3 text-left transition-all',
                      selected?.id === acc.id
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
                      {selected?.id === acc.id && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {accounts.length > 0 && (
              <Button
                className="gap-2 w-full gradient-accent border-0"
                disabled={!selected || phase === 'saving'}
                onClick={handleSave}
              >
                {phase === 'saving' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Connect {selected?.name ?? 'account'}</>
                )}
              </Button>
            )}

            {accounts.length === 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { window.location.href = '/api/meta/connect'; }}
              >
                Try a different account
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full text-xs text-[var(--color-text-muted)]"
              disabled={phase === 'saving'}
              onClick={() => router.replace('/settings?tab=integrations')}
            >
              Cancel
            </Button>
          </div>
        )}

        {phase === 'pick' && (
          <p className="text-[11px] text-[var(--color-text-muted)] text-center leading-relaxed">
            This token may expire. If your data stops loading, reconnect from Settings.
          </p>
        )}
      </div>
    </div>
  );
}
