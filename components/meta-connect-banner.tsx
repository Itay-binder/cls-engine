'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MetaConnectBannerProps {
  /** If true, fills the whole screen (page-level gate). Otherwise renders as an inline card. */
  fullScreen?: boolean;
}

export function MetaConnectBanner({ fullScreen = false }: MetaConnectBannerProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = '/api/meta/connect';
  };

  const inner = (
    <div className="flex flex-col items-center text-center gap-6 max-w-sm mx-auto">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0081FB]/20 to-[#0081FB]/5 border border-[#0081FB]/20 flex items-center justify-center">
        <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
          <path d="M8 24.5C8 27.538 9.71 29.5 12.063 29.5C13.948 29.5 15.165 28.42 16.688 26.02L18.895 22.38L16.09 17.91C14.58 15.48 13.28 14.5 11.688 14.5C9.403 14.5 8 16.62 8 19.5V24.5Z" fill="#0081FB"/>
          <path d="M20.305 22.77L22.543 19.09C24.028 16.69 25.338 15.5 27.253 15.5C29.537 15.5 31 17.65 31 20.5V24.5C31 27.5 29.45 29.5 27.253 29.5C25.338 29.5 24.028 28.31 22.543 25.91L20.305 22.77Z" fill="#0081FB"/>
          <ellipse cx="20" cy="21.5" rx="3.5" ry="5.5" fill="#0081FB"/>
        </svg>
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[var(--color-text)]">Connect your Meta account</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Connect your Meta Ads account to see your real campaign data, detect winners, and push creatives directly to Facebook &amp; Instagram.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        <Button
          className="gap-2 gradient-accent border-0 w-full"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {connecting ? 'Redirecting to Facebook...' : 'Connect Meta Ads'}
        </Button>

        <Button asChild variant="outline" className="gap-2 w-full">
          <Link href="/settings?tab=integrations">
            <Settings className="w-4 h-4" />
            Configure manually in Settings
          </Link>
        </Button>
      </div>

      {/* Note */}
      <p className="text-[11px] text-[var(--color-text-muted)] flex items-start gap-1.5 text-left">
        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-[var(--color-text-muted)]" />
        We request read &amp; management access to sync your campaigns. You can disconnect at any time from Settings.
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
        <Card className="w-full max-w-sm border-[#0081FB]/20">
          <CardContent className="p-8">{inner}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border-[#0081FB]/20">
      <CardContent className="p-8">{inner}</CardContent>
    </Card>
  );
}
