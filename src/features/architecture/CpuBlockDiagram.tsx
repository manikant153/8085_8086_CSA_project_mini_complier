import React, { useEffect, useState } from 'react';
import type { BusNode8086 } from '../../core/isa/arch8086';
import type { BusNode } from '../../core/isa/busPaths';
import { useSimulatorStore } from '../../store/useSimulatorStore';

type DomainTone = 'alu' | 'flags' | 'control' | 'regs' | 'memory';

interface BlockBox<T extends string> {
  id: T;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: DomainTone;
}

const TONE_STYLES: Record<
  DomainTone,
  { bg: string; activeBg: string; stroke: string; activeStroke: string; accent: string }
> = {
  alu: {
    bg: '#f0f7ff',
    activeBg: '#dbeafe',
    stroke: '#bfdbfe',
    activeStroke: '#0071e3',
    accent: '#0071e3',
  },
  flags: {
    bg: '#fdf2f8',
    activeBg: '#fce7f3',
    stroke: '#fbcfe8',
    activeStroke: '#db2777',
    accent: '#db2777',
  },
  control: {
    bg: '#fffbeb',
    activeBg: '#fef3c7',
    stroke: '#fde68a',
    activeStroke: '#d97706',
    accent: '#d97706',
  },
  regs: {
    bg: '#ecfdf5',
    activeBg: '#d1fae5',
    stroke: '#a7f3d0',
    activeStroke: '#059669',
    accent: '#059669',
  },
  memory: {
    bg: '#fff5f2',
    activeBg: '#ffedd5',
    stroke: '#fed7aa',
    activeStroke: '#e05a33',
    accent: '#e05a33',
  },
};

const SILICON_BLOCKS_8085: BlockBox<BusNode>[] = [
  { id: 'ACC', label: 'ACCUMULATOR (A)', x: 24, y: 24, w: 130, h: 46, tone: 'alu' },
  { id: 'TEMP', label: 'TEMP REG', x: 174, y: 24, w: 105, h: 46, tone: 'alu' },
  { id: 'FLAGS', label: 'FLAG FLIP-FLOPS', sublabel: 'S Z AC P CY', x: 24, y: 92, w: 115, h: 48, tone: 'flags' },
  { id: 'ALU', label: '8-BIT ALU', sublabel: 'ADD / SUB / LOGIC', x: 162, y: 92, w: 120, h: 48, tone: 'alu' },
  { id: 'IR', label: 'INSTRUCTION REG', x: 24, y: 174, w: 130, h: 44, tone: 'control' },
  { id: 'DECODER', label: 'INSTR DECODER', sublabel: 'TIMING & CONTROL', x: 24, y: 234, w: 130, h: 48, tone: 'control' },
  { id: 'REG_ARRAY', label: 'REGISTER ARRAY', sublabel: 'B C | D E | H L', x: 345, y: 24, w: 155, h: 66, tone: 'regs' },
  { id: 'SP', label: 'STACK POINTER', sublabel: '16-BIT SP', x: 345, y: 106, w: 155, h: 44, tone: 'regs' },
  { id: 'PC', label: 'PROGRAM COUNTER', sublabel: '16-BIT PC', x: 345, y: 166, w: 155, h: 44, tone: 'regs' },
  { id: 'IO_PORT', label: 'I/O PORT CTRL', sublabel: 'PORTS 00H–FFH', x: 345, y: 234, w: 155, h: 48, tone: 'memory' },
  { id: 'MEMORY', label: '64KB SYSTEM RAM', sublabel: '0000H – FFFFH', x: 545, y: 92, w: 130, h: 118, tone: 'memory' },
];

const SILICON_BLOCKS_8086: BlockBox<BusNode8086>[] = [
  { id: 'EU_REGS', label: 'GENERAL REGS', sublabel: 'AX BX CX DX', x: 24, y: 24, w: 145, h: 52, tone: 'regs' },
  { id: 'POINTERS', label: 'INDEX & POINTERS', sublabel: 'SP BP SI DI', x: 24, y: 90, w: 145, h: 48, tone: 'regs' },
  { id: 'ALU_16', label: '16-BIT ALU', sublabel: 'ADD / MUL / SHIFT', x: 185, y: 24, w: 110, h: 52, tone: 'alu' },
  { id: 'FLAGS_16', label: '16-BIT FLAGS', sublabel: 'OF DF IF SF ZF CF', x: 185, y: 90, w: 110, h: 48, tone: 'flags' },
  { id: 'CONTROL', label: 'EU CONTROL', sublabel: 'DECODE & TIMING', x: 24, y: 158, w: 271, h: 44, tone: 'control' },
  { id: 'PREFETCH_Q', label: '6-BYTE PREFETCH QUEUE', sublabel: 'BIU PIPELINE', x: 24, y: 222, w: 271, h: 54, tone: 'alu' },
  { id: 'SEG_REGS', label: 'SEGMENT REGS', sublabel: 'CS DS SS ES', x: 345, y: 24, w: 155, h: 52, tone: 'regs' },
  { id: 'CS_IP', label: 'INSTR POINTER (IP)', x: 345, y: 90, w: 155, h: 48, tone: 'regs' },
  { id: 'BIU_ADDER', label: 'Σ 20-BIT ADDER', sublabel: 'SEG × 16 + OFFSET', x: 345, y: 158, w: 155, h: 48, tone: 'control' },
  { id: 'IO_PORT', label: 'I/O PORT CTRL', sublabel: 'PORTS 00H–FFH', x: 345, y: 222, w: 155, h: 54, tone: 'memory' },
  { id: 'MEMORY', label: '1MB / 64KB RAM', sublabel: 'AD15–AD0 · A19–A16', x: 545, y: 74, w: 130, h: 132, tone: 'memory' },
];

const hex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0') + 'H';
const hex4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0') + 'H';

const DomainLegend = () => (
  <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[#6e6e73]">
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#0071e3]" /> ALU
    </span>
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#d97706]" /> Control
    </span>
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#059669]" /> Registers
    </span>
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#e05a33]" /> RAM &amp; I/O
    </span>
  </div>
);

export const CpuBlockDiagram: React.FC = () => {
  const { architecture, cpu, cpu8086, snapshot, snapshot8086, activeTheme, revision } =
    useSimulatorStore();
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
      <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-[#f9f9fb] p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
              8086 BIU &amp; EU Pipeline
            </span>
            <span className="rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#0071e3]">
              {snapshot8086?.executedInstruction ?? 'READY'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DomainLegend />
            {routes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {routes.map((step, idx) => {
                  const isSelected =
                    (selectedStepIdx >= routes.length ? routes.length - 1 : selectedStepIdx) === idx;
                  return (
                    <button
                      key={`${step.label}-${idx}`}
                      onClick={() => setSelectedStepIdx(idx)}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition"
                      style={{
                        backgroundColor: isSelected ? '#0071e3' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#6e6e73',
                        border: '1px solid #e2e2e7',
                      }}
                    >
                      T{idx + 1}: {step.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-[#e2e2e7] bg-white p-2">
          <svg viewBox="0 0 700 305" className="h-auto w-full">
            <rect
              x="312"
              y="16"
              width="16"
              height="272"
              rx="6"
              fill={busActive ? '#dbeafe' : '#f1f5f9'}
              stroke={busActive ? '#0071e3' : '#cbd5e1'}
              strokeWidth={busActive ? 2 : 1.2}
            />
            <text
              x="320"
              y="152"
              fill={busActive ? '#005bb5' : '#64748b'}
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
              stroke={addrActive ? '#e05a33' : '#cbd5e1'}
              strokeWidth={addrActive ? 3 : 1.5}
              strokeDasharray={addrActive ? '5 3' : undefined}
            />
            <text
              x="522"
              y="164"
              fill={addrActive ? '#e05a33' : '#64748b'}
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
              stroke={busActive && activeNodes86.has('MEMORY') ? '#0071e3' : '#cbd5e1'}
              strokeWidth={busActive && activeNodes86.has('MEMORY') ? 3 : 1.5}
            />
            <text
              x="522"
              y="107"
              fill={busActive && activeNodes86.has('MEMORY') ? '#005bb5' : '#64748b'}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              AD15–AD0
            </text>

            {[50, 114, 180, 248].map((yPos, idx) => (
              <g key={idx}>
                <line x1="295" y1={yPos} x2="312" y2={yPos} stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="328" y1={yPos} x2="345" y2={yPos} stroke="#cbd5e1" strokeWidth="1.5" />
              </g>
            ))}

            {SILICON_BLOCKS_8086.map((b) => {
              const isActive = activeNodes86.has(b.id);
              const liveVal = getVal86(b.id);
              const tone = TONE_STYLES[b.tone];
              return (
                <g key={b.id}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="8"
                    fill={isActive ? tone.activeBg : tone.bg}
                    stroke={isActive ? tone.activeStroke : tone.stroke}
                    strokeWidth={isActive ? 2.2 : 1.3}
                  />
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + (b.sublabel || liveVal ? 19 : b.h / 2 + 4)}
                    fill={t.textPrimary}
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
                      fill={tone.accent}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="600"
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
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-[#f9f9fb] p-3 sm:p-4">
      {/* Header + Legend + Micro-Step Selector */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
            8085 Silicon Microarchitecture
          </span>
          <span className="rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#0071e3]">
            {snapshot?.executedInstruction ?? 'READY'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DomainLegend />
          {routes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {routes.map((step, idx) => {
                const isSelected =
                  (selectedStepIdx >= routes.length ? routes.length - 1 : selectedStepIdx) === idx;
                return (
                  <button
                    key={`${step.label}-${idx}`}
                    onClick={() => setSelectedStepIdx(idx)}
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition"
                    style={{
                      backgroundColor: isSelected ? '#0071e3' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#6e6e73',
                      border: '1px solid #e2e2e7',
                    }}
                  >
                    T{idx + 1}: {step.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Color-Coded SVG Die Schematic */}
      <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-[#e2e2e7] bg-white p-2">
        <svg viewBox="0 0 700 305" className="h-auto w-full">
          {/* 8-Bit Internal Data Bus Backbone */}
          <rect
            x="304"
            y="16"
            width="16"
            height="272"
            rx="6"
            fill={dataBusActive ? '#dbeafe' : '#f1f5f9'}
            stroke={dataBusActive ? '#0071e3' : '#cbd5e1'}
            strokeWidth={dataBusActive ? 2 : 1.2}
          />
          <text
            x="312"
            y="152"
            fill={dataBusActive ? '#005bb5' : '#64748b'}
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
            stroke={addrBusActive ? '#e05a33' : '#cbd5e1'}
            strokeWidth={addrBusActive ? 3 : 1.5}
            strokeDasharray={addrBusActive ? '5 3' : undefined}
          />
          <text
            x="522"
            y="181"
            fill={addrBusActive ? '#e05a33' : '#64748b'}
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
            stroke={dataBusActive && activeNodes.has('MEMORY') ? '#0071e3' : '#cbd5e1'}
            strokeWidth={dataBusActive && activeNodes.has('MEMORY') ? 3 : 1.5}
          />
          <text
            x="522"
            y="123"
            fill={dataBusActive && activeNodes.has('MEMORY') ? '#005bb5' : '#64748b'}
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
          >
            AD7–AD0
          </text>

          {/* Horizontal Bus Tap Lines */}
          {[47, 116, 196, 258].map((yPos, idx) => (
            <g key={idx}>
              <line x1="282" y1={yPos} x2="304" y2={yPos} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="320" y1={yPos} x2="345" y2={yPos} stroke="#cbd5e1" strokeWidth="1.5" />
            </g>
          ))}

          {/* Color-Coded Silicon Functional Blocks */}
          {SILICON_BLOCKS_8085.map((b) => {
            const isActive = activeNodes.has(b.id);
            const liveVal = getDynamicValue(b.id);
            const tone = TONE_STYLES[b.tone];
            return (
              <g key={b.id}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="8"
                  fill={isActive ? tone.activeBg : tone.bg}
                  stroke={isActive ? tone.activeStroke : tone.stroke}
                  strokeWidth={isActive ? 2.2 : 1.3}
                />
                <text
                  x={b.x + b.w / 2}
                  y={b.y + (b.sublabel || liveVal ? 18 : b.h / 2 + 4)}
                  fill={t.textPrimary}
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
                    fill={tone.accent}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
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