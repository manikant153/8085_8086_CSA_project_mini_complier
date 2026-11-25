export interface CpuFlags {
  S: 0 | 1;  // Sign (Bit 7)
  Z: 0 | 1;  // Zero
  AC: 0 | 1; // Auxiliary Carry (Bit 3 -> Bit 4)
  P: 0 | 1;  // Parity (1 = Even number of 1s)
  CY: 0 | 1; // Carry
}

export function computeParity(val: number): 0 | 1 {
  const v = val & 0xff;
  let bits = 0;
  for (let i = 0; i < 8; i++) {
    bits += (v >> i) & 1;
  }
  return bits % 2 === 0 ? 1 : 0;
}

export function evaluateFlags(
  result: number,
  currentFlags: CpuFlags,
  options: { cy?: boolean; ac?: boolean; updateCY?: boolean; updateAC?: boolean } = {}
): CpuFlags {
  const byte = result & 0xff;
  return {
    S: ((byte >> 7) & 1) as 0 | 1,
    Z: (byte === 0 ? 1 : 0) as 0 | 1,
    P: computeParity(byte),
    CY: options.updateCY !== false ? ((options.cy ? 1 : 0) as 0 | 1) : currentFlags.CY,
    AC: options.updateAC !== false ? ((options.ac ? 1 : 0) as 0 | 1) : currentFlags.AC,
  };
}

export function aluAdd(a: number, b: number, carryIn: 0 | 1, flags: CpuFlags): { result: number; flags: CpuFlags } {
  const sum = a + b + carryIn;
  const ac = ((a & 0x0f) + (b & 0x0f) + carryIn) > 0x0f;
  const cy = sum > 0xff;
  return {
    result: sum & 0xff,
    flags: evaluateFlags(sum, flags, { cy, ac }),
  };
}

export function aluSub(a: number, b: number, borrowIn: 0 | 1, flags: CpuFlags): { result: number; flags: CpuFlags } {
  const diff = a - b - borrowIn;
  // In Intel 8085, AC is set if there is NO borrow from bit 4 (or auxiliary carry in 2's complement addition)
  const ac = ((a & 0x0f) - (b & 0x0f) - borrowIn) >= 0;
  const cy = diff < 0;
  return {
    result: diff & 0xff,
    flags: evaluateFlags(diff, flags, { cy, ac }),
  };
}

export function aluDaa(a: number, flags: CpuFlags): { result: number; flags: CpuFlags } {
  let val = a & 0xff;
  let cy = flags.CY;
  let ac: 0 | 1 = 0;

  if ((val & 0x0f) > 9 || flags.AC === 1) {
    ac = ((val & 0x0f) + 6) > 0x0f ? 1 : 0;
    val += 6;
    if (val > 0xff) cy = 1;
  }

  if (((val >> 4) & 0x0f) > 9 || cy === 1) {
    val += 0x60;
    if (val > 0xff) cy = 1;
  }

  return {
    result: val & 0xff,
    flags: evaluateFlags(val, flags, { cy: cy === 1, ac: ac === 1 }),
  };
}