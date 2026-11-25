import type { BusPacketStep } from '../isa/busPaths';
import type { MachineCycleType } from '../isa/opcodes';
import type { CpuFlags } from './alu';

export interface CpuRegisters {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  H: number;
  L: number;
}

export interface MemoryMutation {
  address: number;
  oldValue: number;
  newValue: number;
}

export interface ExecutionSnapshot {
  stepIndex: number;
  pc: number;
  sp: number;
  registers: CpuRegisters;
  flags: CpuFlags;
  halted: boolean;
  interruptsEnabled: boolean;
  interruptMask: number;
  tStatesTotal: number;
  machineCyclesTotal: number;
  executedAddress: number | null;
  executedInstruction: string;
  machineCycles: MachineCycleType[];
  tStatesDelta: number;
  busRoutes: BusPacketStep[];
  memoryMutations: MemoryMutation[];
  changedRegisters: (keyof CpuRegisters | 'PC' | 'SP')[];
  changedFlags: (keyof CpuFlags)[];
}

export class ExecutionHistory {
  private snapshots: ExecutionSnapshot[] = [];
  private cursor = -1;
  private readonly maxSnapshots: number;

  constructor(maxSnapshots = 2000) {
    this.maxSnapshots = maxSnapshots;
  }

  clear(): void {
    this.snapshots = [];
    this.cursor = -1;
  }

  push(snapshot: ExecutionSnapshot): void {
    // If user stepped backward and then executed forward, truncate future branch
    if (this.cursor < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.cursor + 1);
    }
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    this.cursor = this.snapshots.length - 1;
  }

  canStepBack(): boolean {
    return this.cursor > 0;
  }

  canStepForward(): boolean {
    return this.cursor < this.snapshots.length - 1;
  }

  getCurrent(): ExecutionSnapshot | null {
    return this.cursor >= 0 ? this.snapshots[this.cursor] : null;
  }

  getAll(): ExecutionSnapshot[] {
    return this.snapshots;
  }

  getCursor(): number {
    return this.cursor;
  }

  stepBack(): ExecutionSnapshot | null {
    if (!this.canStepBack()) return null;
    this.cursor--;
    return this.snapshots[this.cursor];
  }

  stepForwardInHistory(): ExecutionSnapshot | null {
    if (!this.canStepForward()) return null;
    this.cursor++;
    return this.snapshots[this.cursor];
  }

  jumpTo(index: number): ExecutionSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) return null;
    this.cursor = index;
    return this.snapshots[this.cursor];
  }
}