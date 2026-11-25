import React from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export const MachineCodeTable: React.FC = () => {
  const {
    architecture,
    assembly,
    assembly8086,
    cpu,
    cpu8086,
    hoveredAddress,
    setHoveredAddress,
    setMemoryJumpAddress,
    revision,
  } = useSimulatorStore();

  void revision;
  const is8085 = architecture === '8085';
  const currentPc = is8085 ? cpu.pc : cpu8086.ip;
  const rows = is8085 ? assembly?.rows ?? [] : assembly8086?.rows ?? [];

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--ss-bg-panel-alt)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ss-text-secondary)' }}
        >
          {is8085 ? 'Machine Code & M-Cycles' : '8086 Machine Code & Bus Cycles'}
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--ss-accent)' }}>
          {is8085 ? 'PC' : 'IP'}: {currentPc.toString(16).toUpperCase().padStart(4, '0')}H
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead
            className="sticky top-0 text-[10px] uppercase"
            style={{
              backgroundColor: 'var(--ss-bg-elevated)',
              color: 'var(--ss-text-muted)',
            }}
          >
            <tr>
              <th className="px-2.5 py-1.5">Addr</th>
              <th className="px-2.5 py-1.5">Hex</th>
              <th className="px-2.5 py-1.5">Mnemonic</th>
              <th className="px-2.5 py-1.5 text-right">Cycles</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrentPC = !row.isDirective && row.address === currentPc;
              const isHovered = hoveredAddress === row.address;
              const cycleList = 'machineCycles' in row ? row.machineCycles : row.cycles;
              return (
                <tr
                  key={`${row.lineNumber}-${row.address}`}
                  onMouseEnter={() => setHoveredAddress(row.address)}
                  onMouseLeave={() => setHoveredAddress(null)}
                  onClick={() => setMemoryJumpAddress(row.address)}
                  className="cursor-pointer border-b transition"
                  style={{
                    borderColor: 'var(--ss-border-subtle)',
                    backgroundColor: isCurrentPC
                      ? 'var(--ss-accent-soft)'
                      : isHovered
                        ? 'var(--ss-bg-panel-alt)'
                        : 'transparent',
                    color: isCurrentPC ? 'var(--ss-accent-text)' : 'var(--ss-text-secondary)',
                  }}
                >
                  <td className="px-2.5 py-1.5 font-semibold" style={{ color: 'var(--ss-warning)' }}>
                    {row.address.toString(16).toUpperCase().padStart(4, '0')}H
                  </td>
                  <td className="px-2.5 py-1.5" style={{ color: 'var(--ss-success)' }}>
                    {row.bytes
                      .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
                      .join(' ')}
                  </td>
                  <td className="px-2.5 py-1.5" style={{ color: 'var(--ss-text-primary)' }}>
                    {row.mnemonic} {row.operands.join(', ')}
                  </td>
                  <td className="px-2.5 py-1.5 text-right" style={{ color: 'var(--ss-text-muted)' }}>
                    {row.isDirective ? (
                      <span style={{ color: 'var(--ss-secondary)' }}>DATA</span>
                    ) : (
                      <span>
                        {cycleList.join('·')} ({row.tStates}T)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};