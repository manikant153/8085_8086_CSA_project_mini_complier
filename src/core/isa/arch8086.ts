import type { AssemblyDiagnostic } from '../assembler/parser';

export type ArchitectureId = '8085' | '8086';

export type BusNode8086 =
  | 'BIU_ADDER'
  | 'CS_IP'
  | 'SEG_REGS'
  | 'PREFETCH_Q'
  | 'CONTROL'
  | 'EU_REGS'
  | 'POINTERS'
  | 'ALU_16'
  | 'FLAGS_16'
  | 'INTERNAL_BUS'
  | 'ADDR_20'
  | 'MEMORY'
  | 'IO_PORT';

export interface BusPacket8086 {
  label: string;
  path: BusNode8086[];
}

export type Cycle8086Type = 'IF' | 'MR' | 'MW' | 'IOR' | 'IOW' | 'BI';

export interface Instruction8086Def {
  mnemonic: string;
  operands: string;
  category: 'Data Transfer' | 'Arithmetic' | 'Logic & Shift' | 'Control Flow' | 'String & Processor';
  description: string;
}

export const REG_8086_SET = new Set([
  'AX', 'BX', 'CX', 'DX',
  'AL', 'AH', 'BL', 'BH', 'CL', 'CH', 'DL', 'DH',
  'SI', 'DI', 'BP', 'SP', 'IP',
  'CS', 'DS', 'SS', 'ES',
]);

export const DIRECTIVES_8086 = new Set([
  'ORG', 'EQU', 'DB', 'DW', 'END',
]);

export const ISA_8086_LIST: Instruction8086Def[] = [
  { mnemonic: 'MOV', operands: 'dst, src', category: 'Data Transfer', description: 'Copy 8-bit or 16-bit data between registers, memory, or immediate' },
  { mnemonic: 'XCHG', operands: 'op1, op2', category: 'Data Transfer', description: 'Exchange contents of two 16-bit registers' },
  { mnemonic: 'LEA', operands: 'reg16, [mem]', category: 'Data Transfer', description: 'Load effective offset address into 16-bit register' },
  { mnemonic: 'PUSH', operands: 'src16', category: 'Data Transfer', description: 'Push 16-bit register onto stack (SP = SP - 2)' },
  { mnemonic: 'POP', operands: 'dst16', category: 'Data Transfer', description: 'Pop 16-bit word from stack into register (SP = SP + 2)' },
  { mnemonic: 'IN', operands: 'AL/AX, port', category: 'Data Transfer', description: 'Read byte or word from I/O port into AL/AX' },
  { mnemonic: 'OUT', operands: 'port, AL/AX', category: 'Data Transfer', description: 'Write AL/AX contents to I/O port' },
  { mnemonic: 'ADD', operands: 'dst, src', category: 'Arithmetic', description: 'Add source to destination and update 16-bit FLAGS' },
  { mnemonic: 'ADC', operands: 'dst, src', category: 'Arithmetic', description: 'Add source + Carry Flag (CF) to destination' },
  { mnemonic: 'SUB', operands: 'dst, src', category: 'Arithmetic', description: 'Subtract source from destination' },
  { mnemonic: 'SBB', operands: 'dst, src', category: 'Arithmetic', description: 'Subtract source + Borrow (CF) from destination' },
  { mnemonic: 'INC', operands: 'dst', category: 'Arithmetic', description: 'Increment register or memory by 1 (CF unaffected)' },
  { mnemonic: 'DEC', operands: 'dst', category: 'Arithmetic', description: 'Decrement register or memory by 1 (CF unaffected)' },
  { mnemonic: 'MUL', operands: 'src', category: 'Arithmetic', description: 'Unsigned multiply AL/AX by source (AX or DX:AX)' },
  { mnemonic: 'DIV', operands: 'src', category: 'Arithmetic', description: 'Unsigned divide AX or DX:AX by source' },
  { mnemonic: 'CMP', operands: 'op1, op2', category: 'Arithmetic', description: 'Compare operands (op1 - op2) and update FLAGS' },
  { mnemonic: 'NEG', operands: 'dst', category: 'Arithmetic', description: 'Two’s complement negation of destination' },
  { mnemonic: 'AND', operands: 'dst, src', category: 'Logic & Shift', description: 'Bitwise logical AND' },
  { mnemonic: 'OR', operands: 'dst, src', category: 'Logic & Shift', description: 'Bitwise logical OR' },
  { mnemonic: 'XOR', operands: 'dst, src', category: 'Logic & Shift', description: 'Bitwise logical XOR' },
  { mnemonic: 'NOT', operands: 'dst', category: 'Logic & Shift', description: 'Bitwise 1s complement' },
  { mnemonic: 'SHL', operands: 'dst, count', category: 'Logic & Shift', description: 'Shift bits left; MSB moves into CF' },
  { mnemonic: 'SHR', operands: 'dst, count', category: 'Logic & Shift', description: 'Shift bits right; LSB moves into CF' },
  { mnemonic: 'ROL', operands: 'dst, count', category: 'Logic & Shift', description: 'Rotate bits left' },
  { mnemonic: 'ROR', operands: 'dst, count', category: 'Logic & Shift', description: 'Rotate bits right' },
  { mnemonic: 'JMP', operands: 'label', category: 'Control Flow', description: 'Unconditional jump to target label' },
  { mnemonic: 'JE', operands: 'label', category: 'Control Flow', description: 'Jump if Equal / Zero (ZF = 1)' },
  { mnemonic: 'JNE', operands: 'label', category: 'Control Flow', description: 'Jump if Not Equal / Not Zero (ZF = 0)' },
  { mnemonic: 'JZ', operands: 'label', category: 'Control Flow', description: 'Jump if Zero (ZF = 1)' },
  { mnemonic: 'JNZ', operands: 'label', category: 'Control Flow', description: 'Jump if Not Zero (ZF = 0)' },
  { mnemonic: 'JC', operands: 'label', category: 'Control Flow', description: 'Jump if Carry (CF = 1)' },
  { mnemonic: 'JNC', operands: 'label', category: 'Control Flow', description: 'Jump if No Carry (CF = 0)' },
  { mnemonic: 'LOOP', operands: 'label', category: 'Control Flow', description: 'Decrement CX and jump if CX != 0' },
  { mnemonic: 'CALL', operands: 'label', category: 'Control Flow', description: 'Push return IP and jump to procedure' },
  { mnemonic: 'RET', operands: '', category: 'Control Flow', description: 'Pop return IP and return from procedure' },
  { mnemonic: 'INT', operands: 'vector', category: 'Control Flow', description: 'Software interrupt' },
  { mnemonic: 'CLC', operands: '', category: 'String & Processor', description: 'Clear Carry Flag (CF = 0)' },
  { mnemonic: 'STC', operands: '', category: 'String & Processor', description: 'Set Carry Flag (CF = 1)' },
  { mnemonic: 'CLI', operands: '', category: 'String & Processor', description: 'Clear Interrupt Flag (IF = 0)' },
  { mnemonic: 'STI', operands: '', category: 'String & Processor', description: 'Set Interrupt Flag (IF = 1)' },
  { mnemonic: 'NOP', operands: '', category: 'String & Processor', description: 'No operation' },
  { mnemonic: 'HLT', operands: '', category: 'String & Processor', description: 'Halt 8086 processor' },
];

export const ISA_8086_MAP: Record<string, Instruction8086Def> = Object.fromEntries(
  ISA_8086_LIST.map((item) => [item.mnemonic, item])
);

export const DEFAULT_8086_CODE = `; Intel 8086 16-Bit Block Sum
        ORG 0100H
        MOV AX, 0000H   ; Clear 16-bit accumulator
        MOV CX, 0005H   ; Loop counter = 5 words
        MOV BX, 1200H   ; Base offset in Data Segment
SUM_LP: ADD AX, [BX]    ; Add 16-bit word at DS:[BX]
        INC BX
        INC BX          ; Advance to next 16-bit word
        LOOP SUM_LP     ; Decrement CX and loop if CX != 0
        MOV [1300H], AX ; Store 16-bit sum at 1300H
        HLT

        ORG 1200H
        DW 0010H, 0025H, 0015H, 0030H, 0020H`;

export interface Assembled8086Row {
  lineNumber: number;
  address: number;
  raw: string;
  label: string | null;
  mnemonic: string | null;
  operands: string[];
  bytes: number[];
  size: number;
  tStates: number;
  cycles: Cycle8086Type[];
  isDirective: boolean;
}

export interface Assembly8086Result {
  success: boolean;
  entryPoint: number;
  rows: Assembled8086Row[];
  segments: { startAddress: number; bytes: number[] }[];
  symbolTable: Record<string, number>;
  addressToRow: Record<number, Assembled8086Row>;
  lineToAddress: Record<number, number>;
  totalBytes: number;
  diagnostics: AssemblyDiagnostic[];
}

export function parse8086Number(token: string): number {
  const s = token.trim().toUpperCase();
  if (/^'.'$/.test(token.trim())) return token.trim().charCodeAt(1);
  if (/^0X[0-9A-F]+$/.test(s)) return parseInt(s.slice(2), 16);
  if (/^[0-9][0-9A-F]*H$/.test(s)) return parseInt(s.slice(0, -1), 16);
  if (/^[01]+B$/.test(s)) return parseInt(s.slice(0, -1), 2);
  if (/^[-+]?\d+$/.test(s)) return parseInt(s, 10);
  throw new Error(`Invalid literal: ${token}`);
}

function estimate8086SizeAndCycles(mnemonic: string, operands: string[]): { size: number; tStates: number; cycles: Cycle8086Type[] } {
  const m = mnemonic.toUpperCase();
  const hasMem = operands.some((o) => o.includes('['));
  if (['NOP', 'HLT', 'RET', 'CLC', 'STC', 'CLI', 'STI'].includes(m)) {
    return {
      size: 1,
      tStates: m === 'RET' ? 16 : m === 'HLT' ? 2 : 3,
      cycles: m === 'RET' ? ['IF', 'MR'] : ['IF'],
    };
  }
  if (['PUSH', 'POP', 'INC', 'DEC'].includes(m)) {
    return {
      size: hasMem ? 4 : 1,
      tStates: m === 'PUSH' ? 11 : m === 'POP' ? 8 : hasMem ? 15 : 2,
      cycles: m === 'PUSH' ? ['IF', 'MW'] : m === 'POP' ? ['IF', 'MR'] : hasMem ? ['IF', 'MR', 'MW'] : ['IF'],
    };
  }
  if (['JMP', 'JE', 'JNE', 'JZ', 'JNZ', 'JC', 'JNC', 'LOOP', 'CALL'].includes(m)) {
    return {
      size: 3,
      tStates: m === 'CALL' ? 19 : m === 'LOOP' ? 17 : 15,
      cycles: m === 'CALL' ? ['IF', 'MW'] : ['IF'],
    };
  }
  if (m === 'IN' || m === 'OUT') {
    return { size: 2, tStates: 10, cycles: ['IF', m === 'IN' ? 'IOR' : 'IOW'] };
  }
  if (hasMem) {
    const isWrite = operands[0]?.includes('[');
    return { size: 4, tStates: isWrite ? 14 : 13, cycles: ['IF', isWrite ? 'MW' : 'MR'] };
  }
  const hasImm = operands.length === 2 && !REG_8086_SET.has(operands[1].toUpperCase());
  return {
    size: hasImm ? 3 : 2,
    tStates: hasImm ? 4 : 3,
    cycles: ['IF'],
  };
}

function encodePreviewBytes(mnemonic: string, operands: string[], size: number, symbols: Record<string, number>, addr: number): number[] {
  const m = mnemonic.toUpperCase();
  const opcodeMap: Record<string, number> = {
    MOV: 0x8b, XCHG: 0x87, LEA: 0x8d, PUSH: 0x50, POP: 0x58,
    IN: 0xe4, OUT: 0xe6, ADD: 0x03, ADC: 0x13, SUB: 0x2b, SBB: 0x1b,
    INC: 0x40, DEC: 0x48, MUL: 0xf7, DIV: 0xf7, CMP: 0x3b, NEG: 0xf7,
    AND: 0x23, OR: 0x0b, XOR: 0x33, NOT: 0xf7, SHL: 0xd1, SHR: 0xd1,
    ROL: 0xd1, ROR: 0xd1, JMP: 0xe9, JE: 0x74, JZ: 0x74, JNE: 0x75, JNZ: 0x75,
    JC: 0x72, JNC: 0x73, LOOP: 0xe2, CALL: 0xe8, RET: 0xc3, INT: 0xcd,
    CLC: 0xf8, STC: 0xf9, CLI: 0xfa, STI: 0xfb, NOP: 0x90, HLT: 0xf4,
  };
  const out = [opcodeMap[m] ?? 0x90];
  if (size === 1) return out;
  if (['JMP', 'JE', 'JZ', 'JNE', 'JNZ', 'JC', 'JNC', 'LOOP', 'CALL'].includes(m)) {
    const target = symbols[operands[0]?.toUpperCase()] ?? addr;
    const rel = (target - (addr + size)) & 0xffff;
    return [out[0], rel & 0xff, (rel >> 8) & 0xff];
  }
  while (out.length < size) {
    out.push(0x00);
  }
  return out;
}

export function assemble8086(source: string, defaultOrigin = 0x0100): Assembly8086Result {
  const rawLines = source.replace(/\r\n?/g, '\n').split('\n');
  const diagnostics: AssemblyDiagnostic[] = [];
  const symbolTable: Record<string, number> = {};
  const rows: Assembled8086Row[] = [];

  interface ParsedLine {
    lineNumber: number;
    raw: string;
    label: string | null;
    mnemonic: string | null;
    operands: string[];
  }

  const parsed: ParsedLine[] = rawLines.map((raw, idx) => {
    const lineNumber = idx + 1;
    const commentIdx = raw.indexOf(';');
    let code = (commentIdx >= 0 ? raw.slice(0, commentIdx) : raw).trim();
    if (!code) return { lineNumber, raw, label: null, mnemonic: null, operands: [] };

    let label: string | null = null;
    const labelMatch = code.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (labelMatch) {
      label = labelMatch[1].toUpperCase();
      code = labelMatch[2].trim();
    }
    if (!code) return { lineNumber, raw, label, mnemonic: null, operands: [] };

    const equMatch = code.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+EQU\s+(.+)$/i);
    if (equMatch && !label) {
      return {
        lineNumber,
        raw,
        label: equMatch[1].toUpperCase(),
        mnemonic: 'EQU',
        operands: [equMatch[2].trim()],
      };
    }

    const firstSpace = code.search(/\s/);
    const mnemonic = (firstSpace === -1 ? code : code.slice(0, firstSpace)).toUpperCase();
    const rest = firstSpace === -1 ? '' : code.slice(firstSpace + 1).trim();
    const operands = rest ? rest.split(',').map((o) => o.trim()).filter(Boolean) : [];
    return { lineNumber, raw, label, mnemonic, operands };
  });

  // Pass 1: symbols and addresses
  let loc = defaultOrigin & 0xffff;
  let entryPoint: number | null = null;

  for (const tok of parsed) {
    if (tok.mnemonic === 'END') break;
    if (tok.mnemonic === 'EQU') {
      if (tok.label && tok.operands[0]) {
        try {
          symbolTable[tok.label] = parse8086Number(tok.operands[0]) & 0xffff;
        } catch {
          diagnostics.push({ line: tok.lineNumber, message: `Invalid EQU value: ${tok.operands[0]}`, severity: 'error' });
        }
      }
      continue;
    }
    if (tok.label) symbolTable[tok.label] = loc;
    if (!tok.mnemonic) continue;

    if (tok.mnemonic === 'ORG') {
      try {
        loc = parse8086Number(tok.operands[0] ?? '') & 0xffff;
      } catch {
        diagnostics.push({ line: tok.lineNumber, message: `Invalid ORG address: ${tok.operands[0] ?? ''}`, severity: 'error' });
      }
      continue;
    }

    if (entryPoint === null && !DIRECTIVES_8086.has(tok.mnemonic)) {
      entryPoint = loc;
    }

    if (tok.mnemonic === 'DB') {
      loc = (loc + tok.operands.length) & 0xffff;
      continue;
    }
    if (tok.mnemonic === 'DW') {
      loc = (loc + tok.operands.length * 2) & 0xffff;
      continue;
    }
    if (!(tok.mnemonic in ISA_8086_MAP)) {
      diagnostics.push({ line: tok.lineNumber, message: `Unknown 8086 instruction: ${tok.mnemonic}`, severity: 'error' });
      continue;
    }

    const est = estimate8086SizeAndCycles(tok.mnemonic, tok.operands);
    loc = (loc + est.size) & 0xffff;
  }

  // Pass 2: encode bytes & rows
  loc = defaultOrigin & 0xffff;
  const segments: { startAddress: number; bytes: number[] }[] = [];
  let currentSeg: { startAddress: number; bytes: number[] } | null = null;
  const addressToRow: Record<number, Assembled8086Row> = {};
  const lineToAddress: Record<number, number> = {};
  let totalBytes = 0;

  for (const tok of parsed) {
    if (tok.mnemonic === 'END') break;
    if (!tok.mnemonic || tok.mnemonic === 'EQU') continue;

    if (tok.mnemonic === 'ORG') {
      try {
        loc = parse8086Number(tok.operands[0] ?? '') & 0xffff;
        currentSeg = null;
      } catch {
        // reported in pass 1
      }
      continue;
    }

    const startAddr = loc;
    lineToAddress[tok.lineNumber] = startAddr;

    if (tok.mnemonic === 'DB' || tok.mnemonic === 'DW') {
      const dirBytes: number[] = [];
      for (const op of tok.operands) {
        try {
          const val = parse8086Number(op);
          if (tok.mnemonic === 'DB') dirBytes.push(val & 0xff);
          else dirBytes.push(val & 0xff, (val >> 8) & 0xff);
        } catch {
          diagnostics.push({ line: tok.lineNumber, message: `Invalid data value: ${op}`, severity: 'error' });
        }
      }
      if (!currentSeg) {
        currentSeg = { startAddress: startAddr, bytes: [] };
        segments.push(currentSeg);
      }
      currentSeg.bytes.push(...dirBytes);
      rows.push({
        lineNumber: tok.lineNumber,
        address: startAddr,
        raw: tok.raw,
        label: tok.label,
        mnemonic: tok.mnemonic,
        operands: tok.operands,
        bytes: dirBytes,
        size: dirBytes.length,
        tStates: 0,
        cycles: [],
        isDirective: true,
      });
      totalBytes += dirBytes.length;
      loc = (loc + dirBytes.length) & 0xffff;
      continue;
    }

    if (!(tok.mnemonic in ISA_8086_MAP)) continue;

    const est = estimate8086SizeAndCycles(tok.mnemonic, tok.operands);
    const bytes = encodePreviewBytes(tok.mnemonic, tok.operands, est.size, symbolTable, startAddr);
    if (!currentSeg) {
      currentSeg = { startAddress: startAddr, bytes: [] };
      segments.push(currentSeg);
    }
    currentSeg.bytes.push(...bytes);

    const row: Assembled8086Row = {
      lineNumber: tok.lineNumber,
      address: startAddr,
      raw: tok.raw,
      label: tok.label,
      mnemonic: tok.mnemonic,
      operands: tok.operands,
      bytes,
      size: est.size,
      tStates: est.tStates,
      cycles: est.cycles,
      isDirective: false,
    };
    rows.push(row);
    addressToRow[startAddr] = row;
    totalBytes += est.size;
    loc = (loc + est.size) & 0xffff;
  }

  return {
    success: diagnostics.length === 0,
    entryPoint: entryPoint ?? defaultOrigin,
    rows,
    segments,
    symbolTable,
    addressToRow,
    lineToAddress,
    totalBytes,
    diagnostics,
  };
}

export function get8086BusRoutes(mnemonic: string, operands: string[]): BusPacket8086[] {
  const m = mnemonic.toUpperCase();
  const hasMem = operands.some((o) => o.includes('['));
  const fetch: BusPacket8086 = {
    label: 'BIU Prefetch (CS:IP → Queue)',
    path: ['CS_IP', 'BIU_ADDER', 'ADDR_20', 'MEMORY', 'PREFETCH_Q'],
  };

  if (m === 'IN') {
    return [fetch, { label: 'I/O Port Read → AL/AX', path: ['IO_PORT', 'INTERNAL_BUS', 'EU_REGS'] }];
  }
  if (m === 'OUT') {
    return [fetch, { label: 'AL/AX → I/O Port Write', path: ['EU_REGS', 'INTERNAL_BUS', 'IO_PORT'] }];
  }
  if (['PUSH', 'POP', 'CALL', 'RET'].includes(m)) {
    return [
      fetch,
      { label: 'Stack Access (SS:SP)', path: ['SEG_REGS', 'POINTERS', 'BIU_ADDER', 'ADDR_20', 'MEMORY', 'INTERNAL_BUS'] },
    ];
  }
  if (['ADD', 'ADC', 'SUB', 'SBB', 'INC', 'DEC', 'MUL', 'DIV', 'CMP', 'AND', 'OR', 'XOR', 'SHL', 'SHR', 'ROL', 'ROR', 'NEG', 'NOT'].includes(m)) {
    const steps: BusPacket8086[] = [fetch];
    if (hasMem) {
      steps.push({ label: 'EA Read (DS:[BX] → EU)', path: ['SEG_REGS', 'POINTERS', 'BIU_ADDER', 'ADDR_20', 'MEMORY', 'INTERNAL_BUS'] });
    }
    steps.push({ label: '16-Bit ALU Execute → FLAGS', path: ['EU_REGS', 'INTERNAL_BUS', 'ALU_16', 'FLAGS_16'] });
    return steps;
  }
  if (hasMem) {
    return [
      fetch,
      { label: 'Data Transfer (DS:[EA] ↔ EU)', path: ['SEG_REGS', 'POINTERS', 'BIU_ADDER', 'ADDR_20', 'MEMORY', 'INTERNAL_BUS', 'EU_REGS'] },
    ];
  }
  return [fetch, { label: `${m} Execution Unit`, path: ['CONTROL', 'EU_REGS', 'INTERNAL_BUS'] }];
}