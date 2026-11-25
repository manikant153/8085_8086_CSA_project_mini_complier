import React from 'react';
import type { Cycle8086Type } from '../../core/isa/arch8086';
import type { MachineCycleType } from '../../core/isa/opcodes';
import { useSimulatorStore } from '../../store/useSimulatorStore';

const CYCLE_META_8085: Record<
  MachineCycleType,
  { name: string; sig1: string; sig2: string; sig3: string; colorVar: string; softVar: string }
> = {
  OF: { name: 'Opcode Fetch', sig1: 'IO/M̄:0', sig2: 'RD̄:0', sig3: 'WR̄:1', colorVar: 'var(--ss-accent-text)', softVar: 'var(--ss-accent-soft)' },
  MR: { name: 'Memory Read', sig1: 'IO/M̄:0', sig2: 'RD̄:0', sig3: 'WR̄:1', colorVar: 'var(--ss-success)', softVar: 'var(--ss-success-soft)' },
  MW: { name: 'Memory Write', sig1: 'IO/M̄:0', sig2: 'RD̄:1', sig3: 'WR̄:0', colorVar: 'var(--ss-warning)', softVar: 'var(--ss-warning-soft)' },
  IOR: { name: 'I/O Read', sig1: 'IO/M̄:1', sig2: 'RD̄:0', sig3: 'WR̄:1', colorVar: 'var(--ss-secondary)', softVar: 'var(--ss-secondary-soft)' },
  IOW: { name: 'I/O Write', sig1: 'IO/M̄:1', sig2: 'RD̄:1', sig3: 'WR̄:0', colorVar: 'var(--ss-danger)', softVar: 'var(--ss-danger-soft)' },
  INA: { name: 'Interrupt Ack', sig1: 'IO/M̄:1', sig2: 'RD̄:1', sig3: 'WR̄:1', colorVar: 'var(--ss-danger)', softVar: 'var(--ss-danger-soft)' },
  BI: { name: 'Bus Idle', sig1: 'IO/M̄:0', sig2: 'RD̄:1', sig3: 'WR̄:1', colorVar: 'var(--ss-text-secondary)', softVar: 'var(--ss-bg-panel-alt)' },
};

const CYCLE_META_8086: Record<
  Cycle8086Type,
  { name: string; sig1: string; sig2: string; sig3: string; colorVar: string; softVar: string }
> = {
  IF: { name: 'BIU Prefetch', sig1: 'M/IŌ:1', sig2: 'DT/R̄:0', sig3: 'RD̄:0', colorVar: 'var(--ss-accent-text)', softVar: 'var(--ss-accent-soft)' },
  MR: { name: '16-Bit Read', sig1: 'M/IŌ:1', sig2: 'BHĒ:0', sig3: 'RD̄:0', colorVar: 'var(--ss-success)', softVar: 'var(--ss-success-soft)' },
  MW: { name: '16-Bit Write', sig1: 'M/IŌ:1', sig2: 'BHĒ:0', sig3: 'WR̄:0', colorVar: 'var(--ss-warning)', softVar: 'var(--ss-warning-soft)' },
  IOR: { name: 'I/O Read', sig1: 'M/IŌ:0', sig2: 'DT/R̄:0', sig3: 'RD̄:0', colorVar: 'var(--ss-secondary)', softVar: 'var(--ss-secondary-soft)' },
  IOW: { name: 'I/O Write', sig1: 'M/IŌ:0', sig2: 'DT/R̄:1', sig3: 'WR̄:0', colorVar: 'var(--ss-danger)', softVar: 'var(--ss-danger-soft)' },
  BI: { name: 'Bus Idle', sig1: 'M/IŌ:1', sig2: 'RD̄:1', sig3: 'WR̄:1', colorVar: 'var(--ss-text-secondary)', softVar: 'var(--ss-bg-panel-alt)' },
};

export const CycleTimingDiagram: React.FC = () => {
  const { architecture, snapshot, snapshot8086, revision } = useSimulatorStore();
  void revision;

  const is8085 = architecture === '8085';
  const cycles = is8085 ? snapshot?.machineCycles ?? [] : snapshot8086?.cycles ?? [];
  const tDelta = is8085 ? snapshot?.tStatesDelta ?? 0 : snapshot8086?.tStatesDelta ?? 0;

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ss-text-secondary)' }}
        >
          {is8085 ? 'Machine Cycle & Bus Control Signals' : '8086 Bus Cycles & Control Signals'}
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--ss-warning)' }}>
          +{tDelta} T-States
        </span>
      </div>

      {cycles.length === 0 ? (
        <div
          className="rounded-lg border px-3 py-4 text-center text-xs"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
            color: 'var(--ss-text-muted)',
          }}
        >
          {is8085
            ? 'Step or Run an instruction to inspect its M-Cycle control signals (ALE, IO/M̄, RD̄, WR̄).'
            : 'Step or Run an 8086 instruction to inspect its BIU Bus Cycles (M/IŌ, DT/R̄, BHĒ, RD̄, WR̄).'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {cycles.map((c, idx) => {
            const meta = is8085
              ? CYCLE_META_8085[c as MachineCycleType]
              : CYCLE_META_8086[c as Cycle8086Type];
            return (
              <div
                key={`${c}-${idx}`}
                className="rounded-lg border p-2"
                style={{
                  backgroundColor: meta.softVar,
                  borderColor: meta.colorVar,
                  color: meta.colorVar,
                }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                  <span>{is8085 ? `M${idx + 1}` : `B${idx + 1}`}: {c}</span>
                  <span>{is8085 ? (c === 'OF' ? '4T' : '3T') : '4T'}</span>
                </div>
                <div className="mt-0.5 text-[11px] font-semibold">{meta.name}</div>
                <div
                  className="mt-1.5 flex items-center justify-between border-t pt-1 font-mono text-[9px]"
                  style={{
                    borderColor: 'var(--ss-border-subtle)',
                    color: 'var(--ss-text-secondary)',
                  }}
                >
                  <span>{meta.sig1}</span>
                  <span>{meta.sig2}</span>
                  <span>{meta.sig3}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};