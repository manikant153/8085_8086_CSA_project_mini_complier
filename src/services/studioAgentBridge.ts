import type { InterruptPin } from '../core/emulator/cpu';
import type { ArchitectureId } from '../core/isa/arch8086';
import { SYLLABUS_PRESETS } from '../data/syllabusPresets';
import type { ThemeId } from '../data/themes';
import { useSimulatorStore } from '../store/useSimulatorStore';

export type StudioAction =
  | { type: 'switch_architecture'; architecture: ArchitectureId }
  | { type: 'load_preset'; presetId: string }
  | { type: 'replace_code'; code: string }
  | { type: 'update_line'; line: number; content: string }
  | { type: 'assemble' }
  | { type: 'step_forward'; count?: number }
  | { type: 'step_backward'; count?: number }
  | { type: 'run' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'jump_to_step'; step: number }
  | { type: 'toggle_breakpoint'; line: number }
  | { type: 'jump_memory'; address: number }
  | { type: 'edit_memory'; address: number; value: number }
  | { type: 'set_clock'; clockMHz: number }
  | { type: 'set_theme'; themeId: ThemeId }
  | { type: 'toggle_input_switch'; bit: number }
  | { type: 'trigger_interrupt'; pin: InterruptPin };

export interface LiveStudioContext {
  architecture: ArchitectureId;
  numberedSource: string;
  selectedSnippet: string;
  diagnostics: { line: number; message: string }[];
  registers: Record<string, string>;
  flags: Record<string, 0 | 1>;
  halted: boolean;
  timing: {
    clockMHz: number;
    dynamicTStates: number;
    dynamicMachineCycles: number;
    elapsedMicroseconds: number;
  };
  microarchitecture: {
    executedInstruction: string;
    busSteps: string[];
    machineCycles: string[];
    tStatesDelta: number;
  };
  machineCodePreview: { addr: string; hex: string; mnemonic: string; cycles: string }[];
  memoryWindow: {
    baseAddress: string;
    nonZeroBytes: { addr: string; hex: string }[];
  };
  ioPort00H: {
    inputSwitchesHex: string;
    outputLedHex: string;
  };
  breakpoints: number[];
  availablePresets: { id: string; arch: ArchitectureId; title: string }[];
}

const hex2 = (v: number) => (v & 0xff).toString(16).toUpperCase().padStart(2, '0') + 'H';
const hex4 = (v: number) => (v & 0xffff).toString(16).toUpperCase().padStart(4, '0') + 'H';

export function captureLiveStudioContext(): LiveStudioContext {
  const s = useSimulatorStore.getState();
  const is8085 = s.architecture === '8085';

  const numberedSource = s.sourceCode
    .split('\n')
    .map((line, idx) => `${String(idx + 1).padStart(2, ' ')}: ${line}`)
    .join('\n');

  const registers: Record<string, string> = is8085
    ? {
        A: hex2(s.cpu.r.A),
        B: hex2(s.cpu.r.B),
        C: hex2(s.cpu.r.C),
        D: hex2(s.cpu.r.D),
        E: hex2(s.cpu.r.E),
        H: hex2(s.cpu.r.H),
        L: hex2(s.cpu.r.L),
        SP: hex4(s.cpu.sp),
        PC: hex4(s.cpu.pc),
      }
    : {
        AX: hex4(s.cpu8086.r.AX),
        BX: hex4(s.cpu8086.r.BX),
        CX: hex4(s.cpu8086.r.CX),
        DX: hex4(s.cpu8086.r.DX),
        SI: hex4(s.cpu8086.r.SI),
        DI: hex4(s.cpu8086.r.DI),
        BP: hex4(s.cpu8086.r.BP),
        SP: hex4(s.cpu8086.r.SP),
        IP: hex4(s.cpu8086.ip),
        CS: hex4(s.cpu8086.r.CS),
        DS: hex4(s.cpu8086.r.DS),
        SS: hex4(s.cpu8086.r.SS),
        ES: hex4(s.cpu8086.r.ES),
      };

  const flags: Record<string, 0 | 1> = is8085
    ? { ...s.cpu.f }
    : { ...s.cpu8086.f };

  const activeAsm = is8085 ? s.assembly : s.assembly8086;
  const diagnostics = (activeAsm?.diagnostics ?? []).map((d) => ({
    line: d.line,
    message: d.message,
  }));

  const machineCodePreview = (activeAsm?.rows ?? []).slice(0, 24).map((r) => ({
    addr: hex4(r.address),
    hex: r.bytes.map((b) => (b & 0xff).toString(16).toUpperCase().padStart(2, '0')).join(' '),
    mnemonic: `${r.mnemonic ?? ''} ${r.operands.join(', ')}`.trim(),
    cycles: r.isDirective
      ? 'DATA'
      : `${('machineCycles' in r ? r.machineCycles : r.cycles).join('·')} (${r.tStates}T)`,
  }));

  const mem = is8085 ? s.cpu.mem : s.cpu8086.mem;
  const base = s.memoryJumpAddress & 0xfff0;
  const nonZeroBytes: { addr: string; hex: string }[] = [];
  for (let i = 0; i < 256; i++) {
    const addr = (base + i) & 0xffff;
    if (mem[addr] !== 0) {
      nonZeroBytes.push({ addr: hex4(addr), hex: hex2(mem[addr]) });
    }
  }

  const busSteps = is8085
    ? (s.snapshot?.busRoutes ?? []).map((b, i) => `T${i + 1}: ${b.label}`)
    : (s.snapshot8086?.busRoutes ?? []).map((b, i) => `T${i + 1}: ${b.label}`);

  const machineCycles = is8085
    ? s.snapshot?.machineCycles ?? []
    : s.snapshot8086?.cycles ?? [];

  return {
    architecture: s.architecture,
    numberedSource,
    selectedSnippet: s.selectedSnippet,
    diagnostics,
    registers,
    flags,
    halted: is8085 ? s.cpu.halted : s.cpu8086.halted,
    timing: {
      clockMHz: s.timing.clockMHz,
      dynamicTStates: s.timing.dynamicTStates,
      dynamicMachineCycles: s.timing.dynamicMachineCycles,
      elapsedMicroseconds: s.timing.elapsedMicroseconds,
    },
    microarchitecture: {
      executedInstruction: is8085
        ? s.snapshot?.executedInstruction ?? 'READY'
        : s.snapshot8086?.executedInstruction ?? 'READY',
      busSteps,
      machineCycles,
      tStatesDelta: is8085 ? s.snapshot?.tStatesDelta ?? 0 : s.snapshot8086?.tStatesDelta ?? 0,
    },
    machineCodePreview,
    memoryWindow: {
      baseAddress: hex4(base),
      nonZeroBytes,
    },
    ioPort00H: {
      inputSwitchesHex: hex2(s.inputSwitches),
      outputLedHex: hex2(is8085 ? s.cpu.ioPorts[0x00] ?? 0 : s.cpu8086.ioPorts[0x00] ?? 0),
    },
    breakpoints: Array.from(s.breakpoints),
    availablePresets: SYLLABUS_PRESETS.map((p) => ({
      id: p.id,
      arch: p.arch,
      title: p.title,
    })),
  };
}

export function executeStudioActions(actions: StudioAction[]): string[] {
  const logs: string[] = [];

  for (const act of actions) {
    const store = useSimulatorStore.getState();

    switch (act.type) {
      case 'switch_architecture':
        store.setArchitecture(act.architecture);
        logs.push(`Switched architecture to ${act.architecture}`);
        break;

      case 'load_preset':
        store.loadPreset(act.presetId);
        logs.push(`Loaded preset "${act.presetId}"`);
        break;

      case 'replace_code':
        store.setSourceCode(act.code);
        store.assembleCode();
        logs.push('Updated editor source code and assembled');
        break;

      case 'update_line': {
        const lines = store.sourceCode.split('\n');
        const idx = Math.max(0, Math.min(lines.length - 1, act.line - 1));
        lines[idx] = act.content;
        store.setSourceCode(lines.join('\n'));
        store.assembleCode();
        logs.push(`Updated Line ${act.line} and re-assembled`);
        break;
      }

      case 'assemble':
        store.assembleCode();
        logs.push('Assembled program');
        break;

      case 'step_forward': {
        const steps = Math.max(1, Math.min(25, act.count ?? 1));
        for (let i = 0; i < steps; i++) {
          useSimulatorStore.getState().stepForward();
        }
        logs.push(`Stepped forward ${steps} instruction(s)`);
        break;
      }

      case 'step_backward': {
        const steps = Math.max(1, Math.min(25, act.count ?? 1));
        for (let i = 0; i < steps; i++) {
          useSimulatorStore.getState().stepBackward();
        }
        logs.push(`Stepped backward ${steps} instruction(s)`);
        break;
      }

      case 'run':
        store.runProgram();
        logs.push('Started program execution');
        break;

      case 'pause':
        store.pauseProgram();
        logs.push('Paused program execution');
        break;

      case 'reset':
        store.resetCpu();
        logs.push('Reset CPU and reloaded program');
        break;

      case 'jump_to_step':
        store.jumpToStep(act.step);
        logs.push(`Jumped timeline to step ${act.step}`);
        break;

      case 'toggle_breakpoint':
        store.toggleBreakpoint(act.line);
        logs.push(`Toggled breakpoint at Line ${act.line}`);
        break;

      case 'jump_memory':
        store.setMemoryJumpAddress(act.address);
        logs.push(`Jumped memory viewer to ${hex4(act.address)}`);
        break;

      case 'edit_memory':
        store.editMemoryByte(act.address, act.value);
        logs.push(`Set memory [${hex4(act.address)}] = ${hex2(act.value)}`);
        break;

      case 'set_clock':
        store.setClockMHz(act.clockMHz);
        logs.push(`Set clock frequency to ${act.clockMHz} MHz`);
        break;

      case 'set_theme':
        store.setTheme(act.themeId);
        logs.push(`Switched theme to ${act.themeId}`);
        break;

      case 'toggle_input_switch':
        store.toggleInputSwitch(act.bit);
        logs.push(`Toggled input switch D${act.bit}`);
        break;

      case 'trigger_interrupt':
        store.triggerInterrupt(act.pin);
        logs.push(`Triggered ${act.pin} interrupt`);
        break;
    }
  }

  return logs;
}