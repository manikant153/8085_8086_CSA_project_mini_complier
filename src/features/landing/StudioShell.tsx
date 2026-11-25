import React, { useCallback, useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import App, { type StudioPanelId } from '../../App';
import { type ArchitectureId } from '../../data/landingData';
import { ArchitectureHistoryPage } from './ArchitectureHistoryPage';
import { LandingPage } from './LandingPage';
import { MemberDetailPage } from './MemberDetailPage';

type ShellView =
  | { kind: 'landing' }
  | { kind: 'arch'; archId: ArchitectureId }
  | { kind: 'member'; memberId: string }
  | { kind: 'studio'; panel: StudioPanelId };

const VALID_PANELS: StudioPanelId[] = [
  'editor',
  'compiler',
  'registers',
  'flags',
  'architecture',
  'memory',
  'io',
];

function parseHashToView(hash: string): ShellView {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (clean === 'studio' || clean === 'studio/') {
    return { kind: 'studio', panel: 'editor' };
  }
  if (clean.startsWith('studio/')) {
    const panel = clean.slice('studio/'.length).trim() as StudioPanelId;
    if (VALID_PANELS.includes(panel)) {
      return { kind: 'studio', panel };
    }
    return { kind: 'studio', panel: 'editor' };
  }
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
      return `#/studio/${view.panel}`;
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

  const launchStudio = useCallback(
    (panel: StudioPanelId = 'editor') => {
      navigateTo({ kind: 'studio', panel });
    },
    [navigateTo]
  );

  if (view.kind === 'landing') {
    return (
      <LandingPage
        onLaunchStudio={() => launchStudio('editor')}
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
        onLaunchStudio={() => launchStudio('editor')}
      />
    );
  }

  if (view.kind === 'member') {
    return (
      <MemberDetailPage
        memberId={view.memberId}
        onBackToOverview={goLanding}
        onSelectMember={(memberId) => navigateTo({ kind: 'member', memberId })}
        onLaunchStudio={() => launchStudio('editor')}
      />
    );
  }

  return (
    <div className="studio-apple-shell relative min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <App
        activePanel={view.panel}
        onSelectPanel={(panel) => navigateTo({ kind: 'studio', panel })}
        onGoHome={goLanding}
      />

      {/* Bottom-Left Overview Pill */}
      <button
        type="button"
        onClick={goLanding}
        title="Back to Landing Overview"
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-md backdrop-blur-md transition-transform hover:scale-105"
      >
        <Home className="h-3.5 w-3.5 text-[#0071e3]" />
        <span>Overview</span>
      </button>
    </div>
  );
};