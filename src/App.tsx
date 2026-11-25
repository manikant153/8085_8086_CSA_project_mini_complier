import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, Cpu } from 'lucide-react';
import { CycleTimingDiagram } from './features/architecture/CycleTimingDiagram';
import { CpuBlockDiagram } from './features/architecture/CpuBlockDiagram';
import { FloatingAiAssistant } from './features/assistant/FloatingAiAssistant';
import { CommandPalette } from './features/command-palette/CommandPalette';
import { CodeEditor } from './features/editor/CodeEditor';
import { MachineCodeTable } from './features/editor/MachineCodeTable';
import { TopTelemetryBar } from './features/editor/TopTelemetryBar';
import { Chip3DExplorer } from './features/landing/Chip3DExplorer';
import { TrainerKitPanel } from './features/peripherals/TrainerKitPanel';
import { FlagMatrix } from './features/telemetry/FlagMatrix';
import { MemoryHexGrid } from './features/telemetry/MemoryHexGrid';
import { RegisterMatrix } from './features/telemetry/RegisterMatrix';
import { useSimulatorStore } from './store/useSimulatorStore';

export type StudioPanelId =
  | 'editor'
  | 'compiler'
  | 'registers'
  | 'flags'
  | 'architecture'
  | 'memory'
  | 'io';

export const STUDIO_PAGES: {
  id: StudioPanelId;
  num: string;
  navLabel: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'editor',
    num: '01',
    navLabel: 'Editor',
    title: '01 · Assembly Source Editor',
    subtitle:
      'Write 8085 or 8086 assembly instructions, search opcodes (Ctrl+F), jump to lines (Ctrl+G), or load syllabus presets.',
  },
  {
    id: 'compiler',
    num: '02',
    navLabel: 'Mini Compiler',
    title: '02 · Two-Pass Mini Compiler Output',
    subtitle:
      'Translates your assembly into 1-byte, 2-byte, and 3-byte hexadecimal machine code with symbol addresses and T-states.',
  },
  {
    id: 'registers',
    num: '03',
    navLabel: 'Registers',
    title: '03 · CPU Register Array',
    subtitle:
      'Inspect live 8-bit/16-bit registers (A, B–L, SP, PC or AX–DX, SI, DI, IP) as each compiled instruction executes.',
  },
  {
    id: 'flags',
    num: '04',
    navLabel: 'PSW Flags',
    title: '04 · Program Status Word (PSW) Flags',
    subtitle:
      'Track Sign (S), Zero (Z), Auxiliary Carry (AC), Parity (P), and Carry (CY) flip-flops updated by the ALU.',
  },
  {
    id: 'architecture',
    num: '05',
    navLabel: 'Architecture & 3D',
    title: '05 · Microarchitecture, Bus Timing & 3D Die',
    subtitle:
      'Switch between the live 2D internal bus & T-state cycle diagram and the interactive 3D spatial chip model.',
  },
  {
    id: 'memory',
    num: '06',
    navLabel: 'Memory',
    title: '06 · 64KB Memory Hex Matrix',
    subtitle:
      'Inspect Little-Endian machine code bytes and program data across 256-byte RAM pages.',
  },
  {
    id: 'io',
    num: '07',
    navLabel: 'I/O Ports',
    title: '07 · Trainer Kit & Peripheral I/O Ports',
    subtitle:
      'Toggle 8-bit hardware input switches (IN) and observe latched output LEDs (OUT) just like a physical lab kit.',
  },
];

interface AppProps {
  activePanel?: StudioPanelId;
  onSelectPanel?: (panel: StudioPanelId) => void;
  onGoHome?: () => void;
}

export function App({ activePanel = 'editor', onSelectPanel, onGoHome }: AppProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [localPanel, setLocalPanel] = useState<StudioPanelId>(activePanel);
  const [archViewMode, setArchViewMode] = useState<'2d' | '3d'>('2d');
  const architecture = useSimulatorStore((s) => s.architecture);

  const currentPanel = onSelectPanel ? activePanel : localPanel;
  const goPanel = (panel: StudioPanelId) => {
    if (onSelectPanel) onSelectPanel(panel);
    else setLocalPanel(panel);
  };

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

  const currentIndex = STUDIO_PAGES.findIndex((p) => p.id === currentPanel);
  const pageMeta = STUDIO_PAGES[currentIndex] ?? STUDIO_PAGES[0];
  const prevPage = currentIndex > 0 ? STUDIO_PAGES[currentIndex - 1] : null;
  const nextPage =
    currentIndex < STUDIO_PAGES.length - 1 ? STUDIO_PAGES[currentIndex + 1] : null;

  return (
    <div
      className="flex min-h-screen w-full flex-col overflow-x-hidden"
      style={{ backgroundColor: '#f5f5f7', color: '#1d1d1f' }}
    >
      {/* Top Bar + Clickable Top-Left Brand Hitbox to Return Home */}
      <div className="relative">
        <TopTelemetryBar
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onOpenThemeSelector={() => {}}
        />
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            title="Return to Landing Page"
            aria-label="Return to Landing Page"
            className="hidden lg:block absolute top-1.5 left-2.5 z-30 h-10 w-52 cursor-pointer rounded-xl bg-transparent transition hover:bg-black/[0.04]"
          />
        )}
      </div>

      {/* Enhanced Apple Segmented Stepper Navbar */}
      <nav className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 px-3 py-2.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-center">
          <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-black/[0.06] bg-[#f5f5f7] p-1 shadow-inner sm:w-auto">
            {STUDIO_PAGES.map((page) => {
              const active = page.id === currentPanel;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => goPanel(page.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-[-0.01em] transition-all ${
                    active
                      ? 'bg-[#0071e3] text-white shadow-sm'
                      : 'text-[#6e6e73] hover:bg-white/70 hover:text-[#1d1d1f]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      active ? 'text-white/90' : 'text-[#0071e3]'
                    }`}
                  >
                    {page.num}
                  </span>
                  <span>{page.navLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Dedicated Single-Panel Workspace (Kept mounted so cursor/line/scroll state never resets) */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 pb-20 sm:px-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#1d1d1f] sm:text-[28px]">
              {pageMeta.title}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-[#6e6e73] sm:text-sm">
              {pageMeta.subtitle}
            </p>
          </div>

          {currentPanel === 'architecture' && (
            <div className="inline-flex shrink-0 self-start rounded-full border border-black/[0.08] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setArchViewMode('2d')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  archViewMode === '2d'
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>2D Bus &amp; Timing</span>
              </button>
              <button
                type="button"
                onClick={() => setArchViewMode('3d')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  archViewMode === '3d'
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                <span>3D Spatial Chip</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Routed Panel Container */}
        <div className="min-h-[480px] w-full flex-1 rounded-3xl border border-black/[0.06] bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-5">
          <div className={currentPanel === 'editor' ? 'h-[540px] w-full' : 'hidden'}>
            <CodeEditor />
          </div>

          <div className={currentPanel === 'compiler' ? 'h-[540px] w-full' : 'hidden'}>
            <MachineCodeTable />
          </div>

          <div className={currentPanel === 'registers' ? 'w-full' : 'hidden'}>
            <RegisterMatrix />
          </div>

          <div className={currentPanel === 'flags' ? 'w-full' : 'hidden'}>
            <FlagMatrix />
          </div>

          <div className={currentPanel === 'architecture' ? 'space-y-4' : 'hidden'}>
            <div className={archViewMode === '2d' ? 'space-y-4' : 'hidden'}>
              <CpuBlockDiagram />
              <CycleTimingDiagram />
            </div>
            {currentPanel === 'architecture' && archViewMode === '3d' && (
              <Chip3DExplorer archId={architecture} />
            )}
          </div>

          <div className={currentPanel === 'memory' ? 'min-h-[480px] w-full' : 'hidden'}>
            <MemoryHexGrid />
          </div>

          <div className={currentPanel === 'io' ? 'w-full' : 'hidden'}>
            <TrainerKitPanel />
          </div>
        </div>

        {/* Sequential Prev / Next Pipeline Stepper */}
        <div className="flex items-center justify-between pt-2">
          {prevPage ? (
            <button
              type="button"
              onClick={() => goPanel(prevPage.id)}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-[#1d1d1f] shadow-sm transition hover:-translate-x-0.5 hover:bg-[#f0f0f3]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>
                {prevPage.num} · {prevPage.navLabel}
              </span>
            </button>
          ) : (
            <div />
          )}

          {nextPage ? (
            <button
              type="button"
              onClick={() => goPanel(nextPage.id)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:translate-x-0.5 hover:bg-black"
            >
              <span>
                Next: {nextPage.num} · {nextPage.navLabel}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goPanel('editor')}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0077ed]"
            >
              <span>Back to 01 · Editor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </main>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenThemeSelector={() => {}}
      />
      <FloatingAiAssistant />
    </div>
  );
}

export default App;