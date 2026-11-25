import { create } from 'zustand';
import { assemble, type AssemblyResult } from '../core/assembler/assembler';
import { generateTimingReport, type TimingReport } from '../core/analyzer/timingAnalyzer';
import { Cpu8085, type InterruptPin } from '../core/emulator/cpu';
import { Cpu8086, type Snapshot8086 } from '../core/emulator/cpu8086';
import type { ExecutionSnapshot } from '../core/emulator/history';
import {
  type ArchitectureId,
  assemble8086,
  type Assembly8086Result,
  DEFAULT_8086_CODE,
} from '../core/isa/arch8086';
import { SYLLABUS_PRESETS } from '../data/syllabusPresets';
import {
  applyThemeToDocument,
  type AppTheme,
  generateThemeFromAccent,
  PRESET_THEMES,
  type ThemeId,
  type ThemeMode,
} from '../data/themes';

const THEME_STORAGE_KEY = '8085-silicon-studio-theme-v1';

interface PersistedThemeState {
  themeId: ThemeId;
  customAccentHex: string;
  customMode: ThemeMode;
}

function loadPersistedTheme(): PersistedThemeState {
  const fallback: PersistedThemeState = {
    themeId: 'silicon-dark',
    customAccentHex: '#38bdf8',
    customMode: 'dark',
  };
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedThemeState>;
    const validIds: ThemeId[] = [
      'silicon-dark',
      'phosphor-crt',
      'cleanroom-light',
      'wafer-gold',
      'custom',
    ];
    return {
      themeId: parsed.themeId && validIds.includes(parsed.themeId) ? parsed.themeId : 'silicon-dark',
      customAccentHex: typeof parsed.customAccentHex === 'string' ? parsed.customAccentHex : '#38bdf8',
      customMode: parsed.customMode === 'light' ? 'light' : 'dark',
    };
  } catch {
    return fallback;
  }
}

function persistTheme(state: PersistedThemeState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota / privacy errors
  }
}

function resolveTheme(id: ThemeId, customAccentHex: string, customMode: ThemeMode): AppTheme {
  if (id === 'custom') {
    return generateThemeFromAccent(customAccentHex, customMode);
  }
  return PRESET_THEMES[id];
}

function build8086Timing(asm: Assembly8086Result | null, cpu86: Cpu8086, clockMHz: number): TimingReport {
  return {
    programBytes: asm?.totalBytes ?? 0,
    staticTStates: asm ? asm.rows.reduce((s, r) => s + r.tStates, 0) : 0,
    staticMachineCycles: asm ? asm.rows.reduce((s, r) => s + r.cycles.length, 0) : 0,
    dynamicInstructions: cpu86.instructionCount,
    dynamicTStates: cpu86.tStatesTotal,
    dynamicMachineCycles: cpu86.machineCyclesTotal,
    clockMHz,
    elapsedMicroseconds: Number((cpu86.tStatesTotal / clockMHz).toFixed(3)),
    halted: cpu86.halted,
  };
}

interface SimulatorState {
  architecture: ArchitectureId;
  sourceByArch: Record<ArchitectureId, string>;
  presetByArch: Record<ArchitectureId, string>;
  sourceCode: string;
  selectedSnippet: string;
  activePresetId: string;
  assembly: AssemblyResult | null;
  assembly8086: Assembly8086Result | null;
  cpu: Cpu8085;
  cpu8086: Cpu8086;
  snapshot: ExecutionSnapshot | null;
  snapshot8086: Snapshot8086 | null;
  timing: TimingReport;
  clockMHz: number;
  isRunning: boolean;
  breakpoints: Set<number>;
  hoveredLine: number | null;
  hoveredAddress: number | null;
  memoryJumpAddress: number;
  inputSwitches: number;
  revision: number;

  themeId: ThemeId;
  customAccentHex: string;
  customMode: ThemeMode;
  activeTheme: AppTheme;

  setArchitecture: (arch: ArchitectureId) => void;
  setSourceCode: (code: string) => void;
  setSelectedSnippet: (snippet: string) => void;
  loadPreset: (presetId: string) => void;
  assembleCode: () => boolean;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (index: number) => void;
  runProgram: () => void;
  pauseProgram: () => void;
  resetCpu: () => void;
  toggleBreakpoint: (line: number) => void;
  setClockMHz: (mhz: number) => void;
  setHoveredLine: (line: number | null) => void;
  setHoveredAddress: (addr: number | null) => void;
  setMemoryJumpAddress: (addr: number) => void;
  toggleInputSwitch: (bit: number) => void;
  editMemoryByte: (addr: number, val: number) => void;
  triggerInterrupt: (pin: InterruptPin) => void;
  setTheme: (id: ThemeId) => void;
  generateCustomTheme: (accentHex: string, mode: ThemeMode) => void;
}

let runTimer: number | null = null;

const initialThemeState = loadPersistedTheme();
const initialActiveTheme = resolveTheme(
  initialThemeState.themeId,
  initialThemeState.customAccentHex,
  initialThemeState.customMode
);
applyThemeToDocument(initialActiveTheme);

const initialCpu = new Cpu8085();
const initialCode = SYLLABUS_PRESETS[0].code;
const initialAssembly = assemble(initialCode, 0x2000);
if (initialAssembly.success) {
  initialCpu.loadProgram(initialAssembly);
}

const initialCpu8086 = new Cpu8086();
const initialAssembly8086 = assemble8086(DEFAULT_8086_CODE, 0x0100);
if (initialAssembly8086.success) {
  initialCpu8086.loadProgram(initialAssembly8086);
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  architecture: '8085',
  sourceByArch: {
    '8085': initialCode,
    '8086': DEFAULT_8086_CODE,
  },
  presetByArch: {
    '8085': SYLLABUS_PRESETS[0].id,
    '8086': 'block-sum-8086',
  },
  sourceCode: initialCode,
  selectedSnippet: '',
  activePresetId: SYLLABUS_PRESETS[0].id,
  assembly: initialAssembly,
  assembly8086: initialAssembly8086,
  cpu: initialCpu,
  cpu8086: initialCpu8086,
  snapshot: initialCpu.history.getCurrent(),
  snapshot8086: initialCpu8086.getCurrentSnapshot(),
  timing: generateTimingReport(initialAssembly, initialCpu, 3.072),
  clockMHz: 3.072,
  isRunning: false,
  breakpoints: new Set<number>(),
  hoveredLine: null,
  hoveredAddress: null,
  memoryJumpAddress: 0x2000,
  inputSwitches: 0x00,
  revision: 0,

  themeId: initialThemeState.themeId,
  customAccentHex: initialThemeState.customAccentHex,
  customMode: initialThemeState.customMode,
  activeTheme: initialActiveTheme,

  setArchitecture: (nextArch) => {
    const {
      architecture,
      sourceCode,
      sourceByArch,
      presetByArch,
      activePresetId,
      cpu,
      cpu8086,
      assembly,
      assembly8086,
      clockMHz,
    } = get();
    if (architecture === nextArch) return;
    get().pauseProgram();

    const updatedBuffers: Record<ArchitectureId, string> = {
      ...sourceByArch,
      [architecture]: sourceCode,
    };
    const updatedPresets: Record<ArchitectureId, string> = {
      ...presetByArch,
      [architecture]: activePresetId,
    };
    const nextCode = updatedBuffers[nextArch];

    set((s) => ({
      architecture: nextArch,
      sourceByArch: updatedBuffers,
      presetByArch: updatedPresets,
      sourceCode: nextCode,
      selectedSnippet: '',
      activePresetId: updatedPresets[nextArch],
      hoveredLine: null,
      hoveredAddress: null,
      memoryJumpAddress:
        nextArch === '8085' ? assembly?.entryPoint ?? 0x2000 : assembly8086?.entryPoint ?? 0x0100,
      timing:
        nextArch === '8085'
          ? generateTimingReport(assembly, cpu, clockMHz)
          : build8086Timing(assembly8086, cpu8086, clockMHz),
      revision: s.revision + 1,
    }));
  },

  setSourceCode: (code) =>
    set((s) => ({
      sourceCode: code,
      sourceByArch: {
        ...s.sourceByArch,
        [s.architecture]: code,
      },
    })),

  setSelectedSnippet: (snippet) => set({ selectedSnippet: snippet }),

  loadPreset: (presetId) => {
    const preset = SYLLABUS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    get().pauseProgram();
    set((s) => ({
      architecture: preset.arch,
      sourceCode: preset.code,
      selectedSnippet: '',
      sourceByArch: { ...s.sourceByArch, [preset.arch]: preset.code },
      presetByArch: { ...s.presetByArch, [preset.arch]: preset.id },
      activePresetId: preset.id,
    }));
    get().assembleCode();
  },

  assembleCode: () => {
    const { architecture, sourceCode, cpu, cpu8086, clockMHz, inputSwitches } = get();
    get().pauseProgram();

    if (architecture === '8086') {
      const res86 = assemble8086(sourceCode, 0x0100);
      if (res86.success) {
        cpu8086.loadProgram(res86);
        cpu8086.setInputPort(0x00, inputSwitches);
      }
      set((s) => ({
        assembly8086: res86,
        snapshot8086: cpu8086.getCurrentSnapshot(),
        timing: build8086Timing(res86, cpu8086, clockMHz),
        memoryJumpAddress: res86.entryPoint,
        revision: s.revision + 1,
      }));
      return res86.success;
    }

    const res = assemble(sourceCode, 0x2000);
    if (res.success) {
      cpu.loadProgram(res);
      cpu.setInputPort(0x00, inputSwitches);
    }
    set((s) => ({
      assembly: res,
      snapshot: cpu.history.getCurrent(),
      timing: generateTimingReport(res, cpu, clockMHz),
      memoryJumpAddress: res.entryPoint,
      revision: s.revision + 1,
    }));
    return res.success;
  },

  stepForward: () => {
    const { architecture, cpu, cpu8086, assembly, assembly8086, clockMHz } = get();
    if (architecture === '8086') {
      if (!assembly8086?.success) {
        if (!get().assembleCode()) return;
      }
      const snap86 = cpu8086.step();
      set((s) => ({
        snapshot8086: snap86,
        timing: build8086Timing(get().assembly8086, cpu8086, clockMHz),
        revision: s.revision + 1,
      }));
      return;
    }

    if (!assembly?.success) {
      if (!get().assembleCode()) return;
    }
    const snap = cpu.step();
    set((s) => ({
      snapshot: snap,
      timing: generateTimingReport(get().assembly, cpu, clockMHz),
      revision: s.revision + 1,
    }));
  },

  stepBackward: () => {
    const { architecture, cpu, cpu8086, assembly, assembly8086, clockMHz } = get();
    get().pauseProgram();
    if (architecture === '8086') {
      const snap86 = cpu8086.stepBack();
      if (!snap86) return;
      set((s) => ({
        snapshot8086: snap86,
        timing: build8086Timing(assembly8086, cpu8086, clockMHz),
        revision: s.revision + 1,
      }));
      return;
    }

    const snap = cpu.stepBack();
    if (!snap) return;
    set((s) => ({
      snapshot: snap,
      timing: generateTimingReport(assembly, cpu, clockMHz),
      revision: s.revision + 1,
    }));
  },

  jumpToStep: (index) => {
    const { architecture, cpu, cpu8086, assembly, assembly8086, clockMHz } = get();
    get().pauseProgram();
    if (architecture === '8086') {
      const snap86 = cpu8086.jumpToStep(index);
      if (!snap86) return;
      set((s) => ({
        snapshot8086: snap86,
        timing: build8086Timing(assembly8086, cpu8086, clockMHz),
        revision: s.revision + 1,
      }));
      return;
    }

    const snap = cpu.jumpToHistoryStep(index);
    if (!snap) return;
    set((s) => ({
      snapshot: snap,
      timing: generateTimingReport(assembly, cpu, clockMHz),
      revision: s.revision + 1,
    }));
  },

  runProgram: () => {
    const state = get();
    if (state.isRunning) return;

    if (state.architecture === '8086') {
      if (!state.assembly8086?.success && !state.assembleCode()) return;
      if (state.cpu8086.halted) state.assembleCode();
    } else {
      if (!state.assembly?.success && !state.assembleCode()) return;
      if (state.cpu.halted) state.assembleCode();
    }

    set({ isRunning: true });
    runTimer = window.setInterval(() => {
      const cur = get();
      if (cur.architecture === '8086') {
        if (cur.cpu8086.halted) {
          get().pauseProgram();
          return;
        }
        const nextRow = cur.assembly8086?.addressToRow[cur.cpu8086.ip];
        if (nextRow && cur.breakpoints.has(nextRow.lineNumber) && cur.cpu8086.instructionCount > 0) {
          get().pauseProgram();
          return;
        }
        const snap86 = cur.cpu8086.step();
        set((s) => ({
          snapshot8086: snap86,
          timing: build8086Timing(cur.assembly8086, cur.cpu8086, cur.clockMHz),
          revision: s.revision + 1,
        }));
        if (cur.cpu8086.halted || cur.cpu8086.instructionCount > 10000) {
          get().pauseProgram();
        }
        return;
      }

      if (cur.cpu.halted) {
        get().pauseProgram();
        return;
      }
      const nextRow = cur.assembly?.addressToRow[cur.cpu.pc];
      if (nextRow && cur.breakpoints.has(nextRow.lineNumber) && cur.cpu.instructionCount > 0) {
        get().pauseProgram();
        return;
      }
      const snap = cur.cpu.step();
      set((s) => ({
        snapshot: snap,
        timing: generateTimingReport(cur.assembly, cur.cpu, cur.clockMHz),
        revision: s.revision + 1,
      }));
      if (cur.cpu.halted || cur.cpu.instructionCount > 10000) {
        get().pauseProgram();
      }
    }, 60);
  },

  pauseProgram: () => {
    if (runTimer !== null) {
      clearInterval(runTimer);
      runTimer = null;
    }
    set({ isRunning: false });
  },

  resetCpu: () => {
    get().pauseProgram();
    get().assembleCode();
  },

  toggleBreakpoint: (line) =>
    set((s) => {
      const next = new Set(s.breakpoints);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return { breakpoints: next };
    }),

  setClockMHz: (mhz) =>
    set((s) => ({
      clockMHz: mhz,
      timing:
        s.architecture === '8085'
          ? generateTimingReport(s.assembly, s.cpu, mhz)
          : build8086Timing(s.assembly8086, s.cpu8086, mhz),
    })),

  setHoveredLine: (line) => {
    const { architecture, assembly, assembly8086 } = get();
    const addr =
      line !== null
        ? architecture === '8085'
          ? assembly?.lineToAddress[line] ?? null
          : assembly8086?.lineToAddress[line] ?? null
        : null;
    set({ hoveredLine: line, hoveredAddress: addr });
  },

  setHoveredAddress: (addr) => {
    const { architecture, assembly, assembly8086 } = get();
    const line =
      addr !== null
        ? architecture === '8085'
          ? assembly?.addressToRow[addr]?.lineNumber ?? null
          : assembly8086?.addressToRow[addr]?.lineNumber ?? null
        : null;
    set({ hoveredAddress: addr, hoveredLine: line });
  },

  setMemoryJumpAddress: (addr) => set({ memoryJumpAddress: addr & 0xffff }),

  toggleInputSwitch: (bit) =>
    set((s) => {
      const next = s.inputSwitches ^ (1 << bit);
      s.cpu.setInputPort(0x00, next);
      s.cpu8086.setInputPort(0x00, next);
      return { inputSwitches: next, revision: s.revision + 1 };
    }),

  editMemoryByte: (addr, val) =>
    set((s) => {
      if (s.architecture === '8086') {
        s.cpu8086.mem[addr & 0xffff] = val & 0xff;
      } else {
        s.cpu.mem[addr & 0xffff] = val & 0xff;
      }
      return { revision: s.revision + 1 };
    }),

  triggerInterrupt: (pin) =>
    set((s) => {
      s.cpu.triggerInterrupt(pin);
      return { revision: s.revision + 1 };
    }),

  setTheme: (id) => {
    const { customAccentHex, customMode } = get();
    const theme = resolveTheme(id, customAccentHex, customMode);
    applyThemeToDocument(theme);
    persistTheme({ themeId: id, customAccentHex, customMode });
    set({ themeId: id, activeTheme: theme });
  },

  generateCustomTheme: (accentHex, mode) => {
    const theme = generateThemeFromAccent(accentHex, mode);
    applyThemeToDocument(theme);
    persistTheme({ themeId: 'custom', customAccentHex: accentHex, customMode: mode });
    set({
      themeId: 'custom',
      customAccentHex: accentHex,
      customMode: mode,
      activeTheme: theme,
    });
  },
}));