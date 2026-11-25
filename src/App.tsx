import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { CycleTimingDiagram } from './features/architecture/CycleTimingDiagram';
import { CpuBlockDiagram } from './features/architecture/CpuBlockDiagram';
import { FloatingAiAssistant } from './features/assistant/FloatingAiAssistant';
import { CommandPalette } from './features/command-palette/CommandPalette';
import { CodeEditor } from './features/editor/CodeEditor';
import { MachineCodeTable } from './features/editor/MachineCodeTable';
import { TopTelemetryBar } from './features/editor/TopTelemetryBar';
import { TrainerKitPanel } from './features/peripherals/TrainerKitPanel';
import { FlagMatrix } from './features/telemetry/FlagMatrix';
import { MemoryHexGrid } from './features/telemetry/MemoryHexGrid';
import { RegisterMatrix } from './features/telemetry/RegisterMatrix';
import { ThemeSelectorModal } from './features/theme/ThemeSelectorModal';

type MobileTab = 'all' | 'editor' | 'cpu' | 'memory';

export function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('all');
  const [editorSplitPct, setEditorSplitPct] = useState(58);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const leftColRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingSplit || !leftColRef.current) return;
      const rect = leftColRef.current.getBoundingClientRect();
      if (rect.height <= 0) return;
      const rawPct = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedPct = Math.min(82, Math.max(20, rawPct));
      setEditorSplitPct(clampedPct);
    },
    [isDraggingSplit]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit, handleMouseMove, handleMouseUp]);

  const showEditor = mobileTab === 'all' || mobileTab === 'editor';
  const showCpu = mobileTab === 'all' || mobileTab === 'cpu';
  const showMemory = mobileTab === 'all' || mobileTab === 'memory';

  return (
    <div
      className="flex min-h-screen w-full flex-col overflow-x-hidden lg:h-screen lg:overflow-hidden"
      style={{ backgroundColor: 'var(--ss-bg-app)', color: 'var(--ss-text-primary)' }}
    >
      <TopTelemetryBar
        onOpenCommandPalette={() => setPaletteOpen(true)}
        onOpenThemeSelector={() => setThemeModalOpen(true)}
      />

      {/* Mobile / Tablet View Filter (< lg) */}
      <div
        className="flex items-center gap-1.5 border-b px-3 py-2 lg:hidden"
        style={{
          backgroundColor: 'var(--ss-bg-panel)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        {(
          [
            { id: 'all', label: 'All Panels' },
            { id: 'editor', label: 'Editor & Code' },
            { id: 'cpu', label: 'CPU & Bus' },
            { id: 'memory', label: 'Memory & I/O' },
          ] as { id: MobileTab; label: string }[]
        ).map((tab) => {
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className="flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition"
              style={{
                backgroundColor: active ? 'var(--ss-accent-soft)' : 'var(--ss-bg-panel-alt)',
                borderColor: active ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
                color: active ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3 p-2.5 sm:p-3 lg:grid-cols-12 lg:overflow-hidden">
        {/* Left Column: Dynamically Resizable Editor & Machine Code Split */}
        <section
          ref={leftColRef}
          className={`${showEditor ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col lg:col-span-5 lg:h-full`}
        >
          <div
            style={{ '--editor-split': `${editorSplitPct}%` } as CSSProperties}
            className="h-[340px] min-w-0 shrink-0 sm:h-[380px] lg:h-[var(--editor-split)] lg:min-h-0"
          >
            <CodeEditor />
          </div>

          {/* Draggable Horizontal Splitter */}
          <div
            role="separator"
            aria-orientation="horizontal"
            title="Drag to resize Editor & Machine Code panels (Double-click to reset)"
            onMouseDown={() => setIsDraggingSplit(true)}
            onDoubleClick={() => setEditorSplitPct(58)}
            className="group hidden h-3 shrink-0 cursor-row-resize items-center justify-center lg:flex"
          >
            <div
              className={`h-1 rounded-full transition-all ${
                isDraggingSplit ? 'w-28' : 'w-16 group-hover:w-24'
              }`}
              style={{
                backgroundColor: isDraggingSplit ? 'var(--ss-accent)' : 'var(--ss-border-strong)',
                boxShadow: isDraggingSplit ? '0 0 10px var(--ss-accent-glow)' : undefined,
              }}
            />
          </div>

          <div className="mt-3 h-[280px] min-w-0 sm:h-[320px] lg:mt-0 lg:h-auto lg:min-h-0 lg:flex-1">
            <MachineCodeTable />
          </div>
        </section>

        {/* Right Column: Independently Scrollable Silicon Telemetry Cockpit */}
        <section
          className={`${showCpu || showMemory ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col gap-3 lg:col-span-7 lg:h-full lg:overflow-y-auto lg:pr-1`}
        >
          <div className={`${showCpu ? 'grid' : 'hidden lg:grid'} min-w-0 shrink-0 grid-cols-1 gap-3 xl:grid-cols-12`}>
            <div className="min-w-0 xl:col-span-7">
              <RegisterMatrix />
            </div>
            <div className="min-w-0 xl:col-span-5">
              <FlagMatrix />
            </div>
          </div>

          <div className={`${showCpu ? 'block' : 'hidden lg:block'} min-w-0 shrink-0`}>
            <CpuBlockDiagram />
          </div>

          <div className={`${showCpu ? 'block' : 'hidden lg:block'} min-w-0 shrink-0`}>
            <CycleTimingDiagram />
          </div>

          <div className={`${showMemory ? 'block' : 'hidden lg:block'} min-h-[280px] min-w-0 shrink-0`}>
            <MemoryHexGrid />
          </div>

          <div className={`${showMemory ? 'block' : 'hidden lg:block'} min-w-0 shrink-0 pb-1`}>
            <TrainerKitPanel />
          </div>
        </section>
      </main>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenThemeSelector={() => setThemeModalOpen(true)}
      />
      <ThemeSelectorModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
      <FloatingAiAssistant />
    </div>
  );
}

export default App;