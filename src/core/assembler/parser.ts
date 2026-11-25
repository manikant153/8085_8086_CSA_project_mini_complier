import { ISA_TABLE, REG_CODES, RP_CODES, RP_PSW_CODES, parseNumber } from '../isa/opcodes';

export interface AssemblyDiagnostic {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export const DIRECTIVES = new Set(['ORG', 'EQU', 'DB', 'DW', 'DS', 'END']);

export function resolveNumericOrSymbol(
  token: string,
  symbols: Record<string, number>,
  allowUnresolved = false
): number | undefined {
  const clean = token.trim();
  const upper = clean.toUpperCase();

  if (upper in symbols) {
    return symbols[upper];
  }

  // Support simple label+offset or label-offset expressions (e.g., TABLE+2)
  const exprMatch = upper.match(/^([A-Z_][A-Z0-9_]*)\s*([+-])\s*(.+)$/);
  if (exprMatch) {
    const [, sym, op, rhs] = exprMatch;
    const rhsVal = parseNumber(rhs);
    if (sym in symbols) {
      return op === '+' ? symbols[sym] + rhsVal : symbols[sym] - rhsVal;
    }
    if (allowUnresolved) return undefined;
    throw new Error(`Undefined symbol: ${sym}`);
  }

  if (/^[A-Z_][A-Z0-9_]*$/.test(upper) && !/^'.'$/.test(clean)) {
    if (allowUnresolved) return undefined;
    throw new Error(`Undefined label or symbol: ${clean}`);
  }

  return parseNumber(clean);
}

export function validateInstructionOperands(
  mnemonic: string,
  operands: string[],
  symbols: Record<string, number>,
  pass: 1 | 2
): string | null {
  const def = ISA_TABLE[mnemonic];
  if (!def) return `Unknown instruction or directive: ${mnemonic}`;

  const up = operands.map((o) => o.toUpperCase());
  const allowUnresolved = pass === 1;

  try {
    switch (def.pattern) {
      case 'NONE':
        return up.length === 0 ? null : `${mnemonic} takes no operands`;

      case 'REG':
        if (up.length !== 1 || !(up[0] in REG_CODES)) {
          return `${mnemonic} requires a valid register (B, C, D, E, H, L, M, A)`;
        }
        return null;

      case 'REG_REG':
        if (up.length !== 2 || !(up[0] in REG_CODES) || !(up[1] in REG_CODES)) {
          return `${mnemonic} requires two valid registers (e.g., MOV A, B)`;
        }
        if (up[0] === 'M' && up[1] === 'M') {
          return `MOV M, M is not a valid 8085 instruction`;
        }
        return null;

      case 'REG_D8': {
        if (up.length !== 2 || !(up[0] in REG_CODES)) {
          return `${mnemonic} requires destination register and 8-bit immediate value`;
        }
        const v = resolveNumericOrSymbol(operands[1], symbols, allowUnresolved);
        if (v !== undefined && (v < -128 || v > 255)) {
          return `Immediate value ${operands[1]} out of 8-bit range (00H–FFH)`;
        }
        return null;
      }

      case 'RP_D16': {
        if (up.length !== 2 || !(up[0] in RP_CODES)) {
          return `${mnemonic} requires register pair (B, D, H, SP) and 16-bit value`;
        }
        const v = resolveNumericOrSymbol(operands[1], symbols, allowUnresolved);
        if (v !== undefined && (v < 0 || v > 0xffff)) {
          return `Immediate value ${operands[1]} out of 16-bit range (0000H–FFFFH)`;
        }
        return null;
      }

      case 'RP':
        if (up.length !== 1 || !(up[0] in RP_CODES)) {
          return `${mnemonic} requires a register pair (B, D, H, SP)`;
        }
        return null;

      case 'RP_BD':
        if (up.length !== 1 || !['B', 'BC', 'D', 'DE'].includes(up[0])) {
          return `${mnemonic} only supports register pair B (BC) or D (DE)`;
        }
        return null;

      case 'RP_PSW':
        if (up.length !== 1 || !(up[0] in RP_PSW_CODES)) {
          return `${mnemonic} requires a register pair (B, D, H, PSW)`;
        }
        return null;

      case 'D8': {
        if (up.length !== 1) return `${mnemonic} requires an 8-bit immediate operand`;
        const v = resolveNumericOrSymbol(operands[0], symbols, allowUnresolved);
        if (v !== undefined && (v < -128 || v > 255)) {
          return `Value ${operands[0]} out of 8-bit range (00H–FFH)`;
        }
        return null;
      }

      case 'A16':
      case 'LABEL': {
        if (up.length !== 1) return `${mnemonic} requires a 16-bit address or label`;
        const v = resolveNumericOrSymbol(operands[0], symbols, allowUnresolved);
        if (v !== undefined && (v < 0 || v > 0xffff)) {
          return `Address ${operands[0]} out of 16-bit range (0000H–FFFFH)`;
        }
        return null;
      }

      case 'RST_NUM': {
        if (up.length !== 1) return `RST requires an interrupt vector number (0–7)`;
        const v = resolveNumericOrSymbol(operands[0], symbols, false);
        if (v === undefined || v < 0 || v > 7) {
          return `RST vector must be between 0 and 7`;
        }
        return null;
      }
    }
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}