export type MachineCycleType = 'OF' | 'MR' | 'MW' | 'IOR' | 'IOW' | 'INA' | 'BI';

export type OperandPattern =
  | 'NONE'
  | 'REG'
  | 'REG_REG'
  | 'REG_D8'
  | 'RP_D16'
  | 'RP'
  | 'RP_BD'
  | 'RP_PSW'
  | 'D8'
  | 'A16'
  | 'LABEL'
  | 'RST_NUM';

export interface InstructionDef {
  mnemonic: string;
  pattern: OperandPattern;
  bytes: 1 | 2 | 3;
  tStates: number | [number, number]; // [taken, notTaken] for conditional branches
  machineCycles: MachineCycleType[];
  description: string;
  encode: (operands: string[], resolvedValue?: number) => number[];
}

export const REG_CODES: Record<string, number> = {
  B: 0,
  C: 1,
  D: 2,
  E: 3,
  H: 4,
  L: 5,
  M: 6,
  A: 7,
};

export const RP_CODES: Record<string, number> = {
  B: 0,
  BC: 0,
  D: 1,
  DE: 1,
  H: 2,
  HL: 2,
  SP: 3,
};

export const RP_PSW_CODES: Record<string, number> = {
  B: 0,
  BC: 0,
  D: 1,
  DE: 1,
  H: 2,
  HL: 2,
  PSW: 3,
};

export function regCode(reg: string): number {
  const key = reg.trim().toUpperCase();
  if (!(key in REG_CODES)) throw new Error(`Invalid register: ${reg}`);
  return REG_CODES[key];
}

export function rpCode(rp: string, allowPSW = false): number {
  const key = rp.trim().toUpperCase();
  const map = allowPSW ? RP_PSW_CODES : RP_CODES;
  if (!(key in map)) throw new Error(`Invalid register pair: ${rp}`);
  return map[key];
}

export function parseNumber(token: string): number {
  const s = token.trim().toUpperCase();
  if (/^'.'$/.test(token.trim())) return token.trim().charCodeAt(1);
  if (/^0X[0-9A-F]+$/.test(s)) return parseInt(s.slice(2), 16);
  if (/^[0-9][0-9A-F]*H$/.test(s)) return parseInt(s.slice(0, -1), 16);
  if (/^[01]+B$/.test(s)) return parseInt(s.slice(0, -1), 2);
  if (/^[-+]?\d+$/.test(s)) return parseInt(s, 10);
  throw new Error(`Invalid numeric literal: ${token}`);
}

const lo = (v: number) => v & 0xff;
const hi = (v: number) => (v >> 8) & 0xff;
const val8 = (o: string, resolved?: number) => (resolved !== undefined ? resolved : parseNumber(o)) & 0xff;
const val16 = (o: string, resolved?: number) => (resolved !== undefined ? resolved : parseNumber(o)) & 0xffff;

export const ISA_TABLE: Record<string, InstructionDef> = {
  // ==================== DATA TRANSFER ====================
  MOV: {
    mnemonic: 'MOV',
    pattern: 'REG_REG',
    bytes: 1,
    tStates: 4, // 7 when M is involved (handled dynamically in CPU/Analyzer)
    machineCycles: ['OF'],
    description: 'Copy source register/memory into destination register/memory',
    encode: ([dst, src]) => {
      if (dst === 'M' && src === 'M') throw new Error('MOV M, M is invalid (opcode 76H is HLT)');
      return [0x40 | (regCode(dst) << 3) | regCode(src)];
    },
  },
  MVI: {
    mnemonic: 'MVI',
    pattern: 'REG_D8',
    bytes: 2,
    tStates: 7, // 10 for MVI M, d8
    machineCycles: ['OF', 'MR'],
    description: 'Load 8-bit immediate data into register or memory (M)',
    encode: ([dst, d8], res) => [0x06 | (regCode(dst) << 3), val8(d8, res)],
  },
  LXI: {
    mnemonic: 'LXI',
    pattern: 'RP_D16',
    bytes: 3,
    tStates: 10,
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Load 16-bit immediate value into register pair',
    encode: ([rp, d16], res) => {
      const v = val16(d16, res);
      return [0x01 | (rpCode(rp) << 4), lo(v), hi(v)];
    },
  },
  LDA: {
    mnemonic: 'LDA',
    pattern: 'A16',
    bytes: 3,
    tStates: 13,
    machineCycles: ['OF', 'MR', 'MR', 'MR'],
    description: 'Load Accumulator directly from 16-bit memory address',
    encode: ([a16], res) => {
      const v = val16(a16, res);
      return [0x3a, lo(v), hi(v)];
    },
  },
  STA: {
    mnemonic: 'STA',
    pattern: 'A16',
    bytes: 3,
    tStates: 13,
    machineCycles: ['OF', 'MR', 'MR', 'MW'],
    description: 'Store Accumulator directly into 16-bit memory address',
    encode: ([a16], res) => {
      const v = val16(a16, res);
      return [0x32, lo(v), hi(v)];
    },
  },
  LHLD: {
    mnemonic: 'LHLD',
    pattern: 'A16',
    bytes: 3,
    tStates: 16,
    machineCycles: ['OF', 'MR', 'MR', 'MR', 'MR'],
    description: 'Load H and L registers directly from consecutive memory addresses',
    encode: ([a16], res) => {
      const v = val16(a16, res);
      return [0x2a, lo(v), hi(v)];
    },
  },
  SHLD: {
    mnemonic: 'SHLD',
    pattern: 'A16',
    bytes: 3,
    tStates: 16,
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Store H and L registers directly into consecutive memory addresses',
    encode: ([a16], res) => {
      const v = val16(a16, res);
      return [0x22, lo(v), hi(v)];
    },
  },
  LDAX: {
    mnemonic: 'LDAX',
    pattern: 'RP_BD',
    bytes: 1,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Load Accumulator indirect from address in BC or DE',
    encode: ([rp]) => {
      const p = rpCode(rp);
      if (p !== 0 && p !== 1) throw new Error('LDAX only supports B/BC or D/DE');
      return [p === 0 ? 0x0a : 0x1a];
    },
  },
  STAX: {
    mnemonic: 'STAX',
    pattern: 'RP_BD',
    bytes: 1,
    tStates: 7,
    machineCycles: ['OF', 'MW'],
    description: 'Store Accumulator indirect into address in BC or DE',
    encode: ([rp]) => {
      const p = rpCode(rp);
      if (p !== 0 && p !== 1) throw new Error('STAX only supports B/BC or D/DE');
      return [p === 0 ? 0x02 : 0x12];
    },
  },
  XCHG: {
    mnemonic: 'XCHG',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Exchange contents of HL with DE register pair',
    encode: () => [0xeb],
  },

  // ==================== ARITHMETIC ====================
  ADD: {
    mnemonic: 'ADD',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Add register or memory (M) to Accumulator',
    encode: ([r]) => [0x80 | regCode(r)],
  },
  ADI: {
    mnemonic: 'ADI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Add 8-bit immediate value to Accumulator',
    encode: ([d8], res) => [0xc6, val8(d8, res)],
  },
  ADC: {
    mnemonic: 'ADC',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Add register/memory and Carry flag to Accumulator',
    encode: ([r]) => [0x88 | regCode(r)],
  },
  ACI: {
    mnemonic: 'ACI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Add 8-bit immediate value and Carry flag to Accumulator',
    encode: ([d8], res) => [0xce, val8(d8, res)],
  },
  SUB: {
    mnemonic: 'SUB',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Subtract register or memory (M) from Accumulator',
    encode: ([r]) => [0x90 | regCode(r)],
  },
  SUI: {
    mnemonic: 'SUI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Subtract 8-bit immediate value from Accumulator',
    encode: ([d8], res) => [0xd6, val8(d8, res)],
  },
  SBB: {
    mnemonic: 'SBB',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Subtract register/memory and Borrow (CY) from Accumulator',
    encode: ([r]) => [0x98 | regCode(r)],
  },
  SBI: {
    mnemonic: 'SBI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Subtract 8-bit immediate and Borrow (CY) from Accumulator',
    encode: ([d8], res) => [0xde, val8(d8, res)],
  },
  INR: {
    mnemonic: 'INR',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Increment register or memory (M) by 1 (CY unaffected)',
    encode: ([r]) => [0x04 | (regCode(r) << 3)],
  },
  DCR: {
    mnemonic: 'DCR',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Decrement register or memory (M) by 1 (CY unaffected)',
    encode: ([r]) => [0x05 | (regCode(r) << 3)],
  },
  INX: {
    mnemonic: 'INX',
    pattern: 'RP',
    bytes: 1,
    tStates: 6,
    machineCycles: ['OF'],
    description: 'Increment 16-bit register pair by 1 (no flags affected)',
    encode: ([rp]) => [0x03 | (rpCode(rp) << 4)],
  },
  DCX: {
    mnemonic: 'DCX',
    pattern: 'RP',
    bytes: 1,
    tStates: 6,
    machineCycles: ['OF'],
    description: 'Decrement 16-bit register pair by 1 (no flags affected)',
    encode: ([rp]) => [0x0b | (rpCode(rp) << 4)],
  },
  DAD: {
    mnemonic: 'DAD',
    pattern: 'RP',
    bytes: 1,
    tStates: 10,
    machineCycles: ['OF', 'BI', 'BI'],
    description: 'Add 16-bit register pair to HL (only CY affected)',
    encode: ([rp]) => [0x09 | (rpCode(rp) << 4)],
  },
  DAA: {
    mnemonic: 'DAA',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Decimal Adjust Accumulator for BCD arithmetic',
    encode: () => [0x27],
  },

  // ==================== LOGICAL & ROTATE ====================
  ANA: {
    mnemonic: 'ANA',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Logical AND register/memory with Accumulator',
    encode: ([r]) => [0xa0 | regCode(r)],
  },
  ANI: {
    mnemonic: 'ANI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Logical AND 8-bit immediate with Accumulator',
    encode: ([d8], res) => [0xe6, val8(d8, res)],
  },
  ORA: {
    mnemonic: 'ORA',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Logical OR register/memory with Accumulator',
    encode: ([r]) => [0xb0 | regCode(r)],
  },
  ORI: {
    mnemonic: 'ORI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Logical OR 8-bit immediate with Accumulator',
    encode: ([d8], res) => [0xf6, val8(d8, res)],
  },
  XRA: {
    mnemonic: 'XRA',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Logical XOR register/memory with Accumulator',
    encode: ([r]) => [0xa8 | regCode(r)],
  },
  XRI: {
    mnemonic: 'XRI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Logical XOR 8-bit immediate with Accumulator',
    encode: ([d8], res) => [0xee, val8(d8, res)],
  },
  CMP: {
    mnemonic: 'CMP',
    pattern: 'REG',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Compare register/memory with Accumulator (A - r)',
    encode: ([r]) => [0xb8 | regCode(r)],
  },
  CPI: {
    mnemonic: 'CPI',
    pattern: 'D8',
    bytes: 2,
    tStates: 7,
    machineCycles: ['OF', 'MR'],
    description: 'Compare 8-bit immediate with Accumulator (A - d8)',
    encode: ([d8], res) => [0xfe, val8(d8, res)],
  },
  RLC: {
    mnemonic: 'RLC',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Rotate Accumulator left; MSB goes to LSB and CY',
    encode: () => [0x07],
  },
  RRC: {
    mnemonic: 'RRC',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Rotate Accumulator right; LSB goes to MSB and CY',
    encode: () => [0x0f],
  },
  RAL: {
    mnemonic: 'RAL',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Rotate Accumulator left through Carry',
    encode: () => [0x17],
  },
  RAR: {
    mnemonic: 'RAR',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Rotate Accumulator right through Carry',
    encode: () => [0x1f],
  },
  CMA: {
    mnemonic: 'CMA',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Complement Accumulator (1s complement)',
    encode: () => [0x2f],
  },
  CMC: {
    mnemonic: 'CMC',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Complement Carry flag',
    encode: () => [0x3f],
  },
  STC: {
    mnemonic: 'STC',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Set Carry flag to 1',
    encode: () => [0x37],
  },

  // ==================== BRANCH & SUBROUTINE ====================
  JMP: {
    mnemonic: 'JMP',
    pattern: 'LABEL',
    bytes: 3,
    tStates: 10,
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Unconditional jump to 16-bit target address',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xc3, lo(v), hi(v)];
    },
  },
  JZ: {
    mnemonic: 'JZ',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Zero flag is set (Z = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xca, lo(v), hi(v)];
    },
  },
  JNZ: {
    mnemonic: 'JNZ',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Zero flag is clear (Z = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xc2, lo(v), hi(v)];
    },
  },
  JC: {
    mnemonic: 'JC',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Carry flag is set (CY = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xda, lo(v), hi(v)];
    },
  },
  JNC: {
    mnemonic: 'JNC',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Carry flag is clear (CY = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xd2, lo(v), hi(v)];
    },
  },
  JP: {
    mnemonic: 'JP',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Positive (Sign flag S = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xf2, lo(v), hi(v)];
    },
  },
  JM: {
    mnemonic: 'JM',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Minus (Sign flag S = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xfa, lo(v), hi(v)];
    },
  },
  JPE: {
    mnemonic: 'JPE',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Parity Even (P = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xea, lo(v), hi(v)];
    },
  },
  JPO: {
    mnemonic: 'JPO',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [10, 7],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Jump if Parity Odd (P = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xe2, lo(v), hi(v)];
    },
  },
  CALL: {
    mnemonic: 'CALL',
    pattern: 'LABEL',
    bytes: 3,
    tStates: 18,
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Push return address onto stack and jump to subroutine',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xcd, lo(v), hi(v)];
    },
  },
  CZ: {
    mnemonic: 'CZ',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Zero flag is set (Z = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xcc, lo(v), hi(v)];
    },
  },
  CNZ: {
    mnemonic: 'CNZ',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Zero flag is clear (Z = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xc4, lo(v), hi(v)];
    },
  },
  CC: {
    mnemonic: 'CC',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Carry flag is set (CY = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xdc, lo(v), hi(v)];
    },
  },
  CNC: {
    mnemonic: 'CNC',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Carry flag is clear (CY = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xd4, lo(v), hi(v)];
    },
  },
  CP: {
    mnemonic: 'CP',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Positive (S = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xf4, lo(v), hi(v)];
    },
  },
  CM: {
    mnemonic: 'CM',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Minus (S = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xfc, lo(v), hi(v)];
    },
  },
  CPE: {
    mnemonic: 'CPE',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Parity Even (P = 1)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xec, lo(v), hi(v)];
    },
  },
  CPO: {
    mnemonic: 'CPO',
    pattern: 'LABEL',
    bytes: 3,
    tStates: [18, 9],
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Call subroutine if Parity Odd (P = 0)',
    encode: ([addr], res) => {
      const v = val16(addr, res);
      return [0xe4, lo(v), hi(v)];
    },
  },
  RET: {
    mnemonic: 'RET',
    pattern: 'NONE',
    bytes: 1,
    tStates: 10,
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Pop return address from stack into PC',
    encode: () => [0xc9],
  },
  RZ: {
    mnemonic: 'RZ',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Zero flag is set (Z = 1)',
    encode: () => [0xc8],
  },
  RNZ: {
    mnemonic: 'RNZ',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Zero flag is clear (Z = 0)',
    encode: () => [0xc0],
  },
  RC: {
    mnemonic: 'RC',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Carry flag is set (CY = 1)',
    encode: () => [0xd8],
  },
  RNC: {
    mnemonic: 'RNC',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Carry flag is clear (CY = 0)',
    encode: () => [0xd0],
  },
  RP: {
    mnemonic: 'RP',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Positive (S = 0)',
    encode: () => [0xf0],
  },
  RM: {
    mnemonic: 'RM',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Minus (S = 1)',
    encode: () => [0xf8],
  },
  RPE: {
    mnemonic: 'RPE',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Parity Even (P = 1)',
    encode: () => [0xe8],
  },
  RPO: {
    mnemonic: 'RPO',
    pattern: 'NONE',
    bytes: 1,
    tStates: [12, 6],
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Return from subroutine if Parity Odd (P = 0)',
    encode: () => [0xe0],
  },
  PCHL: {
    mnemonic: 'PCHL',
    pattern: 'NONE',
    bytes: 1,
    tStates: 6,
    machineCycles: ['OF'],
    description: 'Load Program Counter with contents of HL',
    encode: () => [0xe9],
  },
  RST: {
    mnemonic: 'RST',
    pattern: 'RST_NUM',
    bytes: 1,
    tStates: 12,
    machineCycles: ['OF', 'MW', 'MW'],
    description: 'Software restart interrupt (calls 0000H to 0038H)',
    encode: ([n]) => {
      const idx = parseNumber(n);
      if (idx < 0 || idx > 7) throw new Error('RST operand must be 0–7');
      return [0xc7 | (idx << 3)];
    },
  },

  // ==================== STACK, I/O & MACHINE CONTROL ====================
  PUSH: {
    mnemonic: 'PUSH',
    pattern: 'RP_PSW',
    bytes: 1,
    tStates: 12,
    machineCycles: ['OF', 'MW', 'MW'],
    description: 'Push register pair or PSW onto stack',
    encode: ([rp]) => [0xc5 | (rpCode(rp, true) << 4)],
  },
  POP: {
    mnemonic: 'POP',
    pattern: 'RP_PSW',
    bytes: 1,
    tStates: 10,
    machineCycles: ['OF', 'MR', 'MR'],
    description: 'Pop top of stack into register pair or PSW',
    encode: ([rp]) => [0xc1 | (rpCode(rp, true) << 4)],
  },
  XTHL: {
    mnemonic: 'XTHL',
    pattern: 'NONE',
    bytes: 1,
    tStates: 16,
    machineCycles: ['OF', 'MR', 'MR', 'MW', 'MW'],
    description: 'Exchange top of stack with HL register pair',
    encode: () => [0xe3],
  },
  SPHL: {
    mnemonic: 'SPHL',
    pattern: 'NONE',
    bytes: 1,
    tStates: 6,
    machineCycles: ['OF'],
    description: 'Copy HL register pair into Stack Pointer (SP)',
    encode: () => [0xf9],
  },
  IN: {
    mnemonic: 'IN',
    pattern: 'D8',
    bytes: 2,
    tStates: 10,
    machineCycles: ['OF', 'MR', 'IOR'],
    description: 'Read 8-bit data from I/O port into Accumulator',
    encode: ([port], res) => [0xdb, val8(port, res)],
  },
  OUT: {
    mnemonic: 'OUT',
    pattern: 'D8',
    bytes: 2,
    tStates: 10,
    machineCycles: ['OF', 'MR', 'IOW'],
    description: 'Write Accumulator contents to 8-bit I/O port',
    encode: ([port], res) => [0xd3, val8(port, res)],
  },
  EI: {
    mnemonic: 'EI',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Enable hardware interrupts',
    encode: () => [0xfb],
  },
  DI: {
    mnemonic: 'DI',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Disable hardware interrupts',
    encode: () => [0xf3],
  },
  SIM: {
    mnemonic: 'SIM',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Set Interrupt Mask and serial output data (SOD)',
    encode: () => [0x30],
  },
  RIM: {
    mnemonic: 'RIM',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'Read Interrupt Mask, pending interrupts, and SID',
    encode: () => [0x20],
  },
  NOP: {
    mnemonic: 'NOP',
    pattern: 'NONE',
    bytes: 1,
    tStates: 4,
    machineCycles: ['OF'],
    description: 'No operation',
    encode: () => [0x00],
  },
  HLT: {
    mnemonic: 'HLT',
    pattern: 'NONE',
    bytes: 1,
    tStates: 5,
    machineCycles: ['OF', 'BI'],
    description: 'Halt processor execution',
    encode: () => [0x76],
  },
};