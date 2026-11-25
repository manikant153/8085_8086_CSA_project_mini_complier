import React, { useCallback, useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import App from '../../App';
import { type ArchitectureId } from '../../data/landingData';
import { ArchitectureHistoryPage } from './ArchitectureHistoryPage';
import { LandingPage } from './LandingPage';
import { MemberDetailPage } from './MemberDetailPage';

type ShellView =
  | { kind: 'landing' }
  | { kind: 'arch'; archId: ArchitectureId }
  | { kind: 'member'; memberId: string }
  | { kind: 'studio' };

function parseHashToView(hash: string): ShellView {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (clean === 'studio') return { kind: 'studio' };
  if (clean === 'history/8085') return { kind: 'arch', archId: '8085' };
  if (clean === 'history/8086') return { kind: 'arch', archId: '8086' };
  if (clean.startsWith('team/')) {
    const memberId = clean.slice('team/'.length).trim();
    if (memberId) return { kind: 'member', memberId };
  }
  return { kind: 'landing' };
}

function viewToHash(view: ShellView): string {
  switch (view.kind) {
    case 'studio':
      return '#/studio';
    case 'arch':
      return `#/history/${view.archId}`;
    case 'member':
      return `#/team/${view.memberId}`;
    case 'landing':
    default:
      return '#/';
  }
}

export const StudioShell: React.FC = () => {
  const [view, setView] = useState<ShellView>(() => parseHashToView(window.location.hash));

  useEffect(() => {
    // Ensure initial URL has a valid hash entry so browser Back/Forward works cleanly
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }

    const handlePopState = () => {
      setView(parseHashToView(window.location.hash));
      window.scrollTo({ top: 0 });
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = useCallback((nextView: ShellView) => {
    const targetHash = viewToHash(nextView);
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
    setView(nextView);
    window.scrollTo({ top: 0, behavior: nextView.kind === 'landing' ? 'smooth' : 'auto' });
  }, []);

  const goLanding = useCallback(() => {
    navigateTo({ kind: 'landing' });
  }, [navigateTo]);

  const launchStudio = useCallback(() => {
    navigateTo({ kind: 'studio' });
  }, [navigateTo]);

  if (view.kind === 'landing') {
    return (
      <LandingPage
        onLaunchStudio={launchStudio}
        onOpenArchHistory={(archId) => navigateTo({ kind: 'arch', archId })}
        onOpenMember={(memberId) => navigateTo({ kind: 'member', memberId })}
      />
    );
  }

  if (view.kind === 'arch') {
    return (
      <ArchitectureHistoryPage
        archId={view.archId}
        onBackToOverview={goLanding}
        onSwitchArch={(archId) => navigateTo({ kind: 'arch', archId })}
        onLaunchStudio={launchStudio}
      />
    );
  }

  if (view.kind === 'member') {
    return (
      <MemberDetailPage
        memberId={view.memberId}
        onBackToOverview={goLanding}
        onSelectMember={(memberId) => navigateTo({ kind: 'member', memberId })}
        onLaunchStudio={launchStudio}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      <App />
      <button
        type="button"
        onClick={goLanding}
        title="Back to Project Overview"
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-transform hover:scale-105"
        style={{
          borderColor: 'var(--ss-border, #1e293b)',
          backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
          color: 'var(--ss-text, #e2e8f0)',
        }}
      >
        <Home className="h-3.5 w-3.5" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
        <span>Overview</span>
      </button>
    </div>
  );
};