import { ISA_TABLE, type MachineCycleType } from '../isa/opcodes';
import { lexSource } from './lexer';
import {
  type AssemblyDiagnostic,
  DIRECTIVES,
  resolveNumericOrSymbol,
  validateInstructionOperands,
} from './parser';

export interface AssembledRow {
  lineNumber: number;
  address: number;
  raw: string;
  label: string | null;
  mnemonic: string | null;
  operands: string[];
  bytes: number[];
  size: number;
  tStates: number;
  machineCycles: MachineCycleType[];
  isDirective: boolean;
}

export interface MemorySegment {
  startAddress: number;
  bytes: number[];
}

export interface AssemblyResult {
  success: boolean;
  entryPoint: number;
  rows: AssembledRow[];
  segments: MemorySegment[];
  symbolTable: Record<string, number>;
  addressToRow: Record<number, AssembledRow>;
  lineToAddress: Record<number, number>;
  totalBytes: number;
  diagnostics: AssemblyDiagnostic[];
}

function expandDbBytes(operands: string[], symbols: Record<string, number>): number[] {
  const out: number[] = [];
  for (const op of operands) {
    const trimmed = op.trim();
    if (
      (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 3) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 3)
    ) {
      const str = trimmed.slice(1, -1);
      for (let i = 0; i < str.length; i++) {
        out.push(str.charCodeAt(i) & 0xff);
      }
    } else {
      const v = resolveNumericOrSymbol(trimmed, symbols, false);
      if (v === undefined || v < -128 || v > 255) {
        throw new Error(`DB value out of 8-bit range: ${trimmed}`);
      }
      out.push(v & 0xff);
    }
  }
  return out;
}

export function assemble(source: string, defaultOrigin = 0x2000): AssemblyResult {
  const tokens = lexSource(source);
  const diagnostics: AssemblyDiagnostic[] = [];
  const symbolTable: Record<string, number> = {};
  const rows: AssembledRow[] = [];

  let loc = defaultOrigin & 0xffff;
  let entryPoint: number | null = null;

  // ==================== PASS 1: SYMBOL TABLE & SIZES ====================
  for (const tok of tokens) {
    if (tok.mnemonic === 'END') break;

    if (tok.mnemonic === 'EQU') {
      if (!tok.label) {
        diagnostics.push({ line: tok.lineNumber, message: 'EQU requires a symbol name', severity: 'error' });
        continue;
      }
      if (tok.label in symbolTable) {
        diagnostics.push({ line: tok.lineNumber, message: `Duplicate symbol: ${tok.label}`, severity: 'error' });
        continue;
      }
      try {
        const val = resolveNumericOrSymbol(tok.operands[0] ?? '', symbolTable, false);
        if (val === undefined) throw new Error('Invalid EQU expression');
        symbolTable[tok.label] = val & 0xffff;
      } catch (e) {
        diagnostics.push({
          line: tok.lineNumber,
          message: e instanceof Error ? e.message : String(e),
          severity: 'error',
        });
      }
      continue;
    }

    if (tok.label) {
      if (tok.label in symbolTable) {
        diagnostics.push({ line: tok.lineNumber, message: `Duplicate label: ${tok.label}`, severity: 'error' });
      } else {
        symbolTable[tok.label] = loc;
      }
    }

    if (!tok.mnemonic) continue;

    if (tok.mnemonic === 'ORG') {
      try {
        if (tok.operands.length !== 1) throw new Error('ORG requires a single 16-bit address');
        const newLoc = resolveNumericOrSymbol(tok.operands[0], symbolTable, false);
        if (newLoc === undefined || newLoc < 0 || newLoc > 0xffff) {
          throw new Error(`Invalid ORG address: ${tok.operands[0]}`);
        }
        loc = newLoc & 0xffff;
      } catch (e) {
        diagnostics.push({
          line: tok.lineNumber,
          message: e instanceof Error ? e.message : String(e),
          severity: 'error',
        });
      }
      continue;
    }

    if (entryPoint === null && !DIRECTIVES.has(tok.mnemonic)) {
      entryPoint = loc;
    }

    if (tok.mnemonic === 'DB') {
      try {
        if (tok.operands.length === 0) throw new Error('DB requires at least one byte or string');
        // Estimate size in Pass 1 (strings expand to length, numbers to 1 byte)
        let size = 0;
        for (const op of tok.operands) {
          const t = op.trim();
          if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
            size += Math.max(1, t.length - 2);
          } else {
            size += 1;
          }
        }
        loc = (loc + size) & 0xffff;
      } catch (e) {
        diagnostics.push({
          line: tok.lineNumber,
          message: e instanceof Error ? e.message : String(e),
          severity: 'error',
        });
      }
      continue;
    }

    if (tok.mnemonic === 'DW') {
      if (tok.operands.length === 0) {
        diagnostics.push({ line: tok.lineNumber, message: 'DW requires at least one 16-bit word', severity: 'error' });
      } else {
        loc = (loc + tok.operands.length * 2) & 0xffff;
      }
      continue;
    }

    if (tok.mnemonic === 'DS') {
      try {
        if (tok.operands.length !== 1) throw new Error('DS requires a byte count');
        const count = resolveNumericOrSymbol(tok.operands[0], symbolTable, false);
        if (count === undefined || count < 0 || count > 0xffff) throw new Error('Invalid DS byte count');
        loc = (loc + count) & 0xffff;
      } catch (e) {
        diagnostics.push({
          line: tok.lineNumber,
          message: e instanceof Error ? e.message : String(e),
          severity: 'error',
        });
      }
      continue;
    }

    const err = validateInstructionOperands(tok.mnemonic, tok.operands, symbolTable, 1);
    if (err) {
      diagnostics.push({ line: tok.lineNumber, message: err, severity: 'error' });
      continue;
    }

    const def = ISA_TABLE[tok.mnemonic];
    loc = (loc + def.bytes) & 0xffff;
  }

  // ==================== PASS 2: ENCODE MACHINE BYTES ====================
  loc = defaultOrigin & 0xffff;
  const segments: MemorySegment[] = [];
  let currentSegment: MemorySegment | null = null;
  const addressToRow: Record<number, AssembledRow> = {};
  const lineToAddress: Record<number, number> = {};
  let totalBytes = 0;

  for (const tok of tokens) {
    if (tok.mnemonic === 'END') break;
    if (!tok.mnemonic || tok.mnemonic === 'EQU') continue;

    if (tok.mnemonic === 'ORG') {
      try {
        const newLoc = resolveNumericOrSymbol(tok.operands[0], symbolTable, false);
        if (newLoc !== undefined) {
          loc = newLoc & 0xffff;
          currentSegment = null;
        }
      } catch {
        // Already reported in Pass 1
      }
      continue;
    }

    const startAddr = loc;
    lineToAddress[tok.lineNumber] = startAddr;

    if (DIRECTIVES.has(tok.mnemonic)) {
      try {
        let dirBytes: number[] = [];
        if (tok.mnemonic === 'DB') {
          dirBytes = expandDbBytes(tok.operands, symbolTable);
        } else if (tok.mnemonic === 'DW') {
          for (const op of tok.operands) {
            const v = resolveNumericOrSymbol(op, symbolTable, false);
            if (v === undefined || v < 0 || v > 0xffff) {
              throw new Error(`DW value out of 16-bit range: ${op}`);
            }
            dirBytes.push(v & 0xff, (v >> 8) & 0xff);
          }
        } else if (tok.mnemonic === 'DS') {
          const count = resolveNumericOrSymbol(tok.operands[0], symbolTable, false) ?? 0;
          dirBytes = new Array(count).fill(0x00);
        }

        if (!currentSegment) {
          currentSegment = { startAddress: startAddr, bytes: [] };
          segments.push(currentSegment);
        }
        currentSegment.bytes.push(...dirBytes);

        const row: AssembledRow = {
          lineNumber: tok.lineNumber,
          address: startAddr,
          raw: tok.raw,
          label: tok.label,
          mnemonic: tok.mnemonic,
          operands: tok.operands,
          bytes: dirBytes,
          size: dirBytes.length,
          tStates: 0,
          machineCycles: [],
          isDirective: true,
        };
        rows.push(row);
        totalBytes += dirBytes.length;
        loc = (loc + dirBytes.length) & 0xffff;
      } catch (e) {
        diagnostics.push({
          line: tok.lineNumber,
          message: e instanceof Error ? e.message : String(e),
          severity: 'error',
        });
      }
      continue;
    }

    const err = validateInstructionOperands(tok.mnemonic, tok.operands, symbolTable, 2);
    if (err) {
      diagnostics.push({ line: tok.lineNumber, message: err, severity: 'error' });
      continue;
    }

    const def = ISA_TABLE[tok.mnemonic];
    try {
      let resolvedValue: number | undefined;
      if (['REG_D8', 'RP_D16', 'D8', 'A16', 'LABEL'].includes(def.pattern)) {
        const targetOp = def.pattern === 'REG_D8' || def.pattern === 'RP_D16' ? tok.operands[1] : tok.operands[0];
        resolvedValue = resolveNumericOrSymbol(targetOp, symbolTable, false);
      }

      const encoded = def.encode(tok.operands, resolvedValue);
      const usesMemoryM = tok.operands.some((o) => o.toUpperCase() === 'M');
      const baseT = Array.isArray(def.tStates) ? def.tStates[0] : def.tStates;
      const adjustedT = usesMemoryM ? baseT + 3 : baseT;
      const adjustedCycles: MachineCycleType[] = usesMemoryM
        ? [...def.machineCycles, tok.mnemonic === 'MOV' && tok.operands[0].toUpperCase() === 'M' ? 'MW' : 'MR']
        : [...def.machineCycles];

      if (!currentSegment) {
        currentSegment = { startAddress: startAddr, bytes: [] };
        segments.push(currentSegment);
      }
      currentSegment.bytes.push(...encoded);

      const row: AssembledRow = {
        lineNumber: tok.lineNumber,
        address: startAddr,
        raw: tok.raw,
        label: tok.label,
        mnemonic: tok.mnemonic,
        operands: tok.operands,
        bytes: encoded,
        size: encoded.length,
        tStates: adjustedT,
        machineCycles: adjustedCycles,
        isDirective: false,
      };

      rows.push(row);
      addressToRow[startAddr] = row;
      totalBytes += encoded.length;
      loc = (loc + encoded.length) & 0xffff;
    } catch (e) {
      diagnostics.push({
        line: tok.lineNumber,
        message: e instanceof Error ? e.message : String(e),
        severity: 'error',
      });
    }
  }

  return {
    success: diagnostics.filter((d) => d.severity === 'error').length === 0,
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