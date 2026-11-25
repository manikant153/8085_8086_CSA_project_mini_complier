import type { AssemblyResult } from '../assembler/assembler';
import { Cpu8085 } from '../emulator/cpu';

export interface TimingReport {
  programBytes: number;
  staticTStates: number;
  staticMachineCycles: number;
  dynamicInstructions: number;
  dynamicTStates: number;
  dynamicMachineCycles: number;
  clockMHz: number;
  elapsedMicroseconds: number;
  halted: boolean;
}

export function generateTimingReport(
  assembly: AssemblyResult | null,
  cpu: Cpu8085,
  clockMHz = 3.072
): TimingReport {
  const staticTStates = assembly
    ? assembly.rows.reduce((sum, r) => sum + (r.isDirective ? 0 : r.tStates), 0)
    : 0;
  const staticMachineCycles = assembly
    ? assembly.rows.reduce((sum, r) => sum + (r.isDirective ? 0 : r.machineCycles.length), 0)
    : 0;

  return {
    programBytes: assembly?.totalBytes ?? 0,
    staticTStates,
    staticMachineCycles,
    dynamicInstructions: cpu.instructionCount,
    dynamicTStates: cpu.tStatesTotal,
    dynamicMachineCycles: cpu.machineCyclesTotal,
    clockMHz,
    elapsedMicroseconds: Number((cpu.tStatesTotal / clockMHz).toFixed(3)),
    halted: cpu.halted,
  };
}