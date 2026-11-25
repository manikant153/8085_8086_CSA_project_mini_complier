import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';

const hex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
const hex4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0');

export const MemoryHexGrid: React.FC = () => {
  const {
    architecture,
    cpu,
    cpu8086,
    snapshot,
    snapshot8086,
    memoryJumpAddress,
    setMemoryJumpAddress,
    hoveredAddress,
    editMemoryByte,
    revision,
  } = useSimulatorStore();

  void revision;
  const is8085 = architecture === '8085';
  const [jumpInput, setJumpInput] = useState(is8085 ? '2000' : '0100');

  const mem = is8085 ? cpu.mem : cpu8086.mem;
  const baseAddr = memoryJumpAddress & 0xfff0;
  const rows = Array.from({ length: 16 }, (_, r) => (baseAddr + r * 16) & 0xffff);

  const pcAddr = is8085 ? cpu.pc : cpu8086.ip;
  const ptrAddr = is8085 ? ((cpu.r.H << 8) | cpu.r.L) & 0xffff : cpu8086.r.BX & 0xffff;
  const spAddr = is8085 ? cpu.sp : cpu8086.r.SP;
  const mutatedAddrs = new Set(
    is8085
      ? snapshot?.memoryMutations.map((m) => m.address) ?? []
      : snapshot8086?.memoryMutations.map((m) => m.address) ?? []
  );

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = jumpInput.replace(/H$/i, '').replace(/^0x/i, '').trim();
    const parsed = parseInt(cleaned, 16);
    if (!Number.isNaN(parsed)) {
      setMemoryJumpAddress(parsed & 0xffff);
    }
  };

  const handleCellDoubleClick = (addr: number) => {
    const current = hex2(mem[addr]);
    const input = window.prompt(`Edit byte at ${hex4(addr)}H (hex 00–FF):`, current);
    if (input === null) return;
    const val = parseInt(input.replace(/H$/i, '').trim(), 16);
    if (!Number.isNaN(val) && val >= 0 && val <= 0xff) {
      editMemoryByte(addr, val);
    }
  };

  const quickButtons = is8085
    ? [
        { label: '2000H', addr: 0x2000 },
        { label: '2050H', addr: 0x2050 },
        { label: 'STACK', addr: (spAddr & 0xfff0) || 0xff00 },
      ]
    : [
        { label: '0100H', addr: 0x0100 },
        { label: '1200H', addr: 0x1200 },
        { label: 'STACK', addr: (spAddr & 0xfff0) || 0xffe0 },
      ];

  return (
    <div
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      {/* Header & Quick Jump */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--ss-bg-panel-alt)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--ss-text-secondary)' }}
          >
            {is8085 ? '64KB Memory Matrix' : '8086 Segment Memory (64KB)'}
          </span>
          <div className="hidden items-center gap-1.5 text-[10px] sm:flex">
            <span
              className="rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'var(--ss-accent-soft)', color: 'var(--ss-accent-text)' }}
            >
              {is8085 ? 'PC' : 'IP'}
            </span>
            <span
              className="rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'var(--ss-warning-soft)', color: 'var(--ss-warning)' }}
            >
              {is8085 ? 'HL' : 'BX'}
            </span>
            <span
              className="rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'var(--ss-secondary-soft)', color: 'var(--ss-secondary)' }}
            >
              SP
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {quickButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => setMemoryJumpAddress(btn.addr)}
              className="rounded border px-2 py-0.5 font-mono text-[10px] transition hover:opacity-90"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-border-strong)',
                color: 'var(--ss-text-secondary)',
              }}
            >
              {btn.label}
            </button>
          ))}

          <form onSubmit={handleJumpSubmit} className="flex items-center">
            <input
              type="text"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={is8085 ? '2000' : '0100'}
              maxLength={5}
              className="w-14 rounded-l border px-1.5 py-0.5 font-mono text-[11px] uppercase outline-none"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-border-strong)',
                color: 'var(--ss-text-primary)',
              }}
            />
            <button
              type="submit"
              className="rounded-r border border-l-0 px-1.5 py-1 transition hover:opacity-90"
              style={{
                backgroundColor: 'var(--ss-bg-elevated)',
                borderColor: 'var(--ss-border-strong)',
                color: 'var(--ss-accent)',
              }}
              title="Jump to Hex Address"
            >
              <Search className="h-3 w-3" />
            </button>
          </form>
        </div>
      </div>

      {/* Hex Grid */}
      <div className="min-w-0 flex-1 overflow-auto p-2 font-mono text-[11px]">
        <table className="w-full min-w-[540px] border-collapse">
          <thead>
            <tr className="text-[10px]" style={{ color: 'var(--ss-text-muted)' }}>
              <th className="pb-1 pr-2 text-left">ADDR</th>
              {Array.from({ length: 16 }, (_, c) => (
                <th key={c} className="pb-1 text-center">
                  +{c.toString(16).toUpperCase()}
                </th>
              ))}
              <th className="pb-1 pl-2 text-left">ASCII</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rowStart) => {
              const rowBytes = Array.from({ length: 16 }, (_, c) => mem[(rowStart + c) & 0xffff]);
              return (
                <tr key={rowStart}>
                  <td className="pr-2 font-semibold" style={{ color: 'var(--ss-text-muted)' }}>
                    {hex4(rowStart)}H
                  </td>
                  {rowBytes.map((val, c) => {
                    const addr = (rowStart + c) & 0xffff;
                    const isPC = addr === pcAddr;
                    const isPtr = addr === ptrAddr;
                    const isSP = addr === spAddr;
                    const isMutated = mutatedAddrs.has(addr);
                    const isHovered = hoveredAddress === addr;

                    let bg = 'transparent';
                    let fg = val !== 0 ? 'var(--ss-text-primary)' : 'var(--ss-text-muted)';
                    let ring: string | undefined;

                    if (isPC) {
                      bg = 'var(--ss-accent-soft)';
                      fg = 'var(--ss-accent-text)';
                      ring = 'inset 0 0 0 1px var(--ss-accent)';
                    } else if (isMutated) {
                      bg = 'var(--ss-success-soft)';
                      fg = 'var(--ss-success)';
                    } else if (isPtr) {
                      bg = 'var(--ss-warning-soft)';
                      fg = 'var(--ss-warning)';
                    } else if (isSP) {
                      bg = 'var(--ss-secondary-soft)';
                      fg = 'var(--ss-secondary)';
                    } else if (isHovered) {
                      bg = 'var(--ss-bg-elevated)';
                      fg = 'var(--ss-text-primary)';
                    }

                    return (
                      <td
                        key={c}
                        onDoubleClick={() => handleCellDoubleClick(addr)}
                        title={`${hex4(addr)}H = ${hex2(val)}H (${val}) — Double-click to edit`}
                        className="cursor-pointer rounded px-1 py-0.5 text-center transition"
                        style={{
                          backgroundColor: bg,
                          color: fg,
                          boxShadow: ring,
                          fontWeight: isPC || isMutated || isPtr || isSP ? 700 : 400,
                        }}
                      >
                        {hex2(val)}
                      </td>
                    );
                  })}
                  <td className="pl-2" style={{ color: 'var(--ss-text-muted)' }}>
                    {rowBytes
                      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
                      .join('')}
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