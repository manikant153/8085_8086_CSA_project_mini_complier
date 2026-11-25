import type { AssemblyResult, AssembledRow } from '../assembler/assembler';
import { getBusAnimationRoute } from '../isa/busPaths';
import type { MachineCycleType } from '../isa/opcodes';
import { aluAdd, aluDaa, aluSub, type CpuFlags, evaluateFlags } from './alu';
import { type CpuRegisters, ExecutionHistory, type ExecutionSnapshot, type MemoryMutation } from './history';

export type InterruptPin = 'TRAP' | 'RST7.5' | 'RST6.5' | 'RST5.5';

const INTERRUPT_VECTORS: Record<InterruptPin, number> = {
  TRAP: 0x0024,
  'RST7.5': 0x003c,
  'RST6.5': 0x0034,
  'RST5.5': 0x002c,
};

export class Cpu8085 {
  public r: CpuRegisters = { A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0 };
  public f: CpuFlags = { S: 0, Z: 0, AC: 0, P: 0, CY: 0 };
  public pc = 0x2000;
  public sp = 0xffff;
  public mem = new Uint8Array(65536);
  public ioPorts = new Uint8Array(256);

  public halted = false;
  public interruptsEnabled = false;
  public interruptMask = 0x07; // M7.5=1, M6.5=1, M5.5=1 (masked by default)
  public pendingInterrupts = new Set<InterruptPin>();

  public tStatesTotal = 0;
  public machineCyclesTotal = 0;
  public instructionCount = 0;

  public addressToRow: Record<number, AssembledRow> = {};
  public history = new ExecutionHistory(2000);

  private currentMutations: MemoryMutation[] = [];

  constructor() {
    this.reset();
  }

  reset(entryPoint = 0x2000): void {
    this.r = { A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0 };
    this.f = { S: 0, Z: 0, AC: 0, P: 0, CY: 0 };
    this.pc = entryPoint & 0xffff;
    this.sp = 0xffff;
    this.mem.fill(0);
    this.ioPorts.fill(0);
    this.halted = false;
    this.interruptsEnabled = false;
    this.interruptMask = 0x07;
    this.pendingInterrupts.clear();
    this.tStatesTotal = 0;
    this.machineCyclesTotal = 0;
    this.instructionCount = 0;
    this.addressToRow = {};
    this.history.clear();
    this.recordSnapshot(null, 'RESET', [], 0, [], [], []);
  }

  loadProgram(assembly: AssemblyResult): void {
    this.reset(assembly.entryPoint);
    this.addressToRow = assembly.addressToRow;
    for (const seg of assembly.segments) {
      for (let i = 0; i < seg.bytes.length; i++) {
        this.mem[(seg.startAddress + i) & 0xffff] = seg.bytes[i] & 0xff;
      }
    }
    this.history.clear();
    this.recordSnapshot(null, 'LOADED', [], 0, [], [], []);
  }

  triggerInterrupt(pin: InterruptPin): void {
    this.pendingInterrupts.add(pin);
  }

  setInputPort(port: number, value: number): void {
    this.ioPorts[port & 0xff] = value & 0xff;
  }

  private writeMem(addr: number, val: number): void {
    const a = addr & 0xffff;
    const v = val & 0xff;
    const oldVal = this.mem[a];
    if (oldVal !== v) {
      this.currentMutations.push({ address: a, oldValue: oldVal, newValue: v });
    }
    this.mem[a] = v;
  }

  private getHL(): number {
    return ((this.r.H << 8) | this.r.L) & 0xffff;
  }

  private setHL(val: number): void {
    this.r.H = (val >> 8) & 0xff;
    this.r.L = val & 0xff;
  }

  private getRegByCode(code: number): number {
    switch (code & 0x07) {
      case 0: return this.r.B;
      case 1: return this.r.C;
      case 2: return this.r.D;
      case 3: return this.r.E;
      case 4: return this.r.H;
      case 5: return this.r.L;
      case 6: return this.mem[this.getHL()];
      case 7: return this.r.A;
      default: return 0;
    }
  }

  private setRegByCode(code: number, val: number): void {
    const v = val & 0xff;
    switch (code & 0x07) {
      case 0: this.r.B = v; break;
      case 1: this.r.C = v; break;
      case 2: this.r.D = v; break;
      case 3: this.r.E = v; break;
      case 4: this.r.H = v; break;
      case 5: this.r.L = v; break;
      case 6: this.writeMem(this.getHL(), v); break;
      case 7: this.r.A = v; break;
    }
  }

  private getRP(rp: number, allowPSW = false): number {
    switch (rp & 0x03) {
      case 0: return (this.r.B << 8) | this.r.C;
      case 1: return (this.r.D << 8) | this.r.E;
      case 2: return (this.r.H << 8) | this.r.L;
      case 3: {
        if (!allowPSW) return this.sp;
        const psw =
          (this.f.S << 7) |
          (this.f.Z << 6) |
          (this.f.AC << 4) |
          (this.f.P << 2) |
          0x02 |
          this.f.CY;
        return (this.r.A << 8) | psw;
      }
      default: return 0;
    }
  }

  private setRP(rp: number, val: number, allowPSW = false): void {
    const v = val & 0xffff;
    switch (rp & 0x03) {
      case 0: this.r.B = (v >> 8) & 0xff; this.r.C = v & 0xff; break;
      case 1: this.r.D = (v >> 8) & 0xff; this.r.E = v & 0xff; break;
      case 2: this.r.H = (v >> 8) & 0xff; this.r.L = v & 0xff; break;
      case 3: {
        if (!allowPSW) {
          this.sp = v;
        } else {
          this.r.A = (v >> 8) & 0xff;
          const psw = v & 0xff;
          this.f = {
            S: ((psw >> 7) & 1) as 0 | 1,
            Z: ((psw >> 6) & 1) as 0 | 1,
            AC: ((psw >> 4) & 1) as 0 | 1,
            P: ((psw >> 2) & 1) as 0 | 1,
            CY: (psw & 1) as 0 | 1,
          };
        }
        break;
      }
    }
  }

  private push16(val: number): void {
    this.sp = (this.sp - 1) & 0xffff;
    this.writeMem(this.sp, (val >> 8) & 0xff);
    this.sp = (this.sp - 1) & 0xffff;
    this.writeMem(this.sp, val & 0xff);
  }

  private pop16(): number {
    const lo = this.mem[this.sp];
    this.sp = (this.sp + 1) & 0xffff;
    const hi = this.mem[this.sp];
    this.sp = (this.sp + 1) & 0xffff;
    return ((hi << 8) | lo) & 0xffff;
  }

  private checkCondition(cc: number): boolean {
    switch (cc & 0x07) {
      case 0: return this.f.Z === 0;  // NZ
      case 1: return this.f.Z === 1;  // Z
      case 2: return this.f.CY === 0; // NC
      case 3: return this.f.CY === 1; // C
      case 4: return this.f.P === 0;  // PO
      case 5: return this.f.P === 1;  // PE
      case 6: return this.f.S === 0;  // P
      case 7: return this.f.S === 1;  // M
      default: return false;
    }
  }

  private handlePendingInterrupt(): boolean {
    if (this.pendingInterrupts.has('TRAP')) {
      this.pendingInterrupts.delete('TRAP');
      this.halted = false;
      this.interruptsEnabled = false;
      this.push16(this.pc);
      this.pc = INTERRUPT_VECTORS.TRAP;
      return true;
    }
    if (!this.interruptsEnabled) return false;

    const checks: [InterruptPin, number][] = [
      ['RST7.5', 0x04],
      ['RST6.5', 0x02],
      ['RST5.5', 0x01],
    ];
    for (const [pin, maskBit] of checks) {
      if (this.pendingInterrupts.has(pin) && (this.interruptMask & maskBit) === 0) {
        this.pendingInterrupts.delete(pin);
        this.halted = false;
        this.interruptsEnabled = false;
        this.push16(this.pc);
        this.pc = INTERRUPT_VECTORS[pin];
        return true;
      }
    }
    return false;
  }

  step(): ExecutionSnapshot {
    // If user stepped backward in time-travel history, advance through recorded snapshots first
    if (this.history.canStepForward()) {
      const nextSnap = this.history.stepForwardInHistory()!;
      this.restoreFromSnapshot(nextSnap, 'forward');
      return nextSnap;
    }

    if (this.halted && !this.handlePendingInterrupt()) {
      return this.history.getCurrent()!;
    }

    const prevReg = { ...this.r };
    const prevFlags = { ...this.f };
    const prevPC = this.pc;
    const prevSP = this.sp;
    this.currentMutations = [];

    if (this.handlePendingInterrupt()) {
      this.tStatesTotal += 12;
      this.machineCyclesTotal += 3;
      return this.recordSnapshot(
        prevPC,
        'INTERRUPT VECTOR',
        ['INA', 'MW', 'MW'],
        12,
        ['PC', 'SP'],
        [],
        []
      );
    }

    const execAddr = this.pc;
    const row = this.addressToRow[execAddr];
    const opcode = this.mem[this.pc];
    this.pc = (this.pc + 1) & 0xffff;

    const readImm8 = () => {
      const v = this.mem[this.pc];
      this.pc = (this.pc + 1) & 0xffff;
      return v;
    };

    const readImm16 = () => {
      const lo = readImm8();
      const hi = readImm8();
      return ((hi << 8) | lo) & 0xffff;
    };

    let tDelta = row?.tStates ?? 4;
    let cycles: MachineCycleType[] = row?.machineCycles ?? ['OF'];
    let branchTaken = true;

    // Decode & Execute all 246 Intel 8085 opcodes
    if (opcode === 0x76) {
      this.halted = true;
    } else if ((opcode & 0xc0) === 0x40) {
      // MOV dst, src
      const dst = (opcode >> 3) & 0x07;
      const src = opcode & 0x07;
      this.setRegByCode(dst, this.getRegByCode(src));
    } else if ((opcode & 0xc7) === 0x06) {
      // MVI dst, d8
      const dst = (opcode >> 3) & 0x07;
      this.setRegByCode(dst, readImm8());
    } else if ((opcode & 0xcf) === 0x01) {
      // LXI rp, d16
      this.setRP((opcode >> 4) & 0x03, readImm16());
    } else if ((opcode & 0xcf) === 0x09) {
      // DAD rp
      const rpVal = this.getRP((opcode >> 4) & 0x03);
      const sum = this.getHL() + rpVal;
      this.setHL(sum & 0xffff);
      this.f.CY = sum > 0xffff ? 1 : 0;
    } else if ((opcode & 0xcf) === 0x03) {
      // INX rp
      const rp = (opcode >> 4) & 0x03;
      this.setRP(rp, (this.getRP(rp) + 1) & 0xffff);
    } else if ((opcode & 0xcf) === 0x0b) {
      // DCX rp
      const rp = (opcode >> 4) & 0x03;
      this.setRP(rp, (this.getRP(rp) - 1) & 0xffff);
    } else if ((opcode & 0xc7) === 0x04) {
      // INR r
      const reg = (opcode >> 3) & 0x07;
      const v = this.getRegByCode(reg);
      const res = (v + 1) & 0xff;
      this.f = evaluateFlags(res, this.f, { ac: ((v & 0x0f) + 1) > 0x0f, updateCY: false });
      this.setRegByCode(reg, res);
    } else if ((opcode & 0xc7) === 0x05) {
      // DCR r
      const reg = (opcode >> 3) & 0x07;
      const v = this.getRegByCode(reg);
      const res = (v - 1) & 0xff;
      this.f = evaluateFlags(res, this.f, { ac: ((v & 0x0f) - 1) >= 0, updateCY: false });
      this.setRegByCode(reg, res);
    } else if ((opcode & 0xf8) === 0x80) {
      // ADD r
      const out = aluAdd(this.r.A, this.getRegByCode(opcode & 0x07), 0, this.f);
      this.r.A = out.result;
      this.f = out.flags;
    } else if ((opcode & 0xf8) === 0x88) {
      // ADC r
      const out = aluAdd(this.r.A, this.getRegByCode(opcode & 0x07), this.f.CY, this.f);
      this.r.A = out.result;
      this.f = out.flags;
    } else if ((opcode & 0xf8) === 0x90) {
      // SUB r
      const out = aluSub(this.r.A, this.getRegByCode(opcode & 0x07), 0, this.f);
      this.r.A = out.result;
      this.f = out.flags;
    } else if ((opcode & 0xf8) === 0x98) {
      // SBB r
      const out = aluSub(this.r.A, this.getRegByCode(opcode & 0x07), this.f.CY, this.f);
      this.r.A = out.result;
      this.f = out.flags;
    } else if ((opcode & 0xf8) === 0xa0) {
      // ANA r
      const v = this.getRegByCode(opcode & 0x07);
      this.r.A &= v;
      this.f = evaluateFlags(this.r.A, this.f, { cy: false, ac: true });
    } else if ((opcode & 0xf8) === 0xa8) {
      // XRA r
      this.r.A ^= this.getRegByCode(opcode & 0x07);
      this.f = evaluateFlags(this.r.A, this.f, { cy: false, ac: false });
    } else if ((opcode & 0xf8) === 0xb0) {
      // ORA r
      this.r.A |= this.getRegByCode(opcode & 0x07);
      this.f = evaluateFlags(this.r.A, this.f, { cy: false, ac: false });
    } else if ((opcode & 0xf8) === 0xb8) {
      // CMP r
      const out = aluSub(this.r.A, this.getRegByCode(opcode & 0x07), 0, this.f);
      this.f = out.flags;
    } else if ((opcode & 0xcf) === 0xc5) {
      // PUSH rp
      this.push16(this.getRP((opcode >> 4) & 0x03, true));
    } else if ((opcode & 0xcf) === 0xc1) {
      // POP rp
      this.setRP((opcode >> 4) & 0x03, this.pop16(), true);
    } else if ((opcode & 0xc7) === 0xc2) {
      // Jcc addr
      const target = readImm16();
      branchTaken = this.checkCondition((opcode >> 3) & 0x07);
      if (branchTaken) this.pc = target;
      else tDelta = 7;
    } else if ((opcode & 0xc7) === 0xc4) {
      // Ccc addr
      const target = readImm16();
      branchTaken = this.checkCondition((opcode >> 3) & 0x07);
      if (branchTaken) {
        this.push16(this.pc);
        this.pc = target;
      } else {
        tDelta = 9;
        cycles = ['OF', 'MR', 'MR'];
      }
    } else if ((opcode & 0xc7) === 0xc0) {
      // Rcc
      branchTaken = this.checkCondition((opcode >> 3) & 0x07);
      if (branchTaken) {
        this.pc = this.pop16();
      } else {
        tDelta = 6;
        cycles = ['OF'];
      }
    } else if ((opcode & 0xc7) === 0xc7) {
      // RST n
      const vec = ((opcode >> 3) & 0x07) * 8;
      this.push16(this.pc);
      this.pc = vec;
    } else {
      switch (opcode) {
        case 0x00: break; // NOP
        case 0x02: this.writeMem(this.getRP(0), this.r.A); break; // STAX B
        case 0x12: this.writeMem(this.getRP(1), this.r.A); break; // STAX D
        case 0x0a: this.r.A = this.mem[this.getRP(0)]; break;      // LDAX B
        case 0x1a: this.r.A = this.mem[this.getRP(1)]; break;      // LDAX D
        case 0x22: { const a = readImm16(); this.writeMem(a, this.r.L); this.writeMem(a + 1, this.r.H); break; } // SHLD
        case 0x2a: { const a = readImm16(); this.r.L = this.mem[a]; this.r.H = this.mem[(a + 1) & 0xffff]; break; } // LHLD
        case 0x32: this.writeMem(readImm16(), this.r.A); break;    // STA
        case 0x3a: this.r.A = this.mem[readImm16()]; break;        // LDA
        case 0xeb: { const tmpH = this.r.H, tmpL = this.r.L; this.r.H = this.r.D; this.r.L = this.r.E; this.r.D = tmpH; this.r.E = tmpL; break; } // XCHG
        case 0xe3: { // XTHL
          const lo = this.mem[this.sp], hi = this.mem[(this.sp + 1) & 0xffff];
          this.writeMem(this.sp, this.r.L);
          this.writeMem((this.sp + 1) & 0xffff, this.r.H);
          this.r.L = lo;
          this.r.H = hi;
          break;
        }
        case 0xf9: this.sp = this.getHL(); break; // SPHL
        case 0xe9: this.pc = this.getHL(); break; // PCHL
        case 0x07: { const msb = (this.r.A >> 7) & 1; this.r.A = ((this.r.A << 1) | msb) & 0xff; this.f.CY = msb as 0 | 1; break; } // RLC
        case 0x0f: { const lsb = this.r.A & 1; this.r.A = ((this.r.A >> 1) | (lsb << 7)) & 0xff; this.f.CY = lsb as 0 | 1; break; } // RRC
        case 0x17: { const msb = (this.r.A >> 7) & 1; this.r.A = ((this.r.A << 1) | this.f.CY) & 0xff; this.f.CY = msb as 0 | 1; break; } // RAL
        case 0x1f: { const lsb = this.r.A & 1; this.r.A = ((this.r.A >> 1) | (this.f.CY << 7)) & 0xff; this.f.CY = lsb as 0 | 1; break; } // RAR
        case 0x2f: this.r.A = (~this.r.A) & 0xff; break; // CMA
        case 0x3f: this.f.CY = this.f.CY === 1 ? 0 : 1; break; // CMC
        case 0x37: this.f.CY = 1; break; // STC
        case 0x27: { const out = aluDaa(this.r.A, this.f); this.r.A = out.result; this.f = out.flags; break; } // DAA
        case 0xc6: { const out = aluAdd(this.r.A, readImm8(), 0, this.f); this.r.A = out.result; this.f = out.flags; break; } // ADI
        case 0xce: { const out = aluAdd(this.r.A, readImm8(), this.f.CY, this.f); this.r.A = out.result; this.f = out.flags; break; } // ACI
        case 0xd6: { const out = aluSub(this.r.A, readImm8(), 0, this.f); this.r.A = out.result; this.f = out.flags; break; } // SUI
        case 0xde: { const out = aluSub(this.r.A, readImm8(), this.f.CY, this.f); this.r.A = out.result; this.f = out.flags; break; } // SBI
        case 0xe6: { this.r.A &= readImm8(); this.f = evaluateFlags(this.r.A, this.f, { cy: false, ac: true }); break; } // ANI
        case 0xee: { this.r.A ^= readImm8(); this.f = evaluateFlags(this.r.A, this.f, { cy: false, ac: false }); break; } // XRI
        case 0xf6: { this.r.A |= readImm8(); this.f = evaluateFlags(this.r.A, this.f, { cy: false, ac: false }); break; } // ORI
        case 0xfe: { const out = aluSub(this.r.A, readImm8(), 0, this.f); this.f = out.flags; break; } // CPI
        case 0xc3: this.pc = readImm16(); break; // JMP
        case 0xcd: { const t = readImm16(); this.push16(this.pc); this.pc = t; break; } // CALL
        case 0xc9: this.pc = this.pop16(); break; // RET
        case 0xdb: this.r.A = this.ioPorts[readImm8()]; break; // IN
        case 0xd3: this.ioPorts[readImm8()] = this.r.A; break; // OUT
        case 0xfb: this.interruptsEnabled = true; break; // EI
        case 0xf3: this.interruptsEnabled = false; break; // DI
        case 0x30: { // SIM
          if (this.r.A & 0x08) this.interruptMask = this.r.A & 0x07;
          if (this.r.A & 0x10) this.pendingInterrupts.delete('RST7.5');
          break;
        }
        case 0x20: { // RIM
          const p75 = this.pendingInterrupts.has('RST7.5') ? 0x40 : 0;
          const p65 = this.pendingInterrupts.has('RST6.5') ? 0x20 : 0;
          const p55 = this.pendingInterrupts.has('RST5.5') ? 0x10 : 0;
          const ie = this.interruptsEnabled ? 0x08 : 0;
          this.r.A = p75 | p65 | p55 | ie | (this.interruptMask & 0x07);
          break;
        }
        default:
          this.halted = true;
          throw new Error(`Unimplemented or illegal opcode 0x${opcode.toString(16).toUpperCase()}`);
      }
    }

    this.instructionCount++;
    this.tStatesTotal += tDelta;
    this.machineCyclesTotal += cycles.length;

    const changedRegs: (keyof CpuRegisters | 'PC' | 'SP')[] = [];
    (Object.keys(this.r) as (keyof CpuRegisters)[]).forEach((k) => {
      if (this.r[k] !== prevReg[k]) changedRegs.push(k);
    });
    if (this.pc !== prevPC) changedRegs.push('PC');
    if (this.sp !== prevSP) changedRegs.push('SP');

    const changedFlags: (keyof CpuFlags)[] = [];
    (Object.keys(this.f) as (keyof CpuFlags)[]).forEach((k) => {
      if (this.f[k] !== prevFlags[k]) changedFlags.push(k);
    });

    const busRoutes = row?.mnemonic ? getBusAnimationRoute(row.mnemonic, row.operands) : [];

    return this.recordSnapshot(
      execAddr,
      row ? row.raw.trim() : `OP 0x${opcode.toString(16).toUpperCase()}`,
      cycles,
      tDelta,
      changedRegs,
      changedFlags,
      busRoutes
    );
  }

  stepBack(): ExecutionSnapshot | null {
    const current = this.history.getCurrent();
    const prev = this.history.stepBack();
    if (!current || !prev) return null;
    // Revert memory mutations made during the step we are undoing
    for (let i = current.memoryMutations.length - 1; i >= 0; i--) {
      const m = current.memoryMutations[i];
      this.mem[m.address] = m.oldValue;
    }
    this.restoreStateOnly(prev);
    return prev;
  }

  jumpToHistoryStep(index: number): ExecutionSnapshot | null {
    const target = this.history.jumpTo(index);
    if (!target) return null;
    // Replay memory mutations from snapshot 0 up to target
    const all = this.history.getAll();
    // Reset program bytes first
    for (let s = all.length - 1; s > index; s--) {
      for (let m = all[s].memoryMutations.length - 1; m >= 0; m--) {
        const mut = all[s].memoryMutations[m];
        this.mem[mut.address] = mut.oldValue;
      }
    }
    for (let s = 0; s <= index; s++) {
      for (const mut of all[s].memoryMutations) {
        this.mem[mut.address] = mut.newValue;
      }
    }
    this.restoreStateOnly(target);
    return target;
  }

  private restoreFromSnapshot(snap: ExecutionSnapshot, direction: 'forward' | 'backward'): void {
    if (direction === 'forward') {
      for (const m of snap.memoryMutations) {
        this.mem[m.address] = m.newValue;
      }
    }
    this.restoreStateOnly(snap);
  }

  private restoreStateOnly(snap: ExecutionSnapshot): void {
    this.r = { ...snap.registers };
    this.f = { ...snap.flags };
    this.pc = snap.pc;
    this.sp = snap.sp;
    this.halted = snap.halted;
    this.interruptsEnabled = snap.interruptsEnabled;
    this.interruptMask = snap.interruptMask;
    this.tStatesTotal = snap.tStatesTotal;
    this.machineCyclesTotal = snap.machineCyclesTotal;
  }

  private recordSnapshot(
    executedAddress: number | null,
    executedInstruction: string,
    machineCycles: MachineCycleType[],
    tStatesDelta: number,
    changedRegisters: (keyof CpuRegisters | 'PC' | 'SP')[],
    changedFlags: (keyof CpuFlags)[],
    busRoutes = executedAddress !== null && this.addressToRow[executedAddress]?.mnemonic
      ? getBusAnimationRoute(
          this.addressToRow[executedAddress].mnemonic!,
          this.addressToRow[executedAddress].operands
        )
      : []
  ): ExecutionSnapshot {
    const snap: ExecutionSnapshot = {
      stepIndex: this.history.getAll().length,
      pc: this.pc,
      sp: this.sp,
      registers: { ...this.r },
      flags: { ...this.f },
      halted: this.halted,
      interruptsEnabled: this.interruptsEnabled,
      interruptMask: this.interruptMask,
      tStatesTotal: this.tStatesTotal,
      machineCyclesTotal: this.machineCyclesTotal,
      executedAddress,
      executedInstruction,
      machineCycles,
      tStatesDelta,
      busRoutes,
      memoryMutations: [...this.currentMutations],
      changedRegisters,
      changedFlags,
    };
    this.history.push(snap);
    return snap;
  }
}