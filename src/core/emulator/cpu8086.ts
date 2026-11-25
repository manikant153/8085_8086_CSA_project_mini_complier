import {
  type Assembled8086Row,
  type Assembly8086Result,
  type BusPacket8086,
  type Cycle8086Type,
  get8086BusRoutes,
  parse8086Number,
} from '../isa/arch8086';

export interface Regs8086 {
  AX: number;
  BX: number;
  CX: number;
  DX: number;
  SI: number;
  DI: number;
  BP: number;
  SP: number;
  CS: number;
  DS: number;
  SS: number;
  ES: number;
}

export interface Flags8086 {
  OF: 0 | 1;
  DF: 0 | 1;
  IF: 0 | 1;
  TF: 0 | 1;
  SF: 0 | 1;
  ZF: 0 | 1;
  AF: 0 | 1;
  PF: 0 | 1;
  CF: 0 | 1;
}

export interface MemoryMutation8086 {
  address: number;
  oldValue: number;
  newValue: number;
}

export interface Snapshot8086 {
  stepIndex: number;
  ip: number;
  registers: Regs8086;
  flags: Flags8086;
  halted: boolean;
  tStatesTotal: number;
  machineCyclesTotal: number;
  executedAddress: number | null;
  executedInstruction: string;
  cycles: Cycle8086Type[];
  tStatesDelta: number;
  busRoutes: BusPacket8086[];
  memoryMutations: MemoryMutation8086[];
  changedRegisters: (keyof Regs8086 | 'IP')[];
  changedFlags: (keyof Flags8086)[];
}

function parity8(v: number): 0 | 1 {
  const b = v & 0xff;
  let c = 0;
  for (let i = 0; i < 8; i++) c += (b >> i) & 1;
  return c % 2 === 0 ? 1 : 0;
}

export class Cpu8086 {
  public r: Regs8086 = {
    AX: 0, BX: 0, CX: 0, DX: 0,
    SI: 0, DI: 0, BP: 0, SP: 0xfffe,
    CS: 0, DS: 0, SS: 0, ES: 0,
  };
  public f: Flags8086 = { OF: 0, DF: 0, IF: 1, TF: 0, SF: 0, ZF: 0, AF: 0, PF: 0, CF: 0 };
  public ip = 0x0100;
  public mem = new Uint8Array(65536);
  public ioPorts = new Uint8Array(256);
  public halted = false;
  public pendingNmi = false;
  public pendingIntr = false;

  public tStatesTotal = 0;
  public machineCyclesTotal = 0;
  public instructionCount = 0;

  public addressToRow: Record<number, Assembled8086Row> = {};
  public symbolTable: Record<string, number> = {};
  private snapshots: Snapshot8086[] = [];
  private cursor = -1;
  private currentMutations: MemoryMutation8086[] = [];

  constructor() {
    this.reset();
  }

  reset(entryPoint = 0x0100): void {
    this.r = {
      AX: 0, BX: 0, CX: 0, DX: 0,
      SI: 0, DI: 0, BP: 0, SP: 0xfffe,
      CS: 0, DS: 0, SS: 0, ES: 0,
    };
    this.f = { OF: 0, DF: 0, IF: 1, TF: 0, SF: 0, ZF: 0, AF: 0, PF: 0, CF: 0 };
    this.ip = entryPoint & 0xffff;
    this.mem.fill(0);
    this.ioPorts.fill(0);
    this.halted = false;
    this.pendingNmi = false;
    this.pendingIntr = false;
    this.tStatesTotal = 0;
    this.machineCyclesTotal = 0;
    this.instructionCount = 0;
    this.addressToRow = {};
    this.symbolTable = {};
    this.snapshots = [];
    this.cursor = -1;
    this.pushSnapshot(null, 'RESET', [], 0, [], [], []);
  }

  loadProgram(assembly: Assembly8086Result): void {
    this.reset(assembly.entryPoint);
    this.addressToRow = assembly.addressToRow;
    this.symbolTable = assembly.symbolTable;
    for (const seg of assembly.segments) {
      for (let i = 0; i < seg.bytes.length; i++) {
        this.mem[(seg.startAddress + i) & 0xffff] = seg.bytes[i] & 0xff;
      }
    }
    this.snapshots = [];
    this.cursor = -1;
    this.pushSnapshot(null, 'LOADED', [], 0, [], [], []);
  }

  setInputPort(port: number, val: number): void {
    this.ioPorts[port & 0xff] = val & 0xff;
  }

  getSnapshots(): Snapshot8086[] {
    return this.snapshots;
  }

  getCursor(): number {
    return this.cursor;
  }

  getCurrentSnapshot(): Snapshot8086 | null {
    return this.cursor >= 0 ? this.snapshots[this.cursor] : null;
  }

  canStepBack(): boolean {
    return this.cursor > 0;
  }

  canStepForward(): boolean {
    return this.cursor < this.snapshots.length - 1;
  }

  private writeMem8(addr: number, val: number): void {
    const a = addr & 0xffff;
    const v = val & 0xff;
    const oldVal = this.mem[a];
    if (oldVal !== v) {
      this.currentMutations.push({ address: a, oldValue: oldVal, newValue: v });
    }
    this.mem[a] = v;
  }

  private readMem16(addr: number): number {
    const lo = this.mem[addr & 0xffff];
    const hi = this.mem[(addr + 1) & 0xffff];
    return ((hi << 8) | lo) & 0xffff;
  }

  private writeMem16(addr: number, val: number): void {
    this.writeMem8(addr, val & 0xff);
    this.writeMem8((addr + 1) & 0xffff, (val >> 8) & 0xff);
  }

  private push16(val: number): void {
    this.r.SP = (this.r.SP - 2) & 0xffff;
    this.writeMem16(this.r.SP, val);
  }

  private pop16(): number {
    const v = this.readMem16(this.r.SP);
    this.r.SP = (this.r.SP + 2) & 0xffff;
    return v;
  }

  private resolveEffectiveAddress(op: string): number {
    const inner = op.trim().slice(1, -1).toUpperCase().trim();
    const parts = inner.split('+').map((p) => p.trim());
    let addr = 0;
    for (const p of parts) {
      if (p === 'BX') addr += this.r.BX;
      else if (p === 'SI') addr += this.r.SI;
      else if (p === 'DI') addr += this.r.DI;
      else if (p === 'BP') addr += this.r.BP;
      else if (p in this.symbolTable) addr += this.symbolTable[p];
      else addr += parse8086Number(p);
    }
    return addr & 0xffff;
  }

  private is8BitReg(op: string): boolean {
    return ['AL', 'AH', 'BL', 'BH', 'CL', 'CH', 'DL', 'DH'].includes(op.trim().toUpperCase());
  }

  private readOperand(op: string): { value: number; is8Bit: boolean } {
    const clean = op.trim().toUpperCase();
    if (clean.startsWith('[') && clean.endsWith(']')) {
      const ea = this.resolveEffectiveAddress(clean);
      return { value: this.readMem16(ea), is8Bit: false };
    }
    switch (clean) {
      case 'AX': return { value: this.r.AX, is8Bit: false };
      case 'BX': return { value: this.r.BX, is8Bit: false };
      case 'CX': return { value: this.r.CX, is8Bit: false };
      case 'DX': return { value: this.r.DX, is8Bit: false };
      case 'SI': return { value: this.r.SI, is8Bit: false };
      case 'DI': return { value: this.r.DI, is8Bit: false };
      case 'BP': return { value: this.r.BP, is8Bit: false };
      case 'SP': return { value: this.r.SP, is8Bit: false };
      case 'CS': return { value: this.r.CS, is8Bit: false };
      case 'DS': return { value: this.r.DS, is8Bit: false };
      case 'SS': return { value: this.r.SS, is8Bit: false };
      case 'ES': return { value: this.r.ES, is8Bit: false };
      case 'AL': return { value: this.r.AX & 0xff, is8Bit: true };
      case 'AH': return { value: (this.r.AX >> 8) & 0xff, is8Bit: true };
      case 'BL': return { value: this.r.BX & 0xff, is8Bit: true };
      case 'BH': return { value: (this.r.BX >> 8) & 0xff, is8Bit: true };
      case 'CL': return { value: this.r.CX & 0xff, is8Bit: true };
      case 'CH': return { value: (this.r.CX >> 8) & 0xff, is8Bit: true };
      case 'DL': return { value: this.r.DX & 0xff, is8Bit: true };
      case 'DH': return { value: (this.r.DX >> 8) & 0xff, is8Bit: true };
      default:
        if (clean in this.symbolTable) return { value: this.symbolTable[clean], is8Bit: false };
        return { value: parse8086Number(op), is8Bit: false };
    }
  }

  private writeOperand(op: string, val: number, is8Bit = false): void {
    const clean = op.trim().toUpperCase();
    if (clean.startsWith('[') && clean.endsWith(']')) {
      const ea = this.resolveEffectiveAddress(clean);
      if (is8Bit) this.writeMem8(ea, val);
      else this.writeMem16(ea, val);
      return;
    }
    const v16 = val & 0xffff;
    const v8 = val & 0xff;
    switch (clean) {
      case 'AX': this.r.AX = v16; break;
      case 'BX': this.r.BX = v16; break;
      case 'CX': this.r.CX = v16; break;
      case 'DX': this.r.DX = v16; break;
      case 'SI': this.r.SI = v16; break;
      case 'DI': this.r.DI = v16; break;
      case 'BP': this.r.BP = v16; break;
      case 'SP': this.r.SP = v16; break;
      case 'CS': this.r.CS = v16; break;
      case 'DS': this.r.DS = v16; break;
      case 'SS': this.r.SS = v16; break;
      case 'ES': this.r.ES = v16; break;
      case 'AL': this.r.AX = (this.r.AX & 0xff00) | v8; break;
      case 'AH': this.r.AX = (this.r.AX & 0x00ff) | (v8 << 8); break;
      case 'BL': this.r.BX = (this.r.BX & 0xff00) | v8; break;
      case 'BH': this.r.BX = (this.r.BX & 0x00ff) | (v8 << 8); break;
      case 'CL': this.r.CX = (this.r.CX & 0xff00) | v8; break;
      case 'CH': this.r.CX = (this.r.CX & 0x00ff) | (v8 << 8); break;
      case 'DL': this.r.DX = (this.r.DX & 0xff00) | v8; break;
      case 'DH': this.r.DX = (this.r.DX & 0x00ff) | (v8 << 8); break;
    }
  }

  private updateArithFlags(res: number, is8Bit: boolean, cf: boolean, af: boolean, of: boolean, updateCF = true): void {
    const mask = is8Bit ? 0xff : 0xffff;
    const signBit = is8Bit ? 0x80 : 0x8000;
    const masked = res & mask;
    this.f.SF = (masked & signBit) !== 0 ? 1 : 0;
    this.f.ZF = masked === 0 ? 1 : 0;
    this.f.PF = parity8(masked);
    this.f.AF = af ? 1 : 0;
    this.f.OF = of ? 1 : 0;
    if (updateCF) this.f.CF = cf ? 1 : 0;
  }

  step(): Snapshot8086 {
    if (this.canStepForward()) {
      this.cursor++;
      const snap = this.snapshots[this.cursor];
      for (const m of snap.memoryMutations) this.mem[m.address] = m.newValue;
      this.restoreState(snap);
      return snap;
    }

    if (this.halted) {
      return this.snapshots[this.cursor];
    }

    const execAddr = this.ip;
    const row = this.addressToRow[execAddr];
    if (!row || !row.mnemonic) {
      this.halted = true;
      return this.snapshots[this.cursor];
    }

    const prevReg = { ...this.r };
    const prevFlags = { ...this.f };
    const prevIP = this.ip;
    this.currentMutations = [];

    this.ip = (this.ip + row.size) & 0xffff;
    const m = row.mnemonic.toUpperCase();
    const ops = row.operands;

    switch (m) {
      case 'HLT':
        this.halted = true;
        break;
      case 'NOP':
        break;
      case 'MOV': {
        const is8 = this.is8BitReg(ops[0]) || this.is8BitReg(ops[1]);
        const src = this.readOperand(ops[1]).value;
        this.writeOperand(ops[0], src, is8);
        break;
      }
      case 'XCHG': {
        const a = this.readOperand(ops[0]).value;
        const b = this.readOperand(ops[1]).value;
        this.writeOperand(ops[0], b);
        this.writeOperand(ops[1], a);
        break;
      }
      case 'LEA': {
        const ea = this.resolveEffectiveAddress(ops[1]);
        this.writeOperand(ops[0], ea);
        break;
      }
      case 'PUSH':
        this.push16(this.readOperand(ops[0]).value);
        break;
      case 'POP':
        this.writeOperand(ops[0], this.pop16());
        break;
      case 'IN': {
        const port = this.readOperand(ops[1]).value & 0xff;
        this.writeOperand(ops[0], this.ioPorts[port], this.is8BitReg(ops[0]));
        break;
      }
      case 'OUT': {
        const port = this.readOperand(ops[0]).value & 0xff;
        this.ioPorts[port] = this.readOperand(ops[1]).value & 0xff;
        break;
      }
      case 'ADD':
      case 'ADC': {
        const is8 = this.is8BitReg(ops[0]);
        const a = this.readOperand(ops[0]).value;
        const b = this.readOperand(ops[1]).value;
        const carry = m === 'ADC' ? this.f.CF : 0;
        const sum = a + b + carry;
        const mask = is8 ? 0xff : 0xffff;
        const sign = is8 ? 0x80 : 0x8000;
        const of = (((a ^ sum) & (b ^ sum)) & sign) !== 0;
        this.writeOperand(ops[0], sum, is8);
        this.updateArithFlags(sum, is8, sum > mask, ((a & 0xf) + (b & 0xf) + carry) > 0xf, of);
        break;
      }
      case 'SUB':
      case 'SBB':
      case 'CMP': {
        const is8 = this.is8BitReg(ops[0]);
        const a = this.readOperand(ops[0]).value;
        const b = this.readOperand(ops[1]).value;
        const borrow = m === 'SBB' ? this.f.CF : 0;
        const diff = a - b - borrow;
        const sign = is8 ? 0x80 : 0x8000;
        const of = (((a ^ b) & (a ^ diff)) & sign) !== 0;
        if (m !== 'CMP') this.writeOperand(ops[0], diff, is8);
        this.updateArithFlags(diff, is8, diff < 0, ((a & 0xf) - (b & 0xf) - borrow) < 0, of);
        break;
      }
      case 'INC':
      case 'DEC': {
        const is8 = this.is8BitReg(ops[0]);
        const a = this.readOperand(ops[0]).value;
        const res = m === 'INC' ? a + 1 : a - 1;
        this.writeOperand(ops[0], res, is8);
        this.updateArithFlags(res, is8, false, false, false, false);
        break;
      }
      case 'MUL': {
        const src = this.readOperand(ops[0]).value;
        if (this.is8BitReg(ops[0])) {
          const prod = (this.r.AX & 0xff) * (src & 0xff);
          this.r.AX = prod & 0xffff;
          const hi = (prod >> 8) & 0xff;
          this.f.CF = hi !== 0 ? 1 : 0;
          this.f.OF = this.f.CF;
        } else {
          const prod = this.r.AX * src;
          this.r.AX = prod & 0xffff;
          this.r.DX = (prod >> 16) & 0xffff;
          this.f.CF = this.r.DX !== 0 ? 1 : 0;
          this.f.OF = this.f.CF;
        }
        break;
      }
      case 'DIV': {
        const src = this.readOperand(ops[0]).value;
        if (src !== 0) {
          if (this.is8BitReg(ops[0])) {
            const q = Math.floor(this.r.AX / (src & 0xff)) & 0xff;
            const rem = (this.r.AX % (src & 0xff)) & 0xff;
            this.r.AX = (rem << 8) | q;
          } else {
            const dividend = ((this.r.DX << 16) | this.r.AX) >>> 0;
            this.r.AX = Math.floor(dividend / src) & 0xffff;
            this.r.DX = (dividend % src) & 0xffff;
          }
        }
        break;
      }
      case 'AND':
      case 'OR':
      case 'XOR': {
        const is8 = this.is8BitReg(ops[0]);
        const a = this.readOperand(ops[0]).value;
        const b = this.readOperand(ops[1]).value;
        const res = m === 'AND' ? a & b : m === 'OR' ? a | b : a ^ b;
        this.writeOperand(ops[0], res, is8);
        this.updateArithFlags(res, is8, false, false, false);
        break;
      }
      case 'NOT': {
        const is8 = this.is8BitReg(ops[0]);
        this.writeOperand(ops[0], ~this.readOperand(ops[0]).value, is8);
        break;
      }
      case 'NEG': {
        const is8 = this.is8BitReg(ops[0]);
        const v = this.readOperand(ops[0]).value;
        const res = -v;
        this.writeOperand(ops[0], res, is8);
        this.updateArithFlags(res, is8, v !== 0, false, false);
        break;
      }
      case 'SHL':
      case 'SHR': {
        const is8 = this.is8BitReg(ops[0]);
        const count = this.readOperand(ops[1]).value & 0x1f;
        const a = this.readOperand(ops[0]).value;
        const res = m === 'SHL' ? a << count : a >>> count;
        this.writeOperand(ops[0], res, is8);
        this.updateArithFlags(res, is8, false, false, false);
        break;
      }
      case 'JMP':
        this.ip = this.readOperand(ops[0]).value;
        break;
      case 'JE':
      case 'JZ':
        if (this.f.ZF === 1) this.ip = this.readOperand(ops[0]).value;
        break;
      case 'JNE':
      case 'JNZ':
        if (this.f.ZF === 0) this.ip = this.readOperand(ops[0]).value;
        break;
      case 'JC':
        if (this.f.CF === 1) this.ip = this.readOperand(ops[0]).value;
        break;
      case 'JNC':
        if (this.f.CF === 0) this.ip = this.readOperand(ops[0]).value;
        break;
      case 'LOOP':
        this.r.CX = (this.r.CX - 1) & 0xffff;
        if (this.r.CX !== 0) this.ip = this.readOperand(ops[0]).value;
        break;
      case 'CALL':
        this.push16(this.ip);
        this.ip = this.readOperand(ops[0]).value;
        break;
      case 'RET':
        this.ip = this.pop16();
        break;
      case 'CLC': this.f.CF = 0; break;
      case 'STC': this.f.CF = 1; break;
      case 'CLI': this.f.IF = 0; break;
      case 'STI': this.f.IF = 1; break;
    }

    this.instructionCount++;
    this.tStatesTotal += row.tStates;
    this.machineCyclesTotal += row.cycles.length;

    const changedRegs: (keyof Regs8086 | 'IP')[] = [];
    (Object.keys(this.r) as (keyof Regs8086)[]).forEach((k) => {
      if (this.r[k] !== prevReg[k]) changedRegs.push(k);
    });
    if (this.ip !== prevIP) changedRegs.push('IP');

    const changedFlags: (keyof Flags8086)[] = [];
    (Object.keys(this.f) as (keyof Flags8086)[]).forEach((k) => {
      if (this.f[k] !== prevFlags[k]) changedFlags.push(k);
    });

    return this.pushSnapshot(
      execAddr,
      row.raw.trim(),
      row.cycles,
      row.tStates,
      changedRegs,
      changedFlags,
      get8086BusRoutes(m, ops)
    );
  }

  stepBack(): Snapshot8086 | null {
    if (!this.canStepBack()) return null;
    const current = this.snapshots[this.cursor];
    for (let i = current.memoryMutations.length - 1; i >= 0; i--) {
      const mut = current.memoryMutations[i];
      this.mem[mut.address] = mut.oldValue;
    }
    this.cursor--;
    const prev = this.snapshots[this.cursor];
    this.restoreState(prev);
    return prev;
  }

  jumpToStep(index: number): Snapshot8086 | null {
    if (index < 0 || index >= this.snapshots.length) return null;
    for (let s = this.snapshots.length - 1; s > index; s--) {
      for (let i = this.snapshots[s].memoryMutations.length - 1; i >= 0; i--) {
        const mut = this.snapshots[s].memoryMutations[i];
        this.mem[mut.address] = mut.oldValue;
      }
    }
    for (let s = 0; s <= index; s++) {
      for (const mut of this.snapshots[s].memoryMutations) {
        this.mem[mut.address] = mut.newValue;
      }
    }
    this.cursor = index;
    const target = this.snapshots[index];
    this.restoreState(target);
    return target;
  }

  private restoreState(snap: Snapshot8086): void {
    this.r = { ...snap.registers };
    this.f = { ...snap.flags };
    this.ip = snap.ip;
    this.halted = snap.halted;
    this.tStatesTotal = snap.tStatesTotal;
    this.machineCyclesTotal = snap.machineCyclesTotal;
  }

  private pushSnapshot(
    executedAddress: number | null,
    executedInstruction: string,
    cycles: Cycle8086Type[],
    tStatesDelta: number,
    changedRegisters: (keyof Regs8086 | 'IP')[],
    changedFlags: (keyof Flags8086)[],
    busRoutes: BusPacket8086[]
  ): Snapshot8086 {
    if (this.cursor < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.cursor + 1);
    }
    const snap: Snapshot8086 = {
      stepIndex: this.snapshots.length,
      ip: this.ip,
      registers: { ...this.r },
      flags: { ...this.f },
      halted: this.halted,
      tStatesTotal: this.tStatesTotal,
      machineCyclesTotal: this.machineCyclesTotal,
      executedAddress,
      executedInstruction,
      cycles,
      tStatesDelta,
      busRoutes,
      memoryMutations: [...this.currentMutations],
      changedRegisters,
      changedFlags,
    };
    this.snapshots.push(snap);
    if (this.snapshots.length > 2000) {
      this.snapshots.shift();
    }
    this.cursor = this.snapshots.length - 1;
    return snap;
  }
}