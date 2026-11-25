import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  Layers,
  Pause,
  Play,
  Plus,
  Quote,
  Star,
  Zap,
} from 'lucide-react';
import { TEAM_MEMBERS, TESTIMONIALS, type ArchitectureId } from '../../data/landingData';

interface LandingPageProps {
  onLaunchStudio: () => void;
  onOpenArchHistory: (arch: ArchitectureId) => void;
  onOpenMember: (memberId: string) => void;
}

interface CarouselSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  bgClass: string;
  onAction: 'studio' | '8085' | '8086';
}

const SLIDE_DURATION_MS = 9000;

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchStudio,
  onOpenArchHistory,
  onOpenMember,
}) => {
  const [activePage, setActivePage] = useState<0 | 1 | 2>(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const elapsedRef = useRef(0);

  const pageRefs = [
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
  ];

  const slides: CarouselSlide[] = [
    {
      id: 'compiler',
      tag: '8085 MINI COMPILER',
      title: 'Two-Pass Assembly to Machine Bytes',
      subtitle:
        'Compile 8085 mnemonics into exact 1/2/3-byte opcodes with symbol resolution and .LST/.HEX export.',
      ctaLabel: 'Launch Compiler',
      bgClass: 'bg-gradient-to-br from-[#1b2232] via-[#232c3f] to-[#151a26] text-[#f1f5f9]',
      onAction: 'studio',
    },
    {
      id: 'node-flow',
      tag: 'CONNECTED ARCHITECTURE',
      title: 'Editor → Assembler → CPU & Bus → 64KB RAM',
      subtitle:
        'Watch every compiled instruction flow across the internal data bus, ALU, and PSW flags in real time.',
      ctaLabel: 'Open Workbench',
      bgClass: 'bg-[#1c1f26] text-[#f1f5f9]',
      onAction: 'studio',
    },
    {
      id: 'arch-8085',
      tag: 'INTEL 8085 · 1976',
      title: '8-Bit Classic. Cycle-Accurate.',
      subtitle:
        'Explore 6,500-transistor history, multiplexed AD0–AD7 bus design, and live T-state timing.',
      ctaLabel: 'Explore 8085',
      bgClass: 'bg-gradient-to-br from-[#162944] via-[#1d3961] to-[#122036] text-[#f1f5f9]',
      onAction: '8085',
    },
    {
      id: 'arch-8086',
      tag: 'INTEL 8086 · 1978',
      title: '16-Bit x86 Origin. Built-In.',
      subtitle:
        'Switch seamlessly to 16-bit AX–DX registers, BIU/EU prefetch pipeline, and segmented 1MB memory.',
      ctaLabel: 'Explore 8086',
      bgClass: 'bg-gradient-to-br from-[#23262f] via-[#2b2f3a] to-[#1a1d24] text-[#f1f5f9]',
      onAction: '8086',
    },
  ];

  const scrollToPage = (index: 0 | 1 | 2) => {
    setActivePage(index);
    pageRefs[index].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (isPaused) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      elapsedRef.current += dt;

      if (elapsedRef.current >= SLIDE_DURATION_MS) {
        elapsedRef.current = 0;
        setProgress(0);
        setSlideIdx((s) => (s + 1) % slides.length);
      } else {
        setProgress((elapsedRef.current / SLIDE_DURATION_MS) * 100);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPaused, slides.length]);

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
      { threshold: 0.4 }
    );

    pageRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const selectSlide = (idx: number) => {
    elapsedRef.current = 0;
    setSlideIdx((idx + slides.length) % slides.length);
    setProgress(0);
  };

  const handleSlideAction = (action: 'studio' | '8085' | '8086') => {
    if (action === 'studio') onLaunchStudio();
    else onOpenArchHistory(action);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef1f5] text-[#1f2328] scroll-smooth">
      {/* Soft Frosted Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-black/[0.07] bg-[#f7f8fa]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => scrollToPage(0)}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#232730] text-white">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">8085 Mini Compiler</span>
          </button>

          <nav className="hidden items-center gap-6 text-xs font-medium text-[#5c6370] md:flex">
            {[
              { label: 'Overview', idx: 0 as const },
              { label: 'Architecture', idx: 1 as const },
              { label: 'Team & Reviews', idx: 2 as const },
            ].map((item) => (
              <button
                key={item.idx}
                type="button"
                onClick={() => scrollToPage(item.idx)}
                className={`transition-colors hover:text-[#1f2328] ${
                  activePage === item.idx ? 'font-semibold text-[#1f2328]' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onOpenArchHistory('8085')}
              className="transition-colors hover:text-[#1f2328]"
            >
              8085 History
            </button>
            <button
              type="button"
              onClick={() => onOpenArchHistory('8086')}
              className="transition-colors hover:text-[#1f2328]"
            >
              8086 History
            </button>
          </nav>

          <button
            type="button"
            onClick={onLaunchStudio}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0077ed] active:scale-[0.98]"
          >
            <span>Launch Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ==================== PAGE 1: EDITORIAL HERO + FLUID SLIDING CAROUSEL ==================== */}
      <section
        ref={pageRefs[0]}
        data-page-index={0}
        className="flex min-h-screen flex-col justify-center bg-[#f7f8fa] px-4 pt-20 pb-14 sm:px-6"
      >
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#1f2328] sm:text-6xl">
              8085 Mini Compiler.
              <br />
              <span className="text-[#646b75]">Compile. Step. Understand.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#5c6370] sm:text-base">
              Write 8085 or 8086 assembly, generate verified machine bytes, and watch every T-state,
              register, and bus transfer come alive in Silicon Studio.
            </p>
          </div>

          {/* Fluid Horizontal Sliding Showcase Carousel */}
          <div className="relative mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
              <div
                className="flex transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateX(-${slideIdx * 100}%)` }}
              >
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    className={`w-full shrink-0 p-6 sm:p-10 ${slide.bgClass}`}
                    style={{ minHeight: '360px' }}
                  >
                    <div className="grid h-full grid-cols-1 items-center gap-8 lg:grid-cols-12">
                      <div className="space-y-4 lg:col-span-6">
                        <span className="inline-block rounded-full bg-white/12 px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase">
                          {slide.tag}
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                          {slide.title}
                        </h2>
                        <p className="text-xs leading-relaxed text-white/75 sm:text-sm">
                          {slide.subtitle}
                        </p>
                      </div>

                      <div className="lg:col-span-6">
                        {slide.id === 'node-flow' ? (
                          <div
                            className="rounded-2xl border border-white/10 bg-[#14171f] p-4"
                            style={{
                              backgroundImage:
                                'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                              backgroundSize: '14px 14px',
                            }}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                              <div className="rounded-lg border border-white/15 bg-[#1e222d] px-3 py-2">
                                <span className="mb-1 block h-1.5 w-5 rounded-full bg-[#e05a33]" />
                                Editor.asm
                              </div>
                              <svg className="h-6 w-12 shrink-0" viewBox="0 0 48 24" fill="none">
                                <path
                                  d="M0 12 C 16 12, 32 4, 48 12"
                                  stroke="#e05a33"
                                  strokeWidth="2"
                                />
                              </svg>
                              <div className="rounded-lg border border-[#e05a33]/50 bg-[#1e222d] px-3 py-2">
                                <span className="mb-1 block h-1.5 w-5 rounded-full bg-[#e05a33]" />
                                2-Pass Compiler
                              </div>
                              <svg className="h-6 w-12 shrink-0" viewBox="0 0 48 24" fill="none">
                                <path
                                  d="M0 12 C 16 20, 32 12, 48 12"
                                  stroke="#e05a33"
                                  strokeWidth="2"
                                />
                              </svg>
                              <div className="rounded-lg border border-white/15 bg-[#1e222d] px-3 py-2">
                                <span className="mb-1 block h-1.5 w-5 rounded-full bg-emerald-400" />
                                CPU + RAM
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <span className="rounded-md bg-[#e05a33] px-3 py-1 text-[11px] font-bold text-white">
                                Live Execution Pipeline
                              </span>
                            </div>
                          </div>
                        ) : (
                          <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111520]/80 p-4 font-mono text-xs leading-relaxed text-emerald-300">
{slide.id === 'arch-8086'
  ? `        ORG 0100H
        MOV BX, 1200H
        MOV CX, 0004H
        MOV AX, 0000H
SUM_LP: ADD AX, [BX]
        INC BX
        INC BX
        LOOP SUM_LP
        HLT`
  : `        ORG 2000H
        MVI A, 5AH    ; 3E 5A
        MVI B, 00H    ; 06 00
        MVI C, 08H    ; 0E 08
LOOP:   RAR           ; 1F
        JNC NEXT      ; D2 0C 20
        INR B         ; 04
NEXT:   DCR C         ; 0D
        JNZ LOOP      ; C2 06 20
        HLT           ; 76`}
                          </pre>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSlideAction(slide.onAction)}
                          className="rounded-full bg-[#f7f8fa] px-4 py-1.5 text-xs font-bold text-[#1f2328] shadow transition-transform hover:scale-[1.03]"
                        >
                          {slide.ctaLabel}
                        </button>
                        <span className="text-xs text-white/75">
                          <strong>Silicon Studio</strong> · Click to inspect or run live
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Previous slide"
                          onClick={() => selectSlide(slideIdx - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next slide"
                          onClick={() => selectSlide(slideIdx + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress-Dot Pill + Pause/Play Button */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-[#dfe3ea] px-4 py-2.5">
                {slides.map((s, i) => {
                  const isActive = i === slideIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => selectSlide(i)}
                      className={`relative h-2 overflow-hidden rounded-full transition-all duration-300 ${
                        isActive ? 'w-10 bg-black/15' : 'w-2 bg-black/20 hover:bg-black/35'
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute top-0 left-0 bottom-0 rounded-full bg-[#232730]"
                          style={{ width: `${progress}%` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
                onClick={() => setIsPaused((p) => !p)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe3ea] text-[#232730] transition-colors hover:bg-[#d2d7e0]"
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PAGE 2: SOFT BENTO GRID + 8085 & 8086 HISTORY ==================== */}
      <section
        ref={pageRefs[1]}
        data-page-index={1}
        className="flex min-h-screen items-center px-4 py-20 sm:px-6"
      >
        <div className="mx-auto w-full max-w-5xl space-y-8">
          {/* Soft Iridescent Glow Banner */}
          <div
            className="relative rounded-3xl p-[1px] shadow-md"
            style={{ background: 'linear-gradient(90deg, #93c5fd, #fde68a, #fca5a5)' }}
          >
            <div className="flex flex-col items-center justify-between gap-4 rounded-[23px] bg-[#f7f8fa] px-6 py-5 text-center sm:flex-row sm:text-left">
              <div>
                <div className="text-xs font-semibold text-[#5c6370]">For Students & Evaluators</div>
                <div className="text-sm font-bold text-[#1f2328] sm:text-base">
                  Open the full 7-panel 8085 Mini Compiler & Simulator Workbench
                </div>
              </div>
              <button
                type="button"
                onClick={onLaunchStudio}
                className="shrink-0 rounded-full bg-[#232730] px-5 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                Launch Studio
              </button>
            </div>
          </div>

          {/* 2-Column Soft Bento Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Soft Mist Card 1 */}
            <button
              type="button"
              onClick={onLaunchStudio}
              className="group relative flex flex-col justify-between rounded-3xl border border-black/[0.06] bg-[#f7f8fa] p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <Code2 className="h-7 w-7 text-[#0071e3]" />
                <h3 className="mt-4 text-xl font-bold">Two-Pass Mini Compiler</h3>
                <p className="mt-2 text-sm text-[#5c6370]">
                  Resolves labels, encodes 1/2/3-byte opcodes, highlights errors inline, and exports
                  .LST and .HEX files.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0071e3]">Try Assembler</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232730] text-white transition-transform group-hover:scale-110">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </button>

            {/* Soft Mist Card 2 */}
            <button
              type="button"
              onClick={onLaunchStudio}
              className="group relative flex flex-col justify-between rounded-3xl border border-black/[0.06] bg-[#f7f8fa] p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <Zap className="h-7 w-7 text-[#e05a33]" />
                <h3 className="mt-4 text-xl font-bold">Time-Travel CPU & Bus</h3>
                <p className="mt-2 text-sm text-[#5c6370]">
                  Step forward or backward through execution history while inspecting registers, PSW
                  flags, and 64KB RAM.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0071e3]">Inspect Telemetry</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232730] text-white transition-transform group-hover:scale-110">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </button>

            {/* Soft Matte Graphite Card: Intel 8085 History (Not harsh OLED black) */}
            <button
              type="button"
              onClick={() => onOpenArchHistory('8085')}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#1c1f26] p-7 text-left text-[#f1f5f9] shadow-sm transition-all hover:-translate-y-1 hover:bg-[#222630] hover:shadow-lg"
            >
              <div>
                <Layers className="h-7 w-7 text-[#38bdf8]" />
                <div className="mt-3 text-xs font-medium text-white/60">8-Bit Mode · 1976</div>
                <h3 className="mt-1 text-2xl font-bold">Intel 8085 History</h3>
                <p className="mt-2 text-sm text-white/75">
                  ~6,500 transistors, single +5V supply, multiplexed AD0–AD7 bus, and coding guide.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#38bdf8]">
                  Read 8085 History &rsaquo;
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f8fa] text-[#1f2328] transition-transform group-hover:scale-110">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </button>

            {/* Soft Matte Graphite Card: Intel 8086 History (Not harsh OLED black) */}
            <button
              type="button"
              onClick={() => onOpenArchHistory('8086')}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#1c1f26] p-7 text-left text-[#f1f5f9] shadow-sm transition-all hover:-translate-y-1 hover:bg-[#222630] hover:shadow-lg"
            >
              <div>
                <Bot className="h-7 w-7 text-[#e05a33]" />
                <div className="mt-3 text-xs font-medium text-white/60">16-Bit Mode · 1978</div>
                <h3 className="mt-1 text-2xl font-bold">Intel 8086 History</h3>
                <p className="mt-2 text-sm text-white/75">
                  29,277 transistors, Stephen Morse architecture, BIU/EU pipeline, and x86 roots.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#e05a33]">
                  Read 8086 History &rsaquo;
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f8fa] text-[#1f2328] transition-transform group-hover:scale-110">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== PAGE 3: TESTIMONIALS & 4-MEMBER TEAM ==================== */}
      <section
        ref={pageRefs[2]}
        data-page-index={2}
        className="flex min-h-screen items-center bg-[#f7f8fa] px-4 py-20 sm:px-6"
      >
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <div className="text-center">
            <div className="text-xs font-bold tracking-widest text-[#0071e3] uppercase">
              Lab Reviews & Builders
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built by Four Engineers.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.role}
                className="flex flex-col justify-between rounded-3xl border border-black/[0.06] bg-[#eef1f5] p-6"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Quote className="h-4 w-4 text-[#0071e3]" />
                    <div className="flex gap-0.5 text-[#f59e0b]">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <Star key={s} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[#1f2328] sm:text-sm">“{t.quote}”</p>
                </div>
                <div className="mt-4 border-t border-black/10 pt-3">
                  <div className="text-xs font-bold">{t.role}</div>
                  <div className="text-[11px] text-[#5c6370]">{t.dept}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM_MEMBERS.map((member, idx) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onOpenMember(member.id)}
                className="group flex flex-col justify-between rounded-3xl border border-black/[0.08] bg-[#eef1f5] p-5 text-left transition-all hover:-translate-y-1 hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#232730] font-mono text-sm font-bold text-white">
                      {member.initials}
                    </div>
                    {idx === 0 && (
                      <span className="rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0071e3]">
                        Lead Architect
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-sm font-bold">{member.name}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-[#5c6370]">{member.role}</div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3">
                  <span className="text-xs font-semibold text-[#0071e3]">Contributions</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#232730] text-white transition-transform group-hover:scale-110">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Soft Matte Graphite Launch Banner */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#1c1f26] p-7 text-[#f1f5f9] sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold">Make it yours. Start compiling.</h3>
              <p className="mt-1 text-xs text-white/70">
                Launch the 7-panel 8085 Mini Compiler, 8086 mode, and Offline AI Copilot.
              </p>
            </div>
            <button
              type="button"
              onClick={onLaunchStudio}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
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