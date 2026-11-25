import React from 'react';
import type { CpuFlags } from '../../core/emulator/alu';
import type { Flags8086 } from '../../core/emulator/cpu8086';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface FlagBitCell {
  bit: string;
  label: string;
  key?: keyof CpuFlags;
  fixedValue?: 0 | 1;
  desc: string;
}

const PSW_BITS_8085: FlagBitCell[] = [
  { bit: 'D7', label: 'S', key: 'S', desc: 'Sign Flag (1 = Negative / MSB 1)' },
  { bit: 'D6', label: 'Z', key: 'Z', desc: 'Zero Flag (1 = Result is 00H)' },
  { bit: 'D5', label: '—', fixedValue: 0, desc: 'Undefined (Always 0)' },
  { bit: 'D4', label: 'AC', key: 'AC', desc: 'Auxiliary Carry (Bit 3 → Bit 4)' },
  { bit: 'D3', label: '—', fixedValue: 0, desc: 'Undefined (Always 0)' },
  { bit: 'D2', label: 'P', key: 'P', desc: 'Parity Flag (1 = Even number of 1s)' },
  { bit: 'D1', label: '—', fixedValue: 1, desc: 'Reserved (Always 1 in 8085)' },
  { bit: 'D0', label: 'CY', key: 'CY', desc: 'Carry Flag (1 = Carry / Borrow)' },
];

const FLAGS_8086: { bit: string; label: keyof Flags8086; desc: string }[] = [
  { bit: 'B11', label: 'OF', desc: 'Overflow Flag (Signed overflow)' },
  { bit: 'B10', label: 'DF', desc: 'Direction Flag (String auto-inc/dec)' },
  { bit: 'B9', label: 'IF', desc: 'Interrupt Enable Flag' },
  { bit: 'B8', label: 'TF', desc: 'Trap Flag (Single-step debug)' },
  { bit: 'B7', label: 'SF', desc: 'Sign Flag' },
  { bit: 'B6', label: 'ZF', desc: 'Zero Flag' },
  { bit: 'B4', label: 'AF', desc: 'Auxiliary Carry Flag' },
  { bit: 'B2', label: 'PF', desc: 'Parity Flag' },
  { bit: 'B0', label: 'CF', desc: 'Carry Flag' },
];

export const FlagMatrix: React.FC = () => {
  const { architecture, cpu, cpu8086, snapshot, snapshot8086, revision } = useSimulatorStore();
  void revision;

  if (architecture === '8086') {
    const changed86 = new Set(snapshot8086?.changedFlags ?? []);
    const f = cpu8086.f;
    const flagsWord =
      (f.OF << 11) |
      (f.DF << 10) |
      (f.IF << 9) |
      (f.TF << 8) |
      (f.SF << 7) |
      (f.ZF << 6) |
      (f.AF << 4) |
      (f.PF << 2) |
      0x02 |
      f.CF;

    return (
      <div
        className="min-w-0 rounded-xl border p-3"
        style={{
          backgroundColor: 'var(--ss-bg-panel)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="truncate text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--ss-text-secondary)' }}
          >
            8086 16-Bit FLAGS
          </span>
          <span className="shrink-0 font-mono text-xs font-bold" style={{ color: 'var(--ss-secondary)' }}>
            FLAGS: {flagsWord.toString(16).toUpperCase().padStart(4, '0')}H
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
          {FLAGS_8086.map((cell) => {
            const val = f[cell.label];
            const isModified = changed86.has(cell.label);
            const isSet = val === 1;
            return (
              <div
                key={cell.label}
                title={cell.desc}
                className="flex min-w-0 flex-col items-center rounded-lg border py-1.5 transition-all"
                style={{
                  backgroundColor: isModified
                    ? 'var(--ss-warning-soft)'
                    : isSet
                      ? 'var(--ss-success-soft)'
                      : 'var(--ss-bg-panel-alt)',
                  borderColor: isModified
                    ? 'var(--ss-warning)'
                    : isSet
                      ? 'var(--ss-success)'
                      : 'var(--ss-border-subtle)',
                }}
              >
                <span className="font-mono text-[9px]" style={{ color: 'var(--ss-text-muted)' }}>
                  {cell.bit}
                </span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--ss-text-primary)' }}>
                  {cell.label}
                </span>
                <span
                  className="mt-0.5 font-mono text-xs font-extrabold"
                  style={{ color: isSet ? 'var(--ss-success)' : 'var(--ss-text-muted)' }}
                >
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const changed = new Set(snapshot?.changedFlags ?? []);
  const pswByte =
    (cpu.f.S << 7) |
    (cpu.f.Z << 6) |
    (cpu.f.AC << 4) |
    (cpu.f.P << 2) |
    0x02 |
    cpu.f.CY;

  return (
    <div
      className="min-w-0 rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="truncate text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ss-text-secondary)' }}
        >
          PSW Flag Register
        </span>
        <span className="shrink-0 font-mono text-xs font-bold" style={{ color: 'var(--ss-secondary)' }}>
          PSW: {pswByte.toString(16).toUpperCase().padStart(2, '0')}H
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {PSW_BITS_8085.map((cell) => {
          const val = cell.key ? cpu.f[cell.key] : cell.fixedValue!;
          const isModified = cell.key ? changed.has(cell.key) : false;
          const isSet = val === 1 && Boolean(cell.key);

          return (
            <div
              key={cell.bit}
              title={cell.desc}
              className={`flex min-w-0 flex-col items-center rounded-lg border py-1.5 transition-all ${
                !cell.key ? 'opacity-50' : ''
              }`}
              style={{
                backgroundColor: !cell.key
                  ? 'var(--ss-bg-panel-alt)'
                  : isModified
                    ? 'var(--ss-warning-soft)'
                    : isSet
                      ? 'var(--ss-success-soft)'
                      : 'var(--ss-bg-panel-alt)',
                borderColor: !cell.key
                  ? 'var(--ss-border-subtle)'
                  : isModified
                    ? 'var(--ss-warning)'
                    : isSet
                      ? 'var(--ss-success)'
                      : 'var(--ss-border-subtle)',
              }}
            >
              <span className="font-mono text-[9px]" style={{ color: 'var(--ss-text-muted)' }}>
                {cell.bit}
              </span>
              <span className="text-[11px] font-bold" style={{ color: 'var(--ss-text-primary)' }}>
                {cell.label}
              </span>
              <span
                className="mt-0.5 font-mono text-xs font-extrabold"
                style={{ color: isSet ? 'var(--ss-success)' : 'var(--ss-text-muted)' }}
              >
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};