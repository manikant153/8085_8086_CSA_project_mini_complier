import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Layers,
  Quote,
  Sparkles,
  Star,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import { TEAM_MEMBERS, TESTIMONIALS, type ArchitectureId } from '../../data/landingData';

interface LandingPageProps {
  onLaunchStudio: () => void;
  onOpenArchHistory: (arch: ArchitectureId) => void;
  onOpenMember: (memberId: string) => void;
}

const HERO_SNIPPETS: Record<
  ArchitectureId,
  {
    badge: string;
    code: string;
    regs: { k: string; v: string }[];
    bus: string;
    cycles: string;
  }
> = {
  '8085': {
    badge: '8-BIT · 3.072 MHz',
    code: `        ORG 2000H
        MVI A, 5AH    ; 0101 1010b
        MVI B, 00H    ; 1-bit counter
        MVI C, 08H    ; 8 bits
LOOP:   RAR           ; Bit 0 -> CY
        JNC NEXT
        INR B
NEXT:   DCR C
        JNZ LOOP
        HLT`,
    regs: [
      { k: 'ACC (A)', v: '04H' },
      { k: 'REG B', v: '04H' },
      { k: 'FLAGS', v: 'Z=1 CY=0' },
    ],
    bus: 'Bus: OF (4T) → MR (3T) → ALU',
    cycles: '198 T-States',
  },
  '8086': {
    badge: '16-BIT · BIU/EU',
    code: `        ORG 0100H
        MOV BX, 1200H ; Array base
        MOV CX, 0004H ; 4 words
        MOV AX, 0000H ; Sum = 0
SUM_LP: ADD AX, [BX]  ; Add word
        INC BX
        INC BX
        LOOP SUM_LP   ; CX--
        MOV [1300H], AX
        HLT`,
    regs: [
      { k: 'AX', v: '00F5H' },
      { k: 'BX', v: '1208H' },
      { k: 'CX', v: '0000H' },
    ],
    bus: 'BIU 6B Queue → EU ALU',
    cycles: '16-Bit Segmented',
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchStudio,
  onOpenArchHistory,
  onOpenMember,
}) => {
  const [activePage, setActivePage] = useState<0 | 1 | 2>(0);
  const [previewArch, setPreviewArch] = useState<ArchitectureId>('8085');

  const pageRefs = [
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
  ];

  const scrollToPage = (index: 0 | 1 | 2) => {
    setActivePage(index);
    pageRefs[index].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-page-index'));
            if (idx === 0 || idx === 1 || idx === 2) {
              setActivePage(idx);
            }
          }
        }
      },
      { threshold: 0.45 }
    );

    pageRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const heroData = HERO_SNIPPETS[previewArch];

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden scroll-smooth"
      style={{
        backgroundColor: 'var(--ss-bg, #070b14)',
        color: 'var(--ss-text, #e2e8f0)',
        backgroundImage:
          'linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Ambient Silicon Glows */}
      <div
        className="pointer-events-none fixed -top-32 left-1/4 h-96 w-96 rounded-full blur-[120px]"
        style={{ backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 14%, transparent)' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-1/5 h-80 w-80 rounded-full blur-[120px]"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)' }}
      />

      {/* Sticky Glassmorphic Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0d1424) 80%, transparent)',
          borderColor: 'var(--ss-border, #1e293b)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => scrollToPage(0)}
            className="flex items-center gap-2.5 text-left"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 55%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 15%, transparent)',
                color: 'var(--ss-accent, #38bdf8)',
              }}
            >
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-extrabold tracking-wider uppercase">
                <span>Silicon Studio</span>
                <span className="hidden rounded px-1.5 py-0.5 font-mono text-[10px] font-bold sm:inline-block" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  v2.0
                </span>
              </div>
              <div className="text-[11px] opacity-70">8085 · 8086 Interactive Lab</div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: '01 · Overview', idx: 0 as const },
              { label: '02 · How It Works', idx: 1 as const },
              { label: '03 · Reviews & Team', idx: 2 as const },
            ].map((item) => {
              const isActive = activePage === item.idx;
              return (
                <button
                  key={item.idx}
                  type="button"
                  onClick={() => scrollToPage(item.idx)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--ss-accent, #38bdf8) 16%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--ss-accent, #38bdf8)' : 'var(--ss-muted, #94a3b8)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}

            <span className="mx-1.5 h-4 w-px opacity-20" style={{ backgroundColor: 'var(--ss-text, #e2e8f0)' }} />

            <button
              type="button"
              onClick={() => onOpenArchHistory('8085')}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-80 transition-colors hover:opacity-100"
            >
              8085 History
            </button>
            <button
              type="button"
              onClick={() => onOpenArchHistory('8086')}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-80 transition-colors hover:opacity-100"
            >
              8086 History
            </button>
          </nav>

          <button
            type="button"
            onClick={onLaunchStudio}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--ss-accent, #38bdf8)',
              color: '#06101c',
            }}
          >
            <span>Launch Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Subtle 3-Page Scroll Progress Bar */}
        <div className="h-[2px] w-full" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((activePage + 1) / 3) * 100}%`,
              backgroundColor: 'var(--ss-accent, #38bdf8)',
            }}
          />
        </div>
      </header>

      {/* Right-Side 3-Page Scroll Indicator */}
      <div className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        {([0, 1, 2] as const).map((idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Jump to section ${idx + 1}`}
            onClick={() => scrollToPage(idx)}
            className="group flex items-center gap-2"
          >
            <span
              className="h-2.5 w-2.5 rounded-full border transition-all"
              style={{
                borderColor: 'var(--ss-accent, #38bdf8)',
                backgroundColor:
                  activePage === idx ? 'var(--ss-accent, #38bdf8)' : 'transparent',
                transform: activePage === idx ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          </button>
        ))}
      </div>

      {/* ==================== PAGE 1: WHAT THE PROJECT IS ==================== */}
      <section
        ref={pageRefs[0]}
        data-page-index={0}
        className="relative flex min-h-screen items-center px-4 pt-24 pb-14 sm:px-6"
      >
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <button
              type="button"
              onClick={() => scrollToPage(1)}
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
              style={{
                borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 40%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 12%, transparent)',
                color: 'var(--ss-accent, #38bdf8)',
              }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <Sparkles className="h-3.5 w-3.5" />
              <span>Dual-Architecture Microprocessor Lab · 8085 & 8086</span>
            </button>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.06]">
              See Every Clock Cycle, Bus Transfer &{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, var(--ss-accent, #38bdf8), #818cf8)',
                }}
              >
                Register Change
              </span>{' '}
              Live.
            </h1>

            <p
              className="max-w-2xl text-sm leading-relaxed sm:text-base"
              style={{ color: 'var(--ss-muted, #94a3b8)' }}
            >
              <strong>Silicon Studio</strong> is an interactive 8-bit (Intel 8085) and 16-bit (Intel
              8086) microprocessor engineering workbench right in your browser. Write assembly,
              inspect machine-cycle T-states and memory hex pages in real time, step backward
              through execution history, and debug with a built-in AI Copilot.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onLaunchStudio}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition-transform hover:scale-[1.03]"
                style={{
                  backgroundColor: 'var(--ss-accent, #38bdf8)',
                  color: '#06101c',
                }}
              >
                <span>Open Silicon Studio</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToPage(1)}
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
                style={{
                  borderColor: 'var(--ss-border, #1e293b)',
                  backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 85%, transparent)',
                }}
              >
                <span>How It Works</span>
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              {[
                { label: 'Architectures', value: '8085 + 8086', onClick: () => scrollToPage(1) },
                { label: 'Execution', value: 'T-State Exact', onClick: onLaunchStudio },
                { label: 'AI Copilot', value: 'Offline + Online', onClick: onLaunchStudio },
                { label: 'Exports', value: '.LST & .HEX', onClick: onLaunchStudio },
              ].map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={stat.onClick}
                  className="rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--ss-accent,#38bdf8)]"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 85%, transparent)',
                  }}
                >
                  <div className="text-[11px] uppercase tracking-wider opacity-65">
                    {stat.label}
                  </div>
                  <div className="mt-0.5 text-sm font-bold">{stat.value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Interactive Live Silicon Preview Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-2xl border p-5 shadow-2xl backdrop-blur-md"
              style={{
                borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 28%, var(--ss-border, #1e293b))',
                backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 92%, transparent)',
              }}
            >
              <div
                className="mb-4 flex items-center justify-between border-b pb-3"
                style={{ borderColor: 'var(--ss-border, #1e293b)' }}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Terminal className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
                  <span>LIVE PREVIEW</span>
                </div>

                {/* Interactive 8085 / 8086 Switcher */}
                <div
                  className="inline-flex rounded-lg border p-0.5 font-mono text-[11px]"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'var(--ss-bg, #070b14)',
                  }}
                >
                  {(['8085', '8086'] as const).map((arch) => {
                    const active = previewArch === arch;
                    return (
                      <button
                        key={arch}
                        type="button"
                        onClick={() => setPreviewArch(arch)}
                        className="rounded-md px-2.5 py-1 font-bold transition-all"
                        style={{
                          backgroundColor: active ? 'var(--ss-accent, #38bdf8)' : 'transparent',
                          color: active ? '#06101c' : 'var(--ss-muted, #94a3b8)',
                        }}
                      >
                        {arch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <pre
                className="overflow-x-auto rounded-xl border p-3.5 font-mono text-xs leading-relaxed"
                style={{
                  borderColor: 'var(--ss-border, #1e293b)',
                  backgroundColor: 'var(--ss-bg, #070b14)',
                }}
              >
                {heroData.code}
              </pre>

              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
                {heroData.regs.map((r) => (
                  <div
                    key={r.k}
                    className="rounded-lg border px-3 py-2"
                    style={{
                      borderColor: 'var(--ss-border, #1e293b)',
                      backgroundColor: 'var(--ss-bg, #070b14)',
                    }}
                  >
                    <div className="text-[10px] opacity-60">{r.k}</div>
                    <div className="font-bold" style={{ color: 'var(--ss-accent, #38bdf8)' }}>
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11px]" style={{ borderColor: 'var(--ss-border, #1e293b)' }}>
                <span className="opacity-75">
                  {heroData.bus} · <strong>{heroData.cycles}</strong>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenArchHistory(previewArch)}
                    className="font-semibold opacity-80 hover:opacity-100 hover:underline"
                  >
                    {previewArch} History
                  </button>
                  <button
                    type="button"
                    onClick={onLaunchStudio}
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                    style={{ color: 'var(--ss-accent, #38bdf8)' }}
                  >
                    Run <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PAGE 2: HOW THE PROJECT WORKS ==================== */}
      <section
        ref={pageRefs[1]}
        data-page-index={1}
        className="flex min-h-screen items-center border-t px-4 py-20 sm:px-6"
        style={{ borderColor: 'var(--ss-border, #1e293b)' }}
      >
        <div className="mx-auto w-full max-w-6xl space-y-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: 'var(--ss-accent, #38bdf8)' }}
              >
                02 · How It Works
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                From Assembly Source to Live Silicon in Three Steps
              </h2>
            </div>
            <button
              type="button"
              onClick={() => scrollToPage(2)}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
              style={{ borderColor: 'var(--ss-border, #1e293b)' }}
            >
              <span>Team & Reviews</span>
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Code2,
                title: 'Write, Search & Assemble',
                desc: 'Edit 8085 or 8086 assembly with instant two-pass assembling, Ctrl+F opcode search, Ctrl+G line jump, and clickable diagnostic errors.',
                points: ['Per-architecture code buffers', 'Syllabus presets built in', 'One-click .LST & .HEX export'],
              },
              {
                step: '02',
                icon: Zap,
                title: 'Step Forward, Back & Inspect',
                desc: 'Execute instruction-by-instruction or at custom clock speeds while watching registers, flags, memory hex pages, and bus cycles update.',
                points: ['Time-travel Step Back history', 'Interactive CPU block diagram', 'Live Trainer Kit I/O ports'],
              },
              {
                step: '03',
                icon: Bot,
                title: 'Debug with Silicon Copilot',
                desc: 'Use Offline Mode (assembler-verified solver + in-browser CPU AI) or Online Mode (Gemini + Search) to generate code and control the studio.',
                points: ['0-error assembler verification', 'Reads live registers & flags', 'Hands-free step, run & load'],
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.step}
                  type="button"
                  onClick={onLaunchStudio}
                  className="group flex flex-col justify-between rounded-2xl border p-6 text-left transition-all hover:-translate-y-1 hover:border-[var(--ss-accent,#38bdf8)]"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 14%, transparent)',
                          color: 'var(--ss-accent, #38bdf8)',
                        }}
                      >
                        STEP {card.step}
                      </span>
                      <Icon className="h-5 w-5 opacity-75 transition-transform group-hover:scale-110" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{card.title}</h3>
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: 'var(--ss-muted, #94a3b8)' }}
                    >
                      {card.desc}
                    </p>
                  </div>

                  <ul
                    className="mt-5 space-y-2 border-t pt-4 text-xs"
                    style={{ borderColor: 'var(--ss-border, #1e293b)' }}
                  >
                    {card.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2">
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: 'var(--ss-accent, #38bdf8)' }}
                        />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Clickable Dual Architecture History Strip */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onOpenArchHistory('8085')}
              className="group flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--ss-accent,#38bdf8)]"
              style={{
                borderColor: 'var(--ss-border, #1e293b)',
                backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
              }}
            >
              <div className="flex items-start gap-4">
                <Layers
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: 'var(--ss-accent, #38bdf8)' }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">8-Bit Mode · Intel 8085 (1976)</span>
                    <span className="rounded px-1.5 py-0.5 font-mono text-[10px] opacity-75" style={{ backgroundColor: 'var(--ss-bg, #070b14)' }}>
                      ~6,500T · 3–6 MHz
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: 'var(--ss-muted, #94a3b8)' }}
                  >
                    Full A, B, C, D, E, H, L, SP, PC registers, 5 status flags, machine cycles
                    (OF, MR, MW), and 64KB memory matrix.
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold"
                    style={{ color: 'var(--ss-accent, #38bdf8)' }}
                  >
                    Explore 8085 History & Assembly Guide{' '}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenArchHistory('8086')}
              className="group flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--ss-accent,#38bdf8)]"
              style={{
                borderColor: 'var(--ss-border, #1e293b)',
                backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
              }}
            >
              <div className="flex items-start gap-4">
                <Cpu
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: 'var(--ss-accent, #38bdf8)' }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">16-Bit Mode · Intel 8086 (1978)</span>
                    <span className="rounded px-1.5 py-0.5 font-mono text-[10px] opacity-75" style={{ backgroundColor: 'var(--ss-bg, #070b14)' }}>
                      29,277T · 5–10 MHz
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: 'var(--ss-muted, #94a3b8)' }}
                  >
                    16-bit AX, BX, CX, DX, SI, DI, BP, SP, IP registers, BIU/EU pipeline view,
                    segmented 1MB addressing, and x86 roots.
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold"
                    style={{ color: 'var(--ss-accent, #38bdf8)' }}
                  >
                    Explore 8086 History & Assembly Guide{' '}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== PAGE 3: TESTIMONIALS & TEAM ==================== */}
      <section
        ref={pageRefs[2]}
        data-page-index={2}
        className="flex min-h-screen items-center border-t px-4 py-20 sm:px-6"
        style={{ borderColor: 'var(--ss-border, #1e293b)' }}
      >
        <div className="mx-auto w-full max-w-6xl space-y-10">
          {/* Testimonials */}
          <div>
            <div
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--ss-accent, #38bdf8)' }}
            >
              03 · Testimonials & Builders
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              Reviewed in the Lab, Built by Four Engineers
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <button
                  key={t.role}
                  type="button"
                  onClick={onLaunchStudio}
                  className="flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:border-[var(--ss-accent,#38bdf8)]"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
                  }}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Quote
                        className="h-5 w-5 opacity-75"
                        style={{ color: 'var(--ss-accent, #38bdf8)' }}
                      />
                      <div className="flex gap-0.5" style={{ color: '#fbbf24' }}>
                        {[0, 1, 2, 3, 4].map((s) => (
                          <Star key={s} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed sm:text-sm">“{t.quote}”</p>
                  </div>
                  <div
                    className="mt-4 border-t pt-3"
                    style={{ borderColor: 'var(--ss-border, #1e293b)' }}
                  >
                    <div className="text-xs font-bold">{t.role}</div>
                    <div className="text-[11px] opacity-65">{t.dept}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Clickable Team Members */}
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider uppercase opacity-80">
              <Users className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <span>Project Team · Click any member to inspect their modules & contributions</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM_MEMBERS.map((member, idx) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onOpenMember(member.id)}
                  className="group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 hover:border-[var(--ss-accent,#38bdf8)]"
                  style={{
                    borderColor:
                      idx === 0
                        ? 'color-mix(in srgb, var(--ss-accent, #38bdf8) 40%, var(--ss-border, #1e293b))'
                        : 'var(--ss-border, #1e293b)',
                    backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold"
                        style={{
                          borderColor: 'var(--ss-accent, #38bdf8)',
                          backgroundColor:
                            'color-mix(in srgb, var(--ss-accent, #38bdf8) 14%, transparent)',
                          color: 'var(--ss-accent, #38bdf8)',
                        }}
                      >
                        {member.initials}
                      </div>
                      {idx === 0 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--ss-accent, #38bdf8) 16%, transparent)',
                            color: 'var(--ss-accent, #38bdf8)',
                          }}
                        >
                          Lead Architect
                        </span>
                      )}
                    </div>

                    <div className="mt-3 text-sm font-bold">{member.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug opacity-70">
                      {member.role}
                    </div>
                  </div>

                  <div
                    className="mt-3 inline-flex items-center gap-1 border-t pt-2.5 text-[11px] font-bold"
                    style={{
                      borderColor: 'var(--ss-border, #1e293b)',
                      color: 'var(--ss-accent, #38bdf8)',
                    }}
                  >
                    <span>View Contributions</span>
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Final Launch Banner */}
          <div
            className="flex flex-col items-start justify-between gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center"
            style={{
              borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 45%, transparent)',
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--ss-accent, #38bdf8) 14%, transparent), rgba(99, 102, 241, 0.10))',
            }}
          >
            <div>
              <h3 className="text-lg font-extrabold">Ready to run your 8085 or 8086 code?</h3>
              <p className="text-xs opacity-80">
                Launch the full 7-panel simulator, theme customizer, and offline/online AI Copilot.
              </p>
            </div>
            <button
              type="button"
              onClick={onLaunchStudio}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition-transform hover:scale-[1.03]"
              style={{
                backgroundColor: 'var(--ss-accent, #38bdf8)',
                color: '#06101c',
              }}
            >
              <span>Launch Silicon Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};