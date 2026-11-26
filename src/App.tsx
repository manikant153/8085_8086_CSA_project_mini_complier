import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, Cpu } from 'lucide-react';
import { CycleTimingDiagram } from './features/architecture/CycleTimingDiagram';
import { CpuBlockDiagram } from './features/architecture/CpuBlockDiagram';
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
      'Write 8085 or 8086 assembly instructions, search opcodes (Ctrl+F), jump to lines (Ctrl+G), or load presets.',
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
  const assembly = useSimulatorStore((s) => s.assembly);
  const assembly8086 = useSimulatorStore((s) => s.assembly8086);

  const compiledRows =
    (architecture === '8085' ? assembly?.rows.length : assembly8086?.rows.length) ?? 6;
  const isLongCode = compiledRows > 14;
  const editorHeightStyle = isLongCode ? `${compiledRows * 26 + 96}px` : 'calc(100vh - 235px)';
  const compilerHeightStyle = isLongCode ? `${compiledRows * 38 + 96}px` : 'calc(100vh - 235px)';

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
      className="flex h-screen w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#eef1f5', color: '#1f2328' }}
    >
      {/* Fixed Top Controls & Stepper Navbar */}
      <div className="shrink-0">
        <TopTelemetryBar
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onOpenThemeSelector={() => {}}
          onGoHome={onGoHome}
        />

        <nav className="border-b border-black/[0.06] bg-[#f7f8fa]/95 px-3 py-1.5 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-center">
            <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-black/[0.06] bg-[#eef1f5] p-1 sm:w-auto">
              {STUDIO_PAGES.map((page) => {
                const active = page.id === currentPanel;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => goPanel(page.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-[-0.01em] transition-all ${
                      active
                        ? 'bg-[#0071e3] text-white shadow-sm'
                        : 'text-[#5c6370] hover:bg-white/75 hover:text-[#1f2328]'
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
      </div>

      {/* Smoothly Scrollable Workspace Below Fixed Header */}
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-between gap-2.5 overflow-y-auto scroll-smooth px-4 py-3 sm:px-6">
        <div className="space-y-2.5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-lg font-bold tracking-[-0.02em] text-[#1f2328] sm:text-xl">
                {pageMeta.title}
              </h1>
              <p className="text-xs leading-relaxed text-[#5c6370]">{pageMeta.subtitle}</p>
            </div>

            {currentPanel === 'architecture' && (
              <div className="inline-flex shrink-0 self-start rounded-full border border-black/[0.08] bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setArchViewMode('2d')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    archViewMode === '2d'
                      ? 'bg-[#1f2328] text-white shadow-xs'
                      : 'text-[#5c6370] hover:text-[#1f2328]'
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>2D Bus &amp; Timing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setArchViewMode('3d')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    archViewMode === '3d'
                      ? 'bg-[#0071e3] text-white shadow-xs'
                      : 'text-[#5c6370] hover:text-[#1f2328]'
                  }`}
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>3D Spatial Chip</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Panel */}
          <div className="w-full">
            <div
              className={currentPanel === 'editor' ? 'w-full' : 'hidden'}
              style={currentPanel === 'editor' ? { height: editorHeightStyle } : undefined}
            >
              <CodeEditor />
            </div>

            <div
              className={currentPanel === 'compiler' ? 'w-full' : 'hidden'}
              style={currentPanel === 'compiler' ? { height: compilerHeightStyle } : undefined}
            >
              <MachineCodeTable />
            </div>

            <div className={currentPanel === 'registers' ? 'w-full' : 'hidden'}>
              <RegisterMatrix />
            </div>

            <div className={currentPanel === 'flags' ? 'w-full' : 'hidden'}>
              <FlagMatrix />
            </div>

            <div className={currentPanel === 'architecture' ? 'space-y-2.5' : 'hidden'}>
              <div className={archViewMode === '2d' ? 'space-y-2.5' : 'hidden'}>
                <div className="mx-auto max-w-[680px]">
                  <CpuBlockDiagram />
                </div>
                <CycleTimingDiagram />
              </div>
              {currentPanel === 'architecture' && archViewMode === '3d' && (
                <Chip3DExplorer archId={architecture} />
              )}
            </div>

            <div className={currentPanel === 'memory' ? 'w-full' : 'hidden'}>
              <MemoryHexGrid />
            </div>

            <div className={currentPanel === 'io' ? 'w-full' : 'hidden'}>
              <TrainerKitPanel />
            </div>
          </div>
        </div>

        {/* Sequential Prev / Next Pipeline Stepper */}
        <div className="flex shrink-0 items-center justify-between pt-1 pb-1">
          {prevPage ? (
            <button
              type="button"
              onClick={() => goPanel(prevPage.id)}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-1.5 text-xs font-semibold text-[#1f2328] shadow-sm transition hover:-translate-x-0.5 hover:bg-[#f7f8fa]"
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
              className="inline-flex items-center gap-2 rounded-full bg-[#1f2328] px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:translate-x-0.5 hover:bg-black"
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
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0077ed]"
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
    </div>
  );
}

export default App;