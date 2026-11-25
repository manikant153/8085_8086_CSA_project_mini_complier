import React from 'react';
import { Zap } from 'lucide-react';
import type { InterruptPin } from '../../core/emulator/cpu';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export const TrainerKitPanel: React.FC = () => {
  const {
    architecture,
    cpu,
    cpu8086,
    inputSwitches,
    toggleInputSwitch,
    triggerInterrupt,
    revision,
  } = useSimulatorStore();
  void revision;

  const is8085 = architecture === '8085';
  const outPort0 = is8085 ? cpu.ioPorts[0x00] ?? 0x00 : cpu8086.ioPorts[0x00] ?? 0x00;
  const interruptPins: InterruptPin[] = ['TRAP', 'RST7.5', 'RST6.5', 'RST5.5'];
  const inteEnabled = is8085 ? cpu.interruptsEnabled : cpu8086.f.IF === 1;

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ss-text-secondary)' }}
        >
          I/O Trainer Kit & Hardware Interrupts
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--ss-text-muted)' }}>
          PORT 00H ({architecture})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Input DIP Switches (IN 00H) */}
        <div
          className="rounded-lg border p-2.5"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold" style={{ color: 'var(--ss-text-secondary)' }}>
              IN 00H DIP Switches
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--ss-accent)' }}>
              {inputSwitches.toString(16).toUpperCase().padStart(2, '0')}H
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {[7, 6, 5, 4, 3, 2, 1, 0].map((bit) => {
              const on = ((inputSwitches >> bit) & 1) === 1;
              return (
                <button
                  key={bit}
                  onClick={() => toggleInputSwitch(bit)}
                  className="flex flex-col items-center rounded border py-1 font-mono text-[10px] transition"
                  style={{
                    backgroundColor: on ? 'var(--ss-accent-soft)' : 'var(--ss-bg-input)',
                    borderColor: on ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
                    color: on ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                    fontWeight: on ? 700 : 400,
                  }}
                >
                  <span>D{bit}</span>
                  <span>{on ? '1' : '0'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Output LEDs & Hex Display (OUT 00H) */}
        <div
          className="rounded-lg border p-2.5"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold" style={{ color: 'var(--ss-text-secondary)' }}>
              OUT 00H LED Array
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--ss-success)' }}>
              {outPort0.toString(16).toUpperCase().padStart(2, '0')}H
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {[7, 6, 5, 4, 3, 2, 1, 0].map((bit) => {
              const lit = ((outPort0 >> bit) & 1) === 1;
              return (
                <div
                  key={bit}
                  className="flex flex-col items-center rounded border py-1 font-mono text-[10px]"
                  style={{
                    backgroundColor: 'var(--ss-bg-input)',
                    borderColor: 'var(--ss-border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--ss-text-muted)' }}>L{bit}</span>
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: lit ? 'var(--ss-success)' : 'var(--ss-border-strong)',
                      boxShadow: lit ? '0 0 8px var(--ss-success)' : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hardware Interrupt Pins */}
        <div
          className="rounded-lg border p-2.5"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold" style={{ color: 'var(--ss-text-secondary)' }}>
              Interrupt Pins
            </span>
            <span
              className="font-mono text-[10px] font-bold"
              style={{ color: inteEnabled ? 'var(--ss-success)' : 'var(--ss-warning)' }}
            >
              {is8085 ? `INTE: ${inteEnabled ? '1 (EI)' : '0 (DI)'}` : `IF: ${inteEnabled ? '1 (STI)' : '0 (CLI)'}`}
            </span>
          </div>
          {is8085 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {interruptPins.map((pin) => {
                const isPending = cpu.pendingInterrupts.has(pin);
                return (
                  <button
                    key={pin}
                    onClick={() => triggerInterrupt(pin)}
                    className="flex items-center justify-center gap-1 rounded border px-2 py-1 font-mono text-[10px] font-semibold transition"
                    style={{
                      backgroundColor: isPending ? 'var(--ss-danger-soft)' : 'var(--ss-bg-input)',
                      borderColor: isPending ? 'var(--ss-danger)' : 'var(--ss-border-strong)',
                      color: isPending ? 'var(--ss-danger)' : 'var(--ss-text-secondary)',
                    }}
                  >
                    <Zap className="h-3 w-3" style={{ color: 'var(--ss-warning)' }} />
                    {pin}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {['NMI (INT 02H)', 'INTR (Mask)'].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-1 rounded border px-2 py-1.5 font-mono text-[10px] font-semibold"
                  style={{
                    backgroundColor: 'var(--ss-bg-input)',
                    borderColor: 'var(--ss-border-subtle)',
                    color: 'var(--ss-text-muted)',
                  }}
                >
                  <Zap className="h-3 w-3" style={{ color: 'var(--ss-warning)' }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};