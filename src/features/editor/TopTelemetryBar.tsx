import React from 'react';
import {
  Command,
  Cpu,
  Download,
  FastForward,
  History,
  Palette,
  Pause,
  Play,
  RotateCcw,
  StepBack,
  StepForward,
  Wrench,
} from 'lucide-react';
import { SYLLABUS_PRESETS } from '../../data/syllabusPresets';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface TopTelemetryBarProps {
  onOpenCommandPalette: () => void;
  onOpenThemeSelector: () => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  onOpenCommandPalette,
  onOpenThemeSelector,
}) => {
  const {
    architecture,
    setArchitecture,
    activePresetId,
    loadPreset,
    assembleCode,
    stepForward,
    stepBackward,
    jumpToStep,
    runProgram,
    pauseProgram,
    resetCpu,
    isRunning,
    cpu,
    cpu8086,
    assembly,
    assembly8086,
    timing,
    clockMHz,
    setClockMHz,
    activeTheme,
    revision,
  } = useSimulatorStore();

  void revision;
  const is8085 = architecture === '8085';
  const snapshots = is8085 ? cpu.history.getAll() : cpu8086.getSnapshots();
  const cursor = is8085 ? cpu.history.getCursor() : cpu8086.getCursor();
  const canStepBack = is8085 ? cpu.history.canStepBack() : cpu8086.canStepBack();
  const isHaltedAndAtTip = is8085
    ? cpu.halted && !cpu.history.canStepForward()
    : cpu8086.halted && !cpu8086.canStepForward();

  const archPresets = SYLLABUS_PRESETS.filter((p) => p.arch === architecture);

  const exportIntelHex = () => {
    const segs = is8085
      ? assembly?.success
        ? assembly.segments
        : null
      : assembly8086?.success
        ? assembly8086.segments
        : null;
    if (!segs) return;
    const lines: string[] = [];
    for (const seg of segs) {
      for (let i = 0; i < seg.bytes.length; i += 16) {
        const chunk = seg.bytes.slice(i, i + 16);
        const addr = (seg.startAddress + i) & 0xffff;
        const len = chunk.length;
        const addrHi = (addr >> 8) & 0xff;
        const addrLo = addr & 0xff;
        let sum = len + addrHi + addrLo;
        const dataHex = chunk
          .map((b) => {
            sum += b;
            return b.toString(16).toUpperCase().padStart(2, '0');
          })
          .join('');
        const checksum = ((~sum + 1) & 0xff).toString(16).toUpperCase().padStart(2, '0');
        lines.push(
          `:${len.toString(16).toUpperCase().padStart(2, '0')}${addr
            .toString(16)
            .toUpperCase()
            .padStart(4, '0')}00${dataHex}${checksum}`
        );
      }
    }
    lines.push(':00000001FF');
    downloadTextFile(`program_${architecture}.hex`, lines.join('\n'));
  };

  const exportListing = () => {
    const rows = is8085 ? assembly?.rows : assembly8086?.rows;
    if (!rows) return;
    const header = 'ADDR  | BYTES       | T  | SOURCE\n' + '-'.repeat(55);
    const body = rows.map((r) => {
      const addr = r.address.toString(16).toUpperCase().padStart(4, '0') + 'H';
      const bytes = r.bytes
        .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ')
        .padEnd(11, ' ');
      const t = String(r.tStates).padStart(2, ' ');
      return `${addr} | ${bytes} | ${t} | ${r.raw}`;
    });
    downloadTextFile(`program_${architecture}.lst`, [header, ...body].join('\n'));
  };

  return (
    <header
      className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2.5 border-b px-3 py-2.5 backdrop-blur-md sm:px-4"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      {/* Brand + Smooth 8-Bit / 16-Bit Architecture Selector + Preset Picker */}
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto">
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300"
            style={{
              backgroundColor: 'var(--ss-accent-soft)',
              borderColor: 'var(--ss-accent)',
              color: 'var(--ss-accent)',
              boxShadow: '0 0 15px var(--ss-accent-glow)',
            }}
          >
            <Cpu className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1
              className="whitespace-nowrap text-xs font-bold tracking-wide transition-all duration-200 sm:text-sm"
              style={{ color: 'var(--ss-text-primary)' }}
            >
              {architecture} <span style={{ color: 'var(--ss-accent)' }}>SILICON STUDIO</span>
            </h1>
            <p
              className="hidden whitespace-nowrap text-[10px] font-medium uppercase tracking-widest sm:block"
              style={{ color: 'var(--ss-text-muted)' }}
            >
              {is8085 ? '8-Bit Microarchitecture Lab' : '16-Bit x86 Microarchitecture Lab'}
            </p>
          </div>
        </div>

        {/* Smooth 8-bit / 16-bit Segmented Toggle */}
        <div
          role="group"
          aria-label="Processor Architecture Selector"
          className="relative grid grid-cols-2 items-center rounded-lg border p-0.5"
          style={{
            backgroundColor: 'var(--ss-bg-input)',
            borderColor: 'var(--ss-border-strong)',
          }}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md transition-transform duration-300 ease-out ${
              is8085 ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{
              backgroundColor: 'var(--ss-accent-soft)',
              boxShadow: 'inset 0 0 0 1px var(--ss-accent)',
            }}
          />
          <button
            type="button"
            onClick={() => setArchitecture('8085')}
            className="relative z-10 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200"
            style={{ color: is8085 ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)' }}
            title="8-bit — Intel 8085"
          >
            8-bit · 8085
          </button>
          <button
            type="button"
            onClick={() => setArchitecture('8086')}
            className="relative z-10 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200"
            style={{ color: !is8085 ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)' }}
            title="16-bit — Intel 8086"
          >
            16-bit · 8086
          </button>
        </div>

        <select
          value={activePresetId}
          onChange={(e) => loadPreset(e.target.value)}
          className="min-w-0 flex-1 truncate rounded-lg border px-2 py-1.5 text-xs font-medium outline-none transition sm:max-w-[220px] sm:flex-initial"
          style={{
            backgroundColor: 'var(--ss-bg-input)',
            borderColor: 'var(--ss-border-strong)',
            color: 'var(--ss-text-primary)',
          }}
          title={`Load ${architecture} Preset`}
        >
          {archPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.category}: {p.title}
            </option>
          ))}
        </select>

        <button
          onClick={onOpenCommandPalette}
          className="hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition hover:opacity-90 md:flex"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
            color: 'var(--ss-text-secondary)',
          }}
          title="Open Instruction Reference & Commands (Ctrl+K)"
        >
          <Command className="h-3.5 w-3.5" style={{ color: 'var(--ss-accent)' }} />
          <span>Commands</span>
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: 'var(--ss-bg-elevated)',
              color: 'var(--ss-text-secondary)',
            }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Execution Controls */}
      <div
        className="flex w-full min-w-0 flex-wrap items-center justify-between gap-1 rounded-xl border p-1 sm:w-auto sm:justify-start"
        style={{
          backgroundColor: 'var(--ss-bg-panel-alt)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <button
          onClick={() => assembleCode()}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-90 sm:px-3"
          style={{
            backgroundColor: 'var(--ss-accent-soft)',
            color: 'var(--ss-accent-text)',
          }}
          title={`Assemble ${architecture} Source Code`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Assemble</span>
        </button>

        <div className="hidden h-4 w-px sm:block" style={{ backgroundColor: 'var(--ss-border-subtle)' }} />

        <button
          onClick={stepBackward}
          disabled={!canStepBack}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          style={{ color: 'var(--ss-warning)' }}
          title="Time-Travel: Step Backward"
        >
          <StepBack className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={stepForward}
          disabled={isHaltedAndAtTip}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          style={{ color: 'var(--ss-success)' }}
          title="Execute Single Instruction"
        >
          <StepForward className="h-3.5 w-3.5" />
          <span>Step</span>
        </button>

        {!isRunning ? (
          <button
            onClick={runProgram}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-90 sm:px-3"
            style={{
              backgroundColor: 'var(--ss-success-soft)',
              color: 'var(--ss-success)',
            }}
            title="Run Program"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Run</span>
          </button>
        ) : (
          <button
            onClick={pauseProgram}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-90 sm:px-3"
            style={{
              backgroundColor: 'var(--ss-warning-soft)',
              color: 'var(--ss-warning)',
            }}
            title="Pause Execution"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={resetCpu}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition hover:opacity-80"
          style={{ color: 'var(--ss-text-secondary)' }}
          title="Reset Registers & Reload Program"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Time-Travel Scrubber + Telemetry Clock + Exports + Far-Right Theme Selection */}
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 lg:w-auto lg:justify-end">
        <div
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 sm:flex-initial"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          <History className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ss-warning)' }} />
          <span className="hidden text-[11px] font-medium sm:inline" style={{ color: 'var(--ss-text-muted)' }}>
            Timeline
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={Math.max(0, cursor)}
            onChange={(e) => jumpToStep(Number(e.target.value))}
            disabled={snapshots.length <= 1}
            className="h-1.5 min-w-[60px] flex-1 cursor-pointer sm:w-20 sm:flex-initial"
            style={{ accentColor: 'var(--ss-warning)' }}
            title="Scrub Execution History"
          />
          <span className="shrink-0 font-mono text-[11px]" style={{ color: 'var(--ss-warning)' }}>
            {Math.max(0, cursor)}/{Math.max(0, snapshots.length - 1)}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] sm:text-xs"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          <FastForward className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ss-accent)' }} />
          <select
            value={clockMHz}
            onChange={(e) => setClockMHz(Number(e.target.value))}
            className="bg-transparent font-mono text-[11px] outline-none sm:text-xs"
            style={{ color: 'var(--ss-text-primary)' }}
          >
            <option value={1.0} style={{ backgroundColor: 'var(--ss-bg-elevated)' }}>1.0 MHz</option>
            <option value={2.0} style={{ backgroundColor: 'var(--ss-bg-elevated)' }}>2.0 MHz</option>
            <option value={3.072} style={{ backgroundColor: 'var(--ss-bg-elevated)' }}>3.072 MHz</option>
            <option value={5.0} style={{ backgroundColor: 'var(--ss-bg-elevated)' }}>5.0 MHz</option>
            <option value={6.0} style={{ backgroundColor: 'var(--ss-bg-elevated)' }}>6.0 MHz</option>
          </select>
          <span style={{ color: 'var(--ss-border-strong)' }}>|</span>
          <span className="font-mono" style={{ color: 'var(--ss-accent-text)' }}>
            {timing.dynamicTStates}T
          </span>
          <span className="hidden font-mono sm:inline" style={{ color: 'var(--ss-text-muted)' }}>
            ({timing.elapsedMicroseconds}µs)
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={exportListing}
            className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--ss-bg-input)',
              borderColor: 'var(--ss-border-subtle)',
              color: 'var(--ss-text-secondary)',
            }}
            title="Download Assembled Listing (.lst)"
          >
            <Download className="h-3 w-3" />
            .LST
          </button>
          <button
            onClick={exportIntelHex}
            className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--ss-bg-input)',
              borderColor: 'var(--ss-border-subtle)',
              color: 'var(--ss-text-secondary)',
            }}
            title="Download Intel HEX (.hex)"
          >
            <Download className="h-3 w-3" />
            .HEX
          </button>

          {/* Theme Selector Section on Far Right */}
          <button
            onClick={onOpenThemeSelector}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--ss-bg-panel-alt)',
              borderColor: 'var(--ss-border-strong)',
              color: 'var(--ss-text-primary)',
            }}
            title="Select or Generate Theme"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: activeTheme.tokens.accent }}
            />
            <Palette className="h-3.5 w-3.5" style={{ color: 'var(--ss-accent)' }} />
            <span className="hidden xl:inline">{activeTheme.name}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}