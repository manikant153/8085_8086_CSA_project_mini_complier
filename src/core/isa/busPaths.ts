export type BusNode =
  | 'PC'
  | 'ADDR_BUS'
  | 'MEMORY'
  | 'DATA_BUS'
  | 'IR'
  | 'DECODER'
  | 'ACC'
  | 'TEMP'
  | 'ALU'
  | 'FLAGS'
  | 'REG_ARRAY'
  | 'SP'
  | 'IO_PORT';

export interface BusPacketStep {
  label: string;
  path: BusNode[];
  color: 'cyan' | 'amber' | 'emerald' | 'purple';
}

const FETCH_STEP: BusPacketStep = {
  label: 'Opcode Fetch (PC → IR)',
  path: ['PC', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'IR', 'DECODER'],
  color: 'cyan',
};

export function getBusAnimationRoute(mnemonic: string, operands: string[] = []): BusPacketStep[] {
  const m = mnemonic.toUpperCase();
  const op0 = (operands[0] || '').toUpperCase();
  const op1 = (operands[1] || '').toUpperCase();

  // Arithmetic & Logic with Register / Memory
  if (['ADD', 'ADC', 'SUB', 'SBB', 'ANA', 'ORA', 'XRA'].includes(m)) {
    const readStep: BusPacketStep =
      op0 === 'M'
        ? { label: 'Read M via HL → Temp', path: ['REG_ARRAY', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'TEMP'], color: 'amber' }
        : { label: `Read ${op0} → Temp`, path: ['REG_ARRAY', 'DATA_BUS', 'TEMP'], color: 'amber' };
    return [
      FETCH_STEP,
      readStep,
      { label: 'ALU Execute → Acc & Flags', path: ['ACC', 'TEMP', 'ALU', 'ACC', 'FLAGS'], color: 'emerald' },
    ];
  }

  // Immediate Arithmetic & Logic
  if (['ADI', 'ACI', 'SUI', 'SBI', 'ANI', 'ORI', 'XRI'].includes(m)) {
    return [
      FETCH_STEP,
      { label: 'Fetch d8 → Temp', path: ['PC', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'TEMP'], color: 'amber' },
      { label: 'ALU Execute → Acc & Flags', path: ['ACC', 'TEMP', 'ALU', 'ACC', 'FLAGS'], color: 'emerald' },
    ];
  }

  // Compare
  if (m === 'CMP' || m === 'CPI') {
    const srcStep: BusPacketStep =
      m === 'CPI'
        ? { label: 'Fetch d8 → Temp', path: ['PC', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'TEMP'], color: 'amber' }
        : op0 === 'M'
          ? { label: 'Read M → Temp', path: ['REG_ARRAY', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'TEMP'], color: 'amber' }
          : { label: `Read ${op0} → Temp`, path: ['REG_ARRAY', 'DATA_BUS', 'TEMP'], color: 'amber' };
    return [
      FETCH_STEP,
      srcStep,
      { label: 'ALU Compare → Flags', path: ['ACC', 'TEMP', 'ALU', 'FLAGS'], color: 'purple' },
    ];
  }

  // MOV & MVI
  if (m === 'MOV') {
    if (op0 === 'M') {
      return [FETCH_STEP, { label: `Write ${op1} → Memory[HL]`, path: ['REG_ARRAY', 'DATA_BUS', 'MEMORY'], color: 'amber' }];
    }
    if (op1 === 'M') {
      return [FETCH_STEP, { label: `Read Memory[HL] → ${op0}`, path: ['REG_ARRAY', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'REG_ARRAY'], color: 'emerald' }];
    }
    return [FETCH_STEP, { label: `Transfer ${op1} → ${op0}`, path: ['REG_ARRAY', 'DATA_BUS', 'REG_ARRAY'], color: 'emerald' }];
  }

  if (m === 'MVI') {
    return [
      FETCH_STEP,
      {
        label: `Load d8 → ${op0}`,
        path: op0 === 'M' ? ['PC', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'MEMORY'] : ['PC', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', 'REG_ARRAY'],
        color: 'emerald',
      },
    ];
  }

  // Direct Memory Load/Store
  if (['LDA', 'LHLD', 'LDAX'].includes(m)) {
    return [
      FETCH_STEP,
      { label: 'Memory Read → Accumulator/HL', path: ['ADDR_BUS', 'MEMORY', 'DATA_BUS', m === 'LHLD' ? 'REG_ARRAY' : 'ACC'], color: 'emerald' },
    ];
  }
  if (['STA', 'SHLD', 'STAX'].includes(m)) {
    return [
      FETCH_STEP,
      { label: 'Accumulator/HL → Memory Write', path: [m === 'SHLD' ? 'REG_ARRAY' : 'ACC', 'DATA_BUS', 'MEMORY'], color: 'amber' },
    ];
  }

  // Stack & Subroutines
  if (['PUSH', 'CALL', 'CZ', 'CNZ', 'CC', 'CNC', 'CP', 'CM', 'CPE', 'CPO', 'RST'].includes(m)) {
    return [
      FETCH_STEP,
      { label: 'Stack Push via SP', path: ['SP', 'ADDR_BUS', 'REG_ARRAY', 'DATA_BUS', 'MEMORY'], color: 'purple' },
    ];
  }
  if (['POP', 'RET', 'RZ', 'RNZ', 'RC', 'RNC', 'RP', 'RM', 'RPE', 'RPO'].includes(m)) {
    return [
      FETCH_STEP,
      { label: 'Stack Pop via SP', path: ['SP', 'ADDR_BUS', 'MEMORY', 'DATA_BUS', m.startsWith('R') ? 'PC' : 'REG_ARRAY'], color: 'purple' },
    ];
  }

  // Jumps
  if (m.startsWith('J') || m === 'PCHL') {
    return [
      FETCH_STEP,
      { label: 'Update Program Counter', path: ['MEMORY', 'DATA_BUS', 'PC'], color: 'purple' },
    ];
  }

  // I/O
  if (m === 'IN') {
    return [FETCH_STEP, { label: 'I/O Port Read → Acc', path: ['IO_PORT', 'DATA_BUS', 'ACC'], color: 'emerald' }];
  }
  if (m === 'OUT') {
    return [FETCH_STEP, { label: 'Acc → I/O Port Write', path: ['ACC', 'DATA_BUS', 'IO_PORT'], color: 'amber' }];
  }

  // Default (NOP, HLT, Rotate, Flag ops)
  return [
    FETCH_STEP,
    { label: `${m} Internal Execution`, path: ['DECODER', 'ALU', 'ACC', 'FLAGS'], color: 'emerald' },
  ];
}