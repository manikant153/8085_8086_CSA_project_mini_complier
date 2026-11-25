import React, { useEffect, useState } from 'react';
import type { BusNode8086 } from '../../core/isa/arch8086';
import type { BusNode } from '../../core/isa/busPaths';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface BlockBox<T extends string> {
  id: T;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SILICON_BLOCKS_8085: BlockBox<BusNode>[] = [
  { id: 'ACC', label: 'ACCUMULATOR (A)', x: 24, y: 24, w: 130, h: 46 },
  { id: 'TEMP', label: 'TEMP REG', x: 174, y: 24, w: 105, h: 46 },
  { id: 'FLAGS', label: 'FLAG FLIP-FLOPS', sublabel: 'S Z AC P CY', x: 24, y: 92, w: 115, h: 48 },
  { id: 'ALU', label: '8-BIT ALU', sublabel: 'ADD / SUB / LOGIC', x: 162, y: 92, w: 120, h: 48 },
  { id: 'IR', label: 'INSTRUCTION REG', x: 24, y: 174, w: 130, h: 44 },
  { id: 'DECODER', label: 'INSTR DECODER', sublabel: 'TIMING & CONTROL', x: 24, y: 234, w: 130, h: 48 },
  { id: 'REG_ARRAY', label: 'REGISTER ARRAY', sublabel: 'B C | D E | H L', x: 345, y: 24, w: 155, h: 66 },
  { id: 'SP', label: 'STACK POINTER', sublabel: '16-BIT SP', x: 345, y: 106, w: 155, h: 44 },
  { id: 'PC', label: 'PROGRAM COUNTER', sublabel: '16-BIT PC', x: 345, y: 166, w: 155, h: 44 },
  { id: 'IO_PORT', label: 'I/O PORT CTRL', sublabel: 'PORTS 00H–FFH', x: 345, y: 234, w: 155, h: 48 },
  { id: 'MEMORY', label: '64KB SYSTEM RAM', sublabel: '0000H – FFFFH', x: 545, y: 92, w: 130, h: 118 },
];

const SILICON_BLOCKS_8086: BlockBox<BusNode8086>[] = [
  { id: 'EU_REGS', label: 'GENERAL REGS', sublabel: 'AX BX CX DX', x: 24, y: 24, w: 145, h: 52 },
  { id: 'POINTERS', label: 'INDEX & POINTERS', sublabel: 'SP BP SI DI', x: 24, y: 90, w: 145, h: 48 },
  { id: 'ALU_16', label: '16-BIT ALU', sublabel: 'ADD / MUL / SHIFT', x: 185, y: 24, w: 110, h: 52 },
  { id: 'FLAGS_16', label: '16-BIT FLAGS', sublabel: 'OF DF IF SF ZF CF', x: 185, y: 90, w: 110, h: 48 },
  { id: 'CONTROL', label: 'EU CONTROL', sublabel: 'DECODE & TIMING', x: 24, y: 158, w: 271, h: 44 },
  { id: 'PREFETCH_Q', label: '6-BYTE PREFETCH QUEUE', sublabel: 'BIU PIPELINE', x: 24, y: 222, w: 271, h: 54 },
  { id: 'SEG_REGS', label: 'SEGMENT REGS', sublabel: 'CS DS SS ES', x: 345, y: 24, w: 155, h: 52 },
  { id: 'CS_IP', label: 'INSTR POINTER (IP)', x: 345, y: 90, w: 155, h: 48 },
  { id: 'BIU_ADDER', label: 'Σ 20-BIT ADDER', sublabel: 'SEG × 16 + OFFSET', x: 345, y: 158, w: 155, h: 48 },
  { id: 'IO_PORT', label: 'I/O PORT CTRL', sublabel: 'PORTS 00H–FFH', x: 345, y: 222, w: 155, h: 54 },
  { id: 'MEMORY', label: '1MB / 64KB RAM', sublabel: 'AD15–AD0 · A19–A16', x: 545, y: 74, w: 130, h: 132 },
];

const hex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0') + 'H';
const hex4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0') + 'H';

export const CpuBlockDiagram: React.FC = () => {
  const { architecture, cpu, cpu8086, snapshot, snapshot8086, activeTheme, revision } = useSimulatorStore();
  const t = activeTheme.tokens;

  const is8085 = architecture === '8085';
  const routes = is8085 ? snapshot?.busRoutes ?? [] : snapshot8086?.busRoutes ?? [];
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);

  useEffect(() => {
    setSelectedStepIdx(Math.max(0, routes.length - 1));
  }, [snapshot, snapshot8086, routes.length, revision, architecture]);

  const activeRoute = routes[Math.min(selectedStepIdx, Math.max(0, routes.length - 1))] ?? null;

  if (!is8085) {
    const activeNodes86 = new Set<BusNode8086>((activeRoute?.path as BusNode8086[]) ?? []);
    const busActive = activeNodes86.has('INTERNAL_BUS');
    const addrActive = activeNodes86.has('ADDR_20');

    const getVal86 = (id: BusNode8086): string | undefined => {
      switch (id) {
        case 'EU_REGS':
          return `AX:${hex4(cpu8086.r.AX)} BX:${hex4(cpu8086.r.BX)}`;
        case 'POINTERS':
          return `SP:${hex4(cpu8086.r.SP)} CX:${hex4(cpu8086.r.CX)}`;
        case 'CS_IP':
          return `IP:${hex4(cpu8086.ip)}`;
        default:
          return undefined;
      }
    };

    return (
      <div
        className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border p-3"
        style={{
          backgroundColor: 'var(--ss-bg-panel)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--ss-text-secondary)' }}
            >
              8086 BIU & EU Pipeline
            </span>
            <span className="ml-2 font-mono text-[11px]" style={{ color: 'var(--ss-accent)' }}>
              {snapshot8086?.executedInstruction ?? 'READY'}
            </span>
          </div>

          {routes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {routes.map((step, idx) => {
                const isSelected =
                  (selectedStepIdx >= routes.length ? routes.length - 1 : selectedStepIdx) === idx;
                return (
                  <button
                    key={`${step.label}-${idx}`}
                    onClick={() => setSelectedStepIdx(idx)}
                    className="rounded-md px-2 py-0.5 text-[10px] font-medium transition"
                    style={{
                      backgroundColor: isSelected ? 'var(--ss-accent-soft)' : 'var(--ss-bg-panel-alt)',
                      color: isSelected ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                      boxShadow: isSelected ? 'inset 0 0 0 1px var(--ss-accent)' : undefined,
                    }}
                  >
                    T{idx + 1}: {step.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="flex aspect-[700/305] w-full items-center justify-center overflow-hidden rounded-lg border lg:max-h-[290px]"
          style={{ backgroundColor: t.bgSvg, borderColor: t.borderSubtle }}
        >
          <svg viewBox="0 0 700 305" className="h-full w-full">
            <rect
              x="312"
              y="16"
              width="16"
              height="272"
              rx="4"
              fill={busActive ? t.accentSoft : t.svgBusBg}
              stroke={busActive ? t.svgDataBus : t.svgBusStroke}
              strokeWidth={busActive ? 2 : 1}
            />
            <text
              x="320"
              y="152"
              fill={busActive ? t.accentText : t.textMuted}
              fontSize="8.5"
              fontWeight="bold"
              textAnchor="middle"
              transform="rotate(-90 320 152)"
              letterSpacing="1.8"
            >
              16-BIT INTERNAL DATA BUS
            </text>

            <line
              x1="500"
              y1="172"
              x2="545"
              y2="172"
              stroke={addrActive ? t.svgAddrBus : t.svgBusStroke}
              strokeWidth={addrActive ? 3 : 1.5}
              strokeDasharray={addrActive ? '5 3' : undefined}
            />
            <text
              x="522"
              y="164"
              fill={addrActive ? t.svgAddrBus : t.textMuted}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              A19–A0
            </text>

            <line
              x1="500"
              y1="114"
              x2="545"
              y2="114"
              stroke={busActive && activeNodes86.has('MEMORY') ? t.svgDataBus : t.svgBusStroke}
              strokeWidth={busActive && activeNodes86.has('MEMORY') ? 3 : 1.5}
            />
            <text
              x="522"
              y="107"
              fill={busActive && activeNodes86.has('MEMORY') ? t.accentText : t.textMuted}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              AD15–AD0
            </text>

            {[50, 114, 180, 248].map((yPos, idx) => (
              <g key={idx}>
                <line x1="295" y1={yPos} x2="312" y2={yPos} stroke={t.svgBusStroke} strokeWidth="1.5" />
                <line x1="328" y1={yPos} x2="345" y2={yPos} stroke={t.svgBusStroke} strokeWidth="1.5" />
              </g>
            ))}

            {SILICON_BLOCKS_8086.map((b) => {
              const isActive = activeNodes86.has(b.id);
              const liveVal = getVal86(b.id);
              return (
                <g key={b.id}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="6"
                    fill={isActive ? t.accentSoft : t.svgBlockBg}
                    stroke={isActive ? t.svgDataBus : t.svgBlockStroke}
                    strokeWidth={isActive ? 2 : 1.2}
                  />
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + (b.sublabel || liveVal ? 19 : b.h / 2 + 4)}
                    fill={isActive ? t.textPrimary : t.textSecondary}
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {b.label}
                  </text>
                  {(liveVal || b.sublabel) && (
                    <text
                      x={b.x + b.w / 2}
                      y={b.y + 35}
                      fill={isActive ? t.accent : t.textMuted}
                      fontSize="8.5"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {liveVal ?? b.sublabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  const activeNodes = new Set<BusNode>((activeRoute?.path as BusNode[]) ?? []);
  const dataBusActive = activeNodes.has('DATA_BUS');
  const addrBusActive = activeNodes.has('ADDR_BUS');

  const getDynamicValue = (id: BusNode): string | undefined => {
    switch (id) {
      case 'ACC':
        return hex2(cpu.r.A);
      case 'PC':
        return hex4(cpu.pc);
      case 'SP':
        return hex4(cpu.sp);
      case 'REG_ARRAY':
        return `HL:${hex4((cpu.r.H << 8) | cpu.r.L)}`;
      default:
        return undefined;
    }
  };

  return (
    <div
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      {/* Header + Micro-Step Selector */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--ss-text-secondary)' }}
          >
            8085 Silicon Microarchitecture
          </span>
          <span className="ml-2 font-mono text-[11px]" style={{ color: 'var(--ss-accent)' }}>
            {snapshot?.executedInstruction ?? 'READY'}
          </span>
        </div>

        {routes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {routes.map((step, idx) => {
              const isSelected =
                (selectedStepIdx >= routes.length ? routes.length - 1 : selectedStepIdx) === idx;
              return (
                <button
                  key={`${step.label}-${idx}`}
                  onClick={() => setSelectedStepIdx(idx)}
                  className="rounded-md px-2 py-0.5 text-[10px] font-medium transition"
                  style={{
                    backgroundColor: isSelected ? 'var(--ss-accent-soft)' : 'var(--ss-bg-panel-alt)',
                    color: isSelected ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                    boxShadow: isSelected ? 'inset 0 0 0 1px var(--ss-accent)' : undefined,
                  }}
                >
                  T{idx + 1}: {step.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SVG Die Schematic */}
      <div
        className="flex aspect-[700/305] w-full items-center justify-center overflow-hidden rounded-lg border lg:max-h-[290px]"
        style={{
          backgroundColor: t.bgSvg,
          borderColor: t.borderSubtle,
        }}
      >
        <svg viewBox="0 0 700 305" className="h-full w-full">
          {/* 8-Bit Internal Data Bus Backbone */}
          <rect
            x="304"
            y="16"
            width="16"
            height="272"
            rx="4"
            fill={dataBusActive ? t.accentSoft : t.svgBusBg}
            stroke={dataBusActive ? t.svgDataBus : t.svgBusStroke}
            strokeWidth={dataBusActive ? 2 : 1}
          />
          <text
            x="312"
            y="152"
            fill={dataBusActive ? t.accentText : t.textMuted}
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            transform="rotate(-90 312 152)"
            letterSpacing="2"
          >
            8-BIT INTERNAL DATA BUS
          </text>

          {/* 16-Bit Address Bus Rail */}
          <line
            x1="500"
            y1="188"
            x2="545"
            y2="188"
            stroke={addrBusActive ? t.svgAddrBus : t.svgBusStroke}
            strokeWidth={addrBusActive ? 3 : 1.5}
            strokeDasharray={addrBusActive ? '5 3' : undefined}
          />
          <text
            x="522"
            y="181"
            fill={addrBusActive ? t.svgAddrBus : t.textMuted}
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
          >
            A15–A0
          </text>

          {/* External Memory Data Rail */}
          <line
            x1="500"
            y1="130"
            x2="545"
            y2="130"
            stroke={dataBusActive && activeNodes.has('MEMORY') ? t.svgDataBus : t.svgBusStroke}
            strokeWidth={dataBusActive && activeNodes.has('MEMORY') ? 3 : 1.5}
          />
          <text
            x="522"
            y="123"
            fill={dataBusActive && activeNodes.has('MEMORY') ? t.accentText : t.textMuted}
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
          >
            AD7–AD0
          </text>

          {/* Horizontal Bus Tap Lines */}
          {[47, 116, 196, 258].map((yPos, idx) => (
            <g key={idx}>
              <line x1="282" y1={yPos} x2="304" y2={yPos} stroke={t.svgBusStroke} strokeWidth="1.5" />
              <line x1="320" y1={yPos} x2="345" y2={yPos} stroke={t.svgBusStroke} strokeWidth="1.5" />
            </g>
          ))}

          {/* Silicon Functional Blocks */}
          {SILICON_BLOCKS_8085.map((b) => {
            const isActive = activeNodes.has(b.id);
            const liveVal = getDynamicValue(b.id);
            return (
              <g key={b.id}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="6"
                  fill={isActive ? t.accentSoft : t.svgBlockBg}
                  stroke={isActive ? t.svgDataBus : t.svgBlockStroke}
                  strokeWidth={isActive ? 2 : 1.2}
                />
                <text
                  x={b.x + b.w / 2}
                  y={b.y + (b.sublabel || liveVal ? 18 : b.h / 2 + 4)}
                  fill={isActive ? t.textPrimary : t.textSecondary}
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {b.label}
                </text>
                {(liveVal || b.sublabel) && (
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + 34}
                    fill={isActive ? t.accent : t.textMuted}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {liveVal ?? b.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};