export interface TokenizedLine {
  lineNumber: number;
  raw: string;
  label: string | null;
  mnemonic: string | null;
  operands: string[];
}

function splitOperands(operandStr: string): string[] {
  const operands: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < operandStr.length; i++) {
    const ch = operandStr[i];
    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += ch;
    } else if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += ch;
    } else if (ch === ',' && !inSingleQuote && !inDoubleQuote) {
      if (current.trim()) operands.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) operands.push(current.trim());
  return operands;
}

function stripComment(line: string): string {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    else if (ch === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    else if (ch === ';' && !inSingleQuote && !inDoubleQuote) {
      return line.slice(0, i);
    }
  }
  return line;
}

export function lexSource(source: string): TokenizedLine[] {
  const rawLines = source.replace(/\r\n?/g, '\n').split('\n');
  return rawLines.map((raw, idx) => {
    const lineNumber = idx + 1;
    let code = stripComment(raw).trim();

    if (!code) {
      return { lineNumber, raw, label: null, mnemonic: null, operands: [] };
    }

    let label: string | null = null;
    const labelMatch = code.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (labelMatch) {
      label = labelMatch[1].toUpperCase();
      code = labelMatch[2].trim();
    }

    if (!code) {
      return { lineNumber, raw, label, mnemonic: null, operands: [] };
    }

    // Handle `NAME EQU VALUE` syntax without colon
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
    const operands = rest ? splitOperands(rest) : [];

    return { lineNumber, raw, label, mnemonic, operands };
  });
}