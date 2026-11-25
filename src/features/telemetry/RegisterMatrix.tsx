import React from 'react';
import type { CpuRegisters } from '../../core/emulator/history';
import { useSimulatorStore } from '../../store/useSimulatorStore';

const hex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
const hex4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0');
const bin8 = (v: number) => v.toString(2).padStart(8, '0');

export const RegisterMatrix: React.FC = () => {
  const { architecture, cpu, cpu8086, snapshot, snapshot8086, revision } = useSimulatorStore();
  void revision;

  if (architecture === '8086') {
    const changed86 = new Set(snapshot8086?.changedRegisters ?? []);
    const general16 = [
      { name: 'AX' as const, hi: 'AH', lo: 'AL', val: cpu8086.r.AX },
      { name: 'BX' as const, hi: 'BH', lo: 'BL', val: cpu8086.r.BX },
      { name: 'CX' as const, hi: 'CH', lo: 'CL', val: cpu8086.r.CX },
      { name: 'DX' as const, hi: 'DH', lo: 'DL', val: cpu8086.r.DX },
    ];
    const pointers16 = [
      { label: 'SI' as const, val: cpu8086.r.SI },
      { label: 'DI' as const, val: cpu8086.r.DI },
      { label: 'BP' as const, val: cpu8086.r.BP },
      { label: 'SP' as const, val: cpu8086.r.SP },
      { label: 'IP' as const, val: cpu8086.ip },
    ];
    const segments16 = [
      { label: 'CS' as const, val: cpu8086.r.CS },
      { label: 'DS' as const, val: cpu8086.r.DS },
      { label: 'SS' as const, val: cpu8086.r.SS },
      { label: 'ES' as const, val: cpu8086.r.ES },
    ];

    return (
      <div
        className="min-w-0 rounded-xl border p-3"
        style={{
          backgroundColor: 'var(--ss-bg-panel)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span
            className="truncate text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--ss-text-secondary)' }}
          >
            8086 16-Bit Register File
          </span>
          <span
            className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold"
            style={{
              backgroundColor: cpu8086.halted ? 'var(--ss-danger-soft)' : 'var(--ss-success-soft)',
              borderColor: cpu8086.halted ? 'var(--ss-danger)' : 'var(--ss-success)',
              color: cpu8086.halted ? 'var(--ss-danger)' : 'var(--ss-success)',
            }}
          >
            {cpu8086.halted ? 'HALTED' : 'READY'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {general16.map((r) => {
            const isModified = changed86.has(r.name);
            return (
              <div
                key={r.name}
                className="min-w-0 rounded-lg border p-2 transition-all duration-200"
                style={{
                  backgroundColor: isModified ? 'var(--ss-warning-soft)' : 'var(--ss-bg-panel-alt)',
                  borderColor: isModified ? 'var(--ss-warning)' : 'var(--ss-border-subtle)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold" style={{ color: 'var(--ss-accent)' }}>
                    {r.name}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: 'var(--ss-text-muted)' }}>
                    {hex2((r.val >> 8) & 0xff)}:{hex2(r.val & 0xff)}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold" style={{ color: 'var(--ss-text-primary)' }}>
                  {hex4(r.val)}H
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {pointers16.map((p) => {
            const active = changed86.has(p.label);
            return (
              <div
                key={p.label}
                className="min-w-0 rounded-lg border px-2 py-1.5 transition-all"
                style={{
                  backgroundColor: active ? 'var(--ss-accent-soft)' : 'var(--ss-bg-panel-alt)',
                  borderColor: active ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
                }}
              >
                <div className="text-[10px] font-semibold" style={{ color: 'var(--ss-text-muted)' }}>
                  {p.label}
                </div>
                <div className="font-mono text-xs font-bold" style={{ color: 'var(--ss-text-primary)' }}>
                  {hex4(p.val)}H
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {segments16.map((s) => (
            <div
              key={s.label}
              className="min-w-0 rounded-lg border px-2 py-1"
              style={{
                backgroundColor: 'var(--ss-bg-panel-alt)',
                borderColor: 'var(--ss-border-subtle)',
              }}
            >
              <div className="text-[9px] font-semibold" style={{ color: 'var(--ss-secondary)' }}>
                {s.label}
              </div>
              <div className="font-mono text-[11px] font-bold" style={{ color: 'var(--ss-text-primary)' }}>
                {hex4(s.val)}H
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const changed = new Set(snapshot?.changedRegisters ?? []);
  const regs: (keyof CpuRegisters)[] = ['A', 'B', 'C', 'D', 'E', 'H', 'L'];

  const bc = (cpu.r.B << 8) | cpu.r.C;
  const de = (cpu.r.D << 8) | cpu.r.E;
  const hl = (cpu.r.H << 8) | cpu.r.L;

  return (
    <div
      className="min-w-0 rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span
          className="truncate text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ss-text-secondary)' }}
        >
          CPU Register Telemetry
        </span>
        <span
          className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold"
          style={{
            backgroundColor: cpu.halted ? 'var(--ss-danger-soft)' : 'var(--ss-success-soft)',
            borderColor: cpu.halted ? 'var(--ss-danger)' : 'var(--ss-success)',
            color: cpu.halted ? 'var(--ss-danger)' : 'var(--ss-success)',
          }}
        >
          {cpu.halted ? 'HALTED' : 'READY'}
        </span>
      </div>

      {/* 8-Bit Registers */}
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {regs.map((reg) => {
          const val = cpu.r[reg];
          const isModified = changed.has(reg);
          return (
            <div
              key={reg}
              className="min-w-0 rounded-lg border p-2 transition-all duration-200"
              style={{
                backgroundColor: isModified ? 'var(--ss-warning-soft)' : 'var(--ss-bg-panel-alt)',
                borderColor: isModified ? 'var(--ss-warning)' : 'var(--ss-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold" style={{ color: 'var(--ss-accent)' }}>
                  {reg}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--ss-text-muted)' }}>
                  {val}
                </span>
              </div>
              <div
                className="mt-0.5 font-mono text-sm font-bold"
                style={{ color: 'var(--ss-text-primary)' }}
              >
                {hex2(val)}H
              </div>
              <div
                className="mt-0.5 truncate font-mono text-[9px] tracking-tighter"
                style={{ color: 'var(--ss-text-muted)' }}
              >
                {bin8(val)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 16-Bit Pointers & Pairs */}
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {[
          { label: 'BC', val: bc, active: changed.has('B') || changed.has('C'), spanFull: false },
          { label: 'DE', val: de, active: changed.has('D') || changed.has('E'), spanFull: false },
          { label: 'HL (M)', val: hl, active: changed.has('H') || changed.has('L'), spanFull: false },
          { label: 'SP', val: cpu.sp, active: changed.has('SP'), spanFull: false },
          { label: 'PC', val: cpu.pc, active: changed.has('PC'), spanFull: true },
        ].map((item) => (
          <div
            key={item.label}
            className={`${item.spanFull ? 'col-span-2 sm:col-span-1' : ''} min-w-0 rounded-lg border px-2 py-1.5 transition-all`}
            style={{
              backgroundColor: item.active ? 'var(--ss-accent-soft)' : 'var(--ss-bg-panel-alt)',
              borderColor: item.active ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
            }}
          >
            <div className="text-[10px] font-semibold" style={{ color: 'var(--ss-text-muted)' }}>
              {item.label}
            </div>
            <div className="font-mono text-xs font-bold" style={{ color: 'var(--ss-text-primary)' }}>
              {hex4(item.val)}H
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};